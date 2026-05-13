import { vi } from 'vitest';

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

const createQueryBuilder = (): QueryBuilder => {
  return {
    select: vi.fn(function(this: QueryBuilder) { return this; }),
    insert: vi.fn(function(this: QueryBuilder) { return this; }),
    delete: vi.fn(function(this: QueryBuilder) { return this; }),
    update: vi.fn(function(this: QueryBuilder) { return this; }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    eq: vi.fn(function(this: QueryBuilder) { return this; }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn(function(this: QueryBuilder) { return this; }),
    limit: vi.fn(function(this: QueryBuilder) { return this; }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
};

export const createClient = vi.fn(() => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
  },
  database: {
    from: vi.fn(() => createQueryBuilder()),
  },
  db: {
    from: vi.fn(() => createQueryBuilder()),
  },
}));
