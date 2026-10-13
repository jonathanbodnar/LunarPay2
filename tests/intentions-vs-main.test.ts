/**
 * POST /api/v1/intentions — the branch against main itself
 * (tests/fixtures/main/intentions-route.ts, a verbatim copy of origin/main).
 *
 * Both routes run against the same mocked auth, Fortis client and Prisma. For
 * every request that is not ['ach'], the branch must send Fortis the same
 * calls with the same bodies and return byte-for-byte the same response.
 * Needs module mocks (Node >= 22.3); skips otherwise.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const supported = typeof (mock as { module?: unknown }).module === 'function';

type Answer = { status: boolean; clientToken?: string; message?: string };
type Auth = {
  organizationId: number;
  fortisUserId: string;
  fortisApiKey: string;
  fortisLocationId: string | null;
  fortisCcProductTransactionId: string | null;
  fortisAchProductTransactionId: string | null;
};

const world = {
  auth: null as Auth | null,
  authError: null as { message: string; statusCode: number } | null,
  intention: { status: true, clientToken: 'tok' } as Answer,
  ticket: { status: true, clientToken: 'ticket-tok' } as Answer,
  locations: { status: true, locations: [{ id: 'loc-from-fortis' }] } as { status: boolean; locations?: { id: string }[] },
  calls: [] as Array<{ fn: string; args: unknown[] }>,
};

class FakeApiAuthError extends Error {
  constructor(public message: string, public statusCode = 401) {
    super(message);
  }
}

const BASE_AUTH: Auth = {
  organizationId: 109,
  fortisUserId: 'user',
  fortisApiKey: 'key',
  fortisLocationId: 'loc-1',
  fortisCcProductTransactionId: 'cc-1',
  fortisAchProductTransactionId: 'ach-1',
};

async function call(POST: (r: Request) => Promise<Response>, body: unknown) {
  world.calls = [];
  const res = await POST(
    new Request('https://app.lunarpay.com/api/v1/intentions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    body: await res.text(),
    calls: JSON.parse(JSON.stringify(world.calls)),
  };
}

test('intentions: everything but [\'ach\'] is byte-identical to main', { skip: !supported && 'module mocks need Node >= 22.3' }, async (t) => {
  mock.module('next/server', { namedExports: { NextRequest: Request } });
  mock.module('@/lib/prisma', {
    namedExports: {
      prisma: {
        fortisOnboarding: {
          updateMany: async (args: unknown) => {
            world.calls.push({ fn: 'prisma.fortisOnboarding.updateMany', args: [args] });
            return { count: 1 };
          },
        },
      },
    },
  });
  mock.module('@/lib/api-auth', {
    namedExports: {
      ApiAuthError: FakeApiAuthError,
      requirePublishableKey: async () => {
        if (world.authError) throw new FakeApiAuthError(world.authError.message, world.authError.statusCode);
        return world.auth;
      },
      // the real implementation, verbatim
      apiError: (message: string, status: number, details?: unknown) =>
        Response.json({ error: message, ...(details ? { details } : {}) }, { status }),
    },
  });
  mock.module('@/lib/fortis/client', {
    namedExports: {
      createFortisClient: (...args: unknown[]) => {
        world.calls.push({ fn: 'createFortisClient', args });
        return {
          createTransactionIntention: async (data: unknown) => {
            world.calls.push({ fn: 'createTransactionIntention', args: [data] });
            return world.intention;
          },
          createTicketIntention: async (data: unknown) => {
            world.calls.push({ fn: 'createTicketIntention', args: [data] });
            return world.ticket;
          },
          getLocations: async () => {
            world.calls.push({ fn: 'getLocations', args: [] });
            return world.locations;
          },
        };
      },
    },
  });

  const main = (await import('./fixtures/main/intentions-route')) as { POST: (r: Request) => Promise<Response> };
  const branch = (await import('@/app/api/v1/intentions/route')) as unknown as { POST: (r: Request) => Promise<Response> };

  const bodies: unknown[] = [
    { action: 'tokenization', paymentMethods: ['cc'] },
    { action: 'tokenization', paymentMethods: ['cc', 'ach'] },
    { action: 'tokenization', paymentMethods: ['ach', 'cc'] },
    { action: 'tokenization' },
    { action: 'tokenization', paymentMethod: 'cc' },
    { action: 'tokenization', paymentMethod: 'any' },
    { action: 'tokenization', paymentMethods: ['cc'], paymentMethod: 'ach' }, // the array wins → card
    { action: 'tokenization', paymentMethods: ['cc'], hasRecurring: true },
    { action: 'tokenization', paymentMethods: [] }, // validation error
    { action: 'tokenization', paymentMethods: ['wire'] }, // validation error
    'not json',
  ];
  const auths: Array<[string, Auth]> = [
    ['both products', BASE_AUTH],
    ['no card product', { ...BASE_AUTH, fortisCcProductTransactionId: null }],
    ['no ACH product', { ...BASE_AUTH, fortisAchProductTransactionId: null }],
    ['no products', { ...BASE_AUTH, fortisCcProductTransactionId: null, fortisAchProductTransactionId: null }],
    ['card id = ACH id', { ...BASE_AUTH, fortisAchProductTransactionId: 'cc-1' }],
    ['no location on file', { ...BASE_AUTH, fortisLocationId: null }],
  ];
  const answers: Array<[string, Answer]> = [
    ['token', { status: true, clientToken: 'tok' }],
    ['Fortis error', { status: false, message: '"methods" is not allowed' }],
    ['Fortis error without message', { status: false }],
    ['ok without token', { status: true }],
  ];

  let compared = 0;
  for (const [authName, auth] of auths) {
    for (const [answerName, answer] of answers) {
      for (const body of bodies) {
        await t.test(`${authName} · ${answerName} · ${JSON.stringify(body)}`, async () => {
          world.auth = auth;
          world.authError = null;
          world.intention = answer;
          world.locations = { status: true, locations: [{ id: 'loc-from-fortis' }] };
          const original = console.error; // both routes log the same parse errors
          console.error = () => {};
          try {
            const expected = await call(main.POST, body);
            const actual = await call(branch.POST, body);
            assert.deepEqual(actual, expected);
          } finally {
            console.error = original;
          }
          compared++;
        });
      }
    }
  }

  await t.test('location lookup failing, and an auth failure, are identical too', async () => {
    world.auth = { ...BASE_AUTH, fortisLocationId: null };
    world.locations = { status: false };
    for (const body of [{ action: 'tokenization', paymentMethods: ['cc'] }, { action: 'tokenization' }]) {
      assert.deepEqual(await call(branch.POST, body), await call(main.POST, body));
    }
    world.authError = { message: 'Invalid publishable key', statusCode: 401 };
    const body = { action: 'tokenization', paymentMethods: ['cc'] };
    assert.deepEqual(await call(branch.POST, body), await call(main.POST, body));
    world.authError = null;
  });

  await t.test('sanity: the card form request really is the old body', async () => {
    world.auth = BASE_AUTH;
    world.intention = { status: true, clientToken: 'tok' };
    const r = await call(branch.POST, { action: 'tokenization', paymentMethods: ['cc'] });
    const intention = r.calls.find((c: { fn: string }) => c.fn === 'createTransactionIntention');
    assert.deepEqual(intention.args, [{ location_id: 'loc-1', action: 'tokenization' }]);
    assert.equal(
      r.body,
      JSON.stringify({ clientToken: 'tok', intentionType: 'tokenization', paymentMethod: 'cc', locationId: 'loc-1', productTransactionId: null, environment: 'sandbox' }),
    );
    assert.ok(compared >= auths.length * answers.length * bodies.length);
  });

  // ── ['ach'] — intentionally different from main ──
  await t.test("['ach'] scopes the form to the ACH product; response keeps main's shape", async () => {
    world.auth = BASE_AUTH;
    world.intention = { status: true, clientToken: 'ach-tok' };
    for (const body of [{ action: 'tokenization', paymentMethods: ['ach'] }, { action: 'tokenization', paymentMethod: 'ach' }]) {
      const r = await call(branch.POST, body);
      assert.equal(r.status, 200);
      const intention = r.calls.find((c: { fn: string }) => c.fn === 'createTransactionIntention');
      assert.deepEqual(intention.args, [
        { location_id: 'loc-1', action: 'tokenization', methods: [{ type: 'ach', product_transaction_id: 'ach-1' }] },
      ]);
      assert.equal(
        r.body,
        JSON.stringify({ clientToken: 'ach-tok', intentionType: 'tokenization', paymentMethod: 'ach', locationId: 'loc-1', productTransactionId: null, environment: 'sandbox' }),
      );
    }
  });

  await t.test("['ach'] never returns an unscoped form: stable 4xx codes instead", async () => {
    const original = console.error;
    console.error = () => {};
    try {
      world.auth = { ...BASE_AUTH, fortisAchProductTransactionId: 'cc-1' }; // same id as the card product
      let r = await call(branch.POST, { action: 'tokenization', paymentMethods: ['ach'] });
      assert.equal(r.status, 400);
      assert.equal(JSON.parse(r.body).code, 'ACH_NOT_ENABLED');
      assert.equal(r.calls.filter((c: { fn: string }) => c.fn === 'createTransactionIntention').length, 0);

      world.auth = BASE_AUTH;
      world.intention = { status: false, message: '"methods" is not allowed' };
      r = await call(branch.POST, { action: 'tokenization', paymentMethods: ['ach'] });
      assert.equal(r.status, 422);
      assert.equal(JSON.parse(r.body).code, 'ACH_METHODS_UNSUPPORTED');
      assert.equal(JSON.parse(r.body).clientToken, undefined);
      assert.equal(r.calls.filter((c: { fn: string }) => c.fn === 'createTransactionIntention').length, 1);

      world.intention = { status: false, message: 'Location not found' };
      r = await call(branch.POST, { action: 'tokenization', paymentMethods: ['ach'] });
      assert.equal(r.status, 400);
      assert.deepEqual(JSON.parse(r.body), { error: 'Location not found', code: 'ACH_INTENTION_FAILED' });
    } finally {
      console.error = original;
    }
  });
});
