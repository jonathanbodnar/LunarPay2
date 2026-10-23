/**
 * API key rotation (src/lib/api-auth.ts, scripts/sql/005-api-key-rotation.sql).
 *
 * A merchant's replaced publishable/secret key keeps authenticating, as the same
 * merchant, until previous_* is set back to NULL, so the platform holding it can
 * switch to the new key without an outage. Nothing about the rotation path may
 * turn a plain "key not found" into a 500 or block a request. New keys come from
 * a CSPRNG.
 *
 * Needs module mocks (Node >= 22.3); skips otherwise.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { NextRequest } from 'next/server';

const supported = typeof (mock as { module?: unknown }).module === 'function';
const skip = !supported && 'module mocks need Node >= 22.3';

type User = {
  id: number;
  active: boolean;
  secret_key: string | null;
  publishable_key: string | null;
  previous_secret_key: string | null;
  previous_publishable_key: string | null;
  previous_key_last_used_at: number | null;
};

type Agency = {
  id: number;
  name: string;
  isActive: boolean;
  apiKey: string;
  fortisTemplate: string | null;
  previous_api_key: string | null;
  previous_key_last_used_at: number | null;
};

const db = {
  users: [] as User[],
  agencies: [] as Agency[],
  queries: [] as string[],
  now: Date.parse('2026-10-23T12:00:00Z'),
  failPreviousLookup: false,
  failStamp: false,
};

const fakePrisma = {
  async $queryRawUnsafe(sql: string, key: string) {
    if (/FROM agencies/.test(sql)) {
      assert.match(sql, /WHERE previous_api_key = \$1 AND is_active = true/);
      db.queries.push('agencies.previous_api_key');
      if (db.failPreviousLookup) throw new Error('column "previous_api_key" does not exist');
      return db.agencies
        .filter((a) => a.isActive && a.previous_api_key === key)
        .slice(0, 1)
        .map((a) => ({ id: a.id, name: a.name, fortisTemplate: a.fortisTemplate }));
    }
    const col = /WHERE (\w+) = \$1 AND active = true/.exec(sql)?.[1] as keyof User | undefined;
    assert.ok(col, `unexpected query: ${sql}`);
    db.queries.push(col);
    if (col.startsWith('previous_') && db.failPreviousLookup) {
      throw new Error(`column "${col}" does not exist`);
    }
    return db.users.filter((u) => u.active && u[col] === key).slice(0, 1).map((u) => ({ id: u.id }));
  },
  async $executeRawUnsafe(sql: string, id: number) {
    // The real statement only stamps when the last stamp is over a minute old.
    const table = /UPDATE (users|agencies) SET previous_key_last_used_at = now\(\)/.exec(sql)?.[1];
    assert.ok(table, `unexpected statement: ${sql}`);
    assert.match(sql, /previous_key_last_used_at < now\(\) - interval '1 minute'/);
    db.queries.push(`stamp ${table}`);
    if (db.failStamp) throw new Error('connection reset');
    const row = (table === 'users' ? db.users : db.agencies).find((r) => r.id === id);
    if (!row) return 0;
    if (row.previous_key_last_used_at !== null && db.now - row.previous_key_last_used_at < 60_000) return 0;
    row.previous_key_last_used_at = db.now;
    return 1;
  },
  agency: {
    async findFirst({ where }: { where: { apiKey: string; isActive: boolean } }) {
      db.queries.push('agencies.api_key');
      return db.agencies.find((a) => a.apiKey === where.apiKey && a.isActive === where.isActive) ?? null;
    },
  },
  user: {
    async findUnique({ where }: { where: { id: number } }) {
      return {
        id: where.id,
        organizations: [
          {
            id: 1000 + where.id,
            fortisOnboarding: {
              appStatus: 'ACTIVE',
              authUserId: 'fortis-user',
              authUserApiKey: 'fortis-key',
              locationId: 'loc-1',
              productTransactionId: 'pt-cc',
              achProductTransactionId: 'pt-ach',
            },
          },
        ],
      };
    },
  },
};

type ApiAuth = typeof import('@/lib/api-auth');
let api: ApiAuth | undefined;
async function load(): Promise<ApiAuth> {
  if (api) return api;
  mock.module('next/server', { namedExports: { NextRequest: class {} } });
  mock.module('@/lib/prisma', { namedExports: { prisma: fakePrisma } });
  api = (await import('@/lib/api-auth')) as ApiAuth;
  return api;
}

const OLD_SK = 'lp_sk_' + 'o'.repeat(48);
const NEW_SK = 'lp_sk_' + 'n'.repeat(48);
const OLD_PK = 'lp_pk_' + 'o'.repeat(48);
const NEW_PK = 'lp_pk_' + 'n'.repeat(48);

/** RevOS's merchant (user 39) halfway through a rotation. */
function rotated(overrides: Partial<User> = {}) {
  db.users = [
    {
      id: 39,
      active: true,
      secret_key: NEW_SK,
      publishable_key: NEW_PK,
      previous_secret_key: OLD_SK,
      previous_publishable_key: OLD_PK,
      previous_key_last_used_at: null,
      ...overrides,
    },
  ];
  db.agencies = [];
  db.queries = [];
  db.failPreviousLookup = false;
  db.failStamp = false;
  return db.users[0];
}

