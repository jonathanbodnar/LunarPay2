/**
 * In-memory stand-in for the slice of the Prisma client that the ACH
 * settlement, webhook outbox and job lock modules use. It evaluates the same
 * `where` shapes Prisma would (equality, null, in, not, lt/lte/gt/gte,
 * endsWith, OR, NOT), so tests exercise the real selection predicates and the
 * conditional (compare-and-set) writes rather than canned answers.
 * $transaction snapshots state and restores it if the callback throws.
 */
import type { AchDb, AchTxRow } from '@/lib/fortis/ach-settlement';

type Row = Record<string, unknown>;

function eq(a: unknown, b: unknown): boolean {
  if (typeof a === 'bigint' || typeof b === 'bigint') return String(a) === String(b);
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
}

function cmp(a: unknown, b: unknown): number {
  const x = a instanceof Date ? a.getTime() : (a as number);
  const y = b instanceof Date ? b.getTime() : (b as number);
  return x < y ? -1 : x > y ? 1 : 0;
}

export function matches(row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === 'OR') {
      if (!(cond as Row[]).some((c) => matches(row, c))) return false;
      continue;
    }
    if (key === 'AND') {
      if (!(cond as Row[]).every((c) => matches(row, c))) return false;
      continue;
    }
    if (key === 'NOT') {
      const list = Array.isArray(cond) ? (cond as Row[]) : [cond as Row];
      if (list.some((c) => matches(row, c))) return false;
      continue;
    }
    const value = row[key];
    if (cond === null) {
      if (value !== null && value !== undefined) return false;
      continue;
    }
    if (typeof cond !== 'object' || cond instanceof Date || typeof cond === 'bigint') {
      if (!eq(value, cond)) return false;
      continue;
    }
    const ops = cond as Row;
    if ('in' in ops && !(ops.in as unknown[]).some((x) => eq(value, x))) return false;
    if ('notIn' in ops && (ops.notIn as unknown[]).some((x) => eq(value, x))) return false;
    if ('not' in ops) {
      if (ops.not === null ? value === null || value === undefined : eq(value, ops.not)) return false;
    }
    if ('lt' in ops && !(value != null && cmp(value, ops.lt) < 0)) return false;
    if ('lte' in ops && !(value != null && cmp(value, ops.lte) <= 0)) return false;
    if ('gt' in ops && !(value != null && cmp(value, ops.gt) > 0)) return false;
    if ('gte' in ops && !(value != null && cmp(value, ops.gte) >= 0)) return false;
    if ('endsWith' in ops && !(typeof value === 'string' && value.endsWith(ops.endsWith as string))) return false;
  }
  return true;
}

function applyData(row: Row, data: Row) {
  for (const [key, change] of Object.entries(data)) {
    if (change && typeof change === 'object' && !(change instanceof Date) && ('increment' in (change as Row) || 'decrement' in (change as Row))) {
      const current = row[key];
      const by = 'increment' in (change as Row) ? Number((change as Row).increment) : -Number((change as Row).decrement);
      row[key] = current === null || current === undefined ? null : Math.round((Number(current) + by) * 100) / 100;
    } else {
      row[key] = change;
    }
  }
}

function sortRows(rows: Row[], orderBy: Row | undefined): Row[] {
  if (!orderBy) return rows;
  const [[key, dir]] = Object.entries(orderBy) as [string, 'asc' | 'desc'][];
  return [...rows].sort((a, b) => cmp(a[key], b[key]) * (dir === 'asc' ? 1 : -1));
}

function pick(row: Row, select: Row | undefined): Row {
  if (!select) return { ...row };
  const out: Row = {};
  for (const [k, v] of Object.entries(select)) if (v) out[k] = row[k];
  return out;
}

export interface FakeDonor {
  id: number;
  amountAcum: number | null;
  feeAcum: number | null;
  netAcum: number | null;
  firstDate: Date | null;
}

export interface FakeOrg {
  id: number;
  webhookUrl: string | null;
  webhookSecret: string | null;
  fortisOnboarding: { authUserId: string | null; authUserApiKey: string | null } | null;
}

export interface FakeSource {
  id: number;
  organizationId: number;
  donorId: number;
  fortisWalletId: string;
}

export interface FakeSubscription {
  id: number;
  status: string;
  consecutiveFailures: number;
  failTrxns: number | null;
  donorId: number;
  email: string;
  cancelledAt?: Date | null;
}

export interface FakeOutboxRow {
  id: bigint;
  organizationId: number;
  transactionId: bigint | null;
  event: string;
  payload: string;
  dedupeKey: string;
  status: string;
  attempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  deliveredAt: Date | null;
}

class UniqueViolation extends Error {
  code = 'P2002';
}

