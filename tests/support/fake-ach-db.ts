/**
 * In-memory stand-in for the slice of the Prisma client that
 * lib/fortis/ach-settlement.ts uses. It evaluates the same `where` shapes
 * Prisma would (equality, null, in, not, lte/gte, endsWith, OR, NOT), so
 * tests exercise the real selection predicates and the conditional
 * (compare-and-set) writes rather than canned answers. $transaction snapshots
 * state and restores it if the callback throws.
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
    if (typeof cond !== 'object' || cond instanceof Date) {
      if (!eq(value, cond)) return false;
      continue;
    }
    const ops = cond as Row;
    if ('in' in ops && !(ops.in as unknown[]).some((x) => eq(value, x))) return false;
    if ('not' in ops) {
      if (ops.not === null ? value === null || value === undefined : eq(value, ops.not)) return false;
    }
    if ('lte' in ops && !(value != null && cmp(value, ops.lte) <= 0)) return false;
    if ('gte' in ops && !(value != null && cmp(value, ops.gte) >= 0)) return false;
    if ('endsWith' in ops && !(typeof value === 'string' && value.endsWith(ops.endsWith as string))) return false;
  }
  return true;
}

function applyData(row: Row, data: Row) {
  for (const [key, change] of Object.entries(data)) {
    if (change && typeof change === 'object' && !(change instanceof Date) && 'increment' in (change as Row)) {
      const current = row[key];
      row[key] = current === null || current === undefined ? null : Math.round((Number(current) + Number((change as Row).increment)) * 100) / 100;
    } else {
      row[key] = change;
    }
  }
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

export function createFakeAchDb(seed: {
  transactions?: AchTxRow[];
  donors?: FakeDonor[];
  orgs?: FakeOrg[];
  sources?: FakeSource[];
}) {
  const state = {
    transactions: (seed.transactions ?? []).map((t) => ({ ...t })) as Row[],
    donors: (seed.donors ?? []).map((d) => ({ ...d })) as Row[],
    orgs: (seed.orgs ?? []).map((o) => ({ ...o })) as Row[],
    sources: (seed.sources ?? []).map((s) => ({ ...s })) as Row[],
    writes: [] as Array<{ table: string; where: Row; data: Row; count: number }>,
    findManyCalls: [] as Row[],
  };

  const snapshot = () => JSON.stringify(
    { t: state.transactions, d: state.donors },
    (_k, v) => (typeof v === 'bigint' ? { __bigint: v.toString() } : v),
  );
  const restore = (snap: string) => {
    const parsed = JSON.parse(snap, (_k, v) => (v && typeof v === 'object' && '__bigint' in v ? BigInt(v.__bigint) : v));
    const revive = (rows: Row[]) =>
      rows.map((r) => {
        for (const k of ['createdAt', 'updatedAt', 'firstDate']) if (typeof r[k] === 'string') r[k] = new Date(r[k] as string);
        return r;
      });
    state.transactions = revive(parsed.t);
    state.donors = revive(parsed.d);
  };

  const db = {
    transaction: {
      async findMany(args: { where?: Row; orderBy?: Row; take?: number }) {
        state.findManyCalls.push(args as Row);
        let rows = state.transactions.filter((r) => matches(r, args.where));
        const order = args.orderBy as { updatedAt?: 'asc' | 'desc' } | undefined;
        if (order?.updatedAt) rows = [...rows].sort((a, b) => cmp(a.updatedAt, b.updatedAt) * (order.updatedAt === 'asc' ? 1 : -1));
        if (args.take !== undefined) rows = rows.slice(0, args.take);
        return rows.map((r) => ({ ...r }));
      },
      async findUnique(args: { where: Row }) {
        const row = state.transactions.find((r) => matches(r, args.where));
        return row ? { ...row } : null;
      },
      async updateMany(args: { where: Row; data: Row }) {
        const rows = state.transactions.filter((r) => matches(r, args.where));
        rows.forEach((r) => applyData(r, args.data));
        state.writes.push({ table: 'transaction', where: args.where, data: args.data, count: rows.length });
        return { count: rows.length };
      },
    },
    donor: {
      async updateMany(args: { where: Row; data: Row }) {
        const rows = state.donors.filter((r) => matches(r, args.where));
        rows.forEach((r) => applyData(r, args.data));
        state.writes.push({ table: 'donor', where: args.where, data: args.data, count: rows.length });
        return { count: rows.length };
      },
    },
    organization: {
      async findUnique(args: { where: Row }) {
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
      return state.transactions.find((r) => String(r.id) === String(id)) as unknown as AchTxRow;
    },
    donor(id: number) {
      return state.donors.find((r) => r.id === id) as unknown as FakeDonor;
    },
  };
}