const OLD_AGENCY = 'lp_agency_' + 'o'.repeat(48);
const NEW_AGENCY = 'lp_agency_' + 'n'.repeat(48);

/** Aligned (agency 2) halfway through a rotation. */
function rotatedAgency(overrides: Partial<Agency> = {}) {
  rotated();
  db.agencies = [
    {
      id: 2,
      name: 'Aligned AI',
      isActive: true,
      apiKey: NEW_AGENCY,
      fortisTemplate: 'AlignedChurch29FR',
      previous_api_key: OLD_AGENCY,
      previous_key_last_used_at: null,
      ...overrides,
    },
  ];
  return db.agencies[0];
}

const request = (key: string) => ({ headers: new Headers({ authorization: `Bearer ${key}` }) }) as unknown as NextRequest;

async function rejects401(promise: Promise<unknown>, message = 'API key not found.') {
  const { ApiAuthError } = await load();
  await assert.rejects(promise, (e: unknown) => {
    assert.ok(e instanceof ApiAuthError, `expected ApiAuthError, got ${String(e)}`);
    assert.equal(e.statusCode, 401);
    assert.equal(e.message, message);
    return true;
  });
}

test('the current key authenticates with one lookup and stamps nothing', { skip }, async () => {
  const { requireSecretKey, requirePublishableKey } = await load();
  rotated();
  const auth = await requireSecretKey(request(NEW_SK));
  assert.equal(auth.userId, 39);
  assert.equal(auth.organizationId, 1039);
  assert.equal(auth.fortisApiKey, 'fortis-key');
  assert.equal((await requirePublishableKey(request(NEW_PK))).userId, 39);
  assert.deepEqual(db.queries, ['secret_key', 'publishable_key']);
});

test('a rotated-out key keeps working as the same merchant, and its use is stamped', { skip }, async () => {
  const { requireSecretKey, requirePublishableKey } = await load();
  const user = rotated();
  const auth = await requireSecretKey(request(OLD_SK));
  assert.equal(auth.userId, 39);
  assert.equal(auth.organizationId, 1039);
  assert.deepEqual(db.queries, ['secret_key', 'previous_secret_key', 'stamp users']);
  assert.equal(user.previous_key_last_used_at, db.now);

  db.queries = [];
  assert.equal((await requirePublishableKey(request(OLD_PK))).userId, 39);
  assert.deepEqual(db.queries, ['publishable_key', 'previous_publishable_key', 'stamp users']);
});

test('an unknown key is a 401 after both lookups, and nothing is stamped', { skip }, async () => {
  const { requireSecretKey } = await load();
  rotated();
  await rejects401(requireSecretKey(request('lp_sk_' + 'x'.repeat(48))));
  assert.deepEqual(db.queries, ['secret_key', 'previous_secret_key']);
});