export function createFakeAchDb(seed: {
  transactions?: AchTxRow[];
  donors?: FakeDonor[];
  orgs?: FakeOrg[];
  sources?: FakeSource[];
  subscriptions?: FakeSubscription[];
  outbox?: FakeOutboxRow[];
}) {
  const state = {
    transactions: (seed.transactions ?? []).map((t) => ({ ...t })) as Row[],
    donors: (seed.donors ?? []).map((d) => ({ ...d })) as Row[],
    orgs: (seed.orgs ?? []).map((o) => ({ ...o })) as Row[],
    sources: (seed.sources ?? []).map((s) => ({ ...s })) as Row[],
    subscriptions: (seed.subscriptions ?? []).map((s) => ({ cancelledAt: null, ...s })) as Row[],
    outbox: (seed.outbox ?? []).map((o) => ({ ...o })) as Row[],
    locks: [] as Row[],
    writes: [] as Array<{ table: string; where: Row; data: Row; count: number }>,
    findManyCalls: [] as Row[],
    nextOutboxId: BigInt(1000),
  };

  const tables = ['transactions', 'donors', 'subscriptions', 'outbox', 'locks'] as const;
  const snapshot = () =>
    JSON.stringify(
      Object.fromEntries(tables.map((t) => [t, state[t]])),
      (_k, v) => (typeof v === 'bigint' ? { __bigint: v.toString() } : v),
    );
  const DATE_KEYS = new Set(['createdAt', 'updatedAt', 'firstDate', 'cancelledAt', 'nextAttemptAt', 'deliveredAt', 'lockedUntil']);
  const restore = (snap: string) => {
    const parsed = JSON.parse(snap, (k, v) => {
      if (v && typeof v === 'object' && '__bigint' in v) return BigInt(v.__bigint);
      if (DATE_KEYS.has(k) && typeof v === 'string') return new Date(v);
      return v;
    });
    for (const t of tables) state[t] = parsed[t];
  };

  const record = (table: string, where: Row, data: Row, count: number) => state.writes.push({ table, where, data, count });

  const db = {
    transaction: {
      async findMany(args: { where?: Row; orderBy?: Row; take?: number; select?: Row }) {
        state.findManyCalls.push(args as Row);
        let rows = sortRows(state.transactions.filter((r) => matches(r, args.where)), args.orderBy);
        if (args.take !== undefined) rows = rows.slice(0, args.take);
        return rows.map((r) => pick(r, args.select));
      },
      async findUnique(args: { where: Row; select?: Row }) {
        const row = state.transactions.find((r) => matches(r, args.where));
        return row ? pick(row, args.select) : null;
      },
      async updateMany(args: { where: Row; data: Row }) {
        const rows = state.transactions.filter((r) => matches(r, args.where));
        rows.forEach((r) => applyData(r, args.data));
        record('transaction', args.where, args.data, rows.length);
        return { count: rows.length };
      },
    },
    donor: {
      async updateMany(args: { where: Row; data: Row }) {
        const rows = state.donors.filter((r) => matches(r, args.where));
        rows.forEach((r) => applyData(r, args.data));
        record('donor', args.where, args.data, rows.length);
        return { count: rows.length };
      },
    },
    organization: {
      async findUnique(args: { where: Row; select?: Row }) {
        const row = state.orgs.find((r) => matches(r, args.where));
        return row ? { ...row } : null;
      },
    },
    source: {
      async findFirst(args: { where: Row }) {
        const row = state.sources.find((r) => matches(r, args.where));
        return row ? { id: row.id } : null;
      },
    },
    subscription: {
      async findUnique(args: { where: Row; select?: Row }) {
        const row = state.subscriptions.find((r) => matches(r, args.where));
        return row ? pick(row, args.select) : null;
      },
      async updateMany(args: { where: Row; data: Row }) {
        const rows = state.subscriptions.filter((r) => matches(r, args.where));
        rows.forEach((r) => applyData(r, args.data));
        record('subscription', args.where, args.data, rows.length);
        return { count: rows.length };
      },
    },
    webhookOutbox: {
      async createManyAndReturn(args: { data: Row[]; skipDuplicates?: boolean; select?: Row }) {
        const created: Row[] = [];
        for (const data of args.data) {
          if (state.outbox.some((r) => r.dedupeKey === data.dedupeKey)) {
            if (args.skipDuplicates) continue;
            throw new UniqueViolation('dedupe_key');
          }
          const row = { id: state.nextOutboxId++, lastError: null, deliveredAt: null, ...data };
          state.outbox.push(row);
          created.push(row);
        }
        record('webhookOutbox', {}, { created: created.length }, created.length);
        return created.map((r) => pick(r, args.select));
      },
      async updateMany(args: { where: Row; data: Row }) {
        const rows = state.outbox.filter((r) => matches(r, args.where));
        rows.forEach((r) => applyData(r, args.data));
        record('webhookOutbox', args.where, args.data, rows.length);
        return { count: rows.length };
      },
      async findUnique(args: { where: Row }) {
        const row = state.outbox.find((r) => matches(r, args.where));
        return row ? { ...row } : null;
      },
      async findMany(args: { where?: Row; orderBy?: Row; take?: number; select?: Row }) {
        let rows = sortRows(state.outbox.filter((r) => matches(r, args.where)), args.orderBy);
        if (args.take !== undefined) rows = rows.slice(0, args.take);
        return rows.map((r) => pick(r, args.select));
      },
    },
    jobLock: {
      async updateMany(args: { where: Row; data: Row }) {
        const rows = state.locks.filter((r) => matches(r, args.where));
        rows.forEach((r) => applyData(r, args.data));
        return { count: rows.length };
      },
      async create(args: { data: Row }) {
        if (state.locks.some((r) => r.name === args.data.name)) throw new UniqueViolation('job_locks_pkey');
        const row = { ...args.data };
        state.locks.push(row);
        return { ...row };
      },
    },
    async $transaction<T>(fn: (t: unknown) => Promise<T>): Promise<T> {
      const snap = snapshot();
      try {
        return await fn(db);
      } catch (err) {
        restore(snap);
        throw err;
      }
    },
  };

  return {
    db: db as unknown as AchDb,
    state,
    tx(id: number | bigint) {
      return state.transactions.find((r) => String(r.id) === String(id)) as unknown as AchTxRow & { requestResponse?: string };
    },
    donor(id: number) {
      return state.donors.find((r) => r.id === id) as unknown as FakeDonor;
    },
    subscription(id: number) {
      return state.subscriptions.find((r) => r.id === id) as unknown as FakeSubscription;
    },
    outbox() {
      return state.outbox as unknown as FakeOutboxRow[];
    },
  };
}