test('if the previous-key lookup fails (005 not applied yet), unknown keys are still a 401 and current keys still work', { skip }, async () => {
  const { requireSecretKey } = await load();
  rotated();
  db.failPreviousLookup = true;
  await rejects401(requireSecretKey(request(OLD_SK)));
  assert.equal((await requireSecretKey(request(NEW_SK))).userId, 39);
});

test('a failing stamp never blocks the request', { skip }, async () => {
  const { requireSecretKey } = await load();
  rotated();
  db.failStamp = true;
  assert.equal((await requireSecretKey(request(OLD_SK))).userId, 39);
});

test('once revoked (previous_* back to NULL) the old keys are rejected and the new ones still work', { skip }, async () => {
  const { requireSecretKey, requirePublishableKey } = await load();
  rotated({ previous_secret_key: null, previous_publishable_key: null });
  await rejects401(requireSecretKey(request(OLD_SK)));
  await rejects401(requirePublishableKey(request(OLD_PK)));
  assert.equal((await requireSecretKey(request(NEW_SK))).userId, 39);
});

test('an inactive merchant is rejected with either key', { skip }, async () => {
  const { requireSecretKey } = await load();
  rotated({ active: false });
  await rejects401(requireSecretKey(request(NEW_SK)));
  await rejects401(requireSecretKey(request(OLD_SK)));
});

test('an old secret key is never accepted where a publishable key is required', { skip }, async () => {
  const { requirePublishableKey } = await load();
  rotated();
  await rejects401(
    requirePublishableKey(request(OLD_SK)),
    'Invalid or missing publishable API key. Use your lp_pk_... key.'
  );
  assert.deepEqual(db.queries, []);
});

test('agency keys: the current key needs one lookup; a rotated-out key keeps working as the same agency and is stamped', { skip }, async () => {
  const { requireAgencyKey } = await load();
  const agency = rotatedAgency();
  assert.deepEqual(await requireAgencyKey(request(NEW_AGENCY)), {
    agencyId: 2,
    agencyName: 'Aligned AI',
    fortisTemplate: 'AlignedChurch29FR',
  });
  assert.deepEqual(db.queries, ['agencies.api_key']);

  db.queries = [];
  assert.deepEqual(await requireAgencyKey(request(OLD_AGENCY)), {
    agencyId: 2,
    agencyName: 'Aligned AI',
    fortisTemplate: 'AlignedChurch29FR',
  });
  assert.deepEqual(db.queries, ['agencies.api_key', 'agencies.previous_api_key', 'stamp agencies']);
  assert.equal(agency.previous_key_last_used_at, db.now);
});

test('agency keys: unknown, revoked, inactive or failing lookups are all a 401', { skip }, async () => {
  const { requireAgencyKey } = await load();
  const notFound = 'Agency API key not found or inactive.';
  rotatedAgency();
  await rejects401(requireAgencyKey(request('lp_agency_' + 'x'.repeat(48))), notFound);
  rotatedAgency({ previous_api_key: null });
  await rejects401(requireAgencyKey(request(OLD_AGENCY)), notFound);
  rotatedAgency({ isActive: false });
  await rejects401(requireAgencyKey(request(OLD_AGENCY)), notFound);
  rotatedAgency();
  db.failPreviousLookup = true;
  await rejects401(requireAgencyKey(request(OLD_AGENCY)), notFound);
  rotatedAgency();
  db.failStamp = true;
  assert.equal((await requireAgencyKey(request(OLD_AGENCY))).agencyId, 2);
});

test('generateApiKey mints prefix + 48 characters of [A-Za-z0-9] without Math.random', { skip }, async (t) => {
  const { generateApiKey } = await load();
  t.mock.method(Math, 'random', () => {
    throw new Error('Math.random must not be used for credentials');
  });
  for (const prefix of ['lp_sk_', 'lp_pk_', 'lp_agency_'] as const) {
    const keys = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const key = generateApiKey(prefix);
      assert.match(key, new RegExp(`^${prefix}[A-Za-z0-9]{48}$`));
      keys.add(key);
    }
    assert.equal(keys.size, 200);
  }
});
