import { vi } from 'vitest';

const createQueryBuilder = (): any => {
  return {
    select: vi.fn(function(this: any) { return this; }),
    insert: vi.fn(function(this: any) { return this; }),
    delete: vi.fn(function(this: any) { return this; }),
    update: vi.fn(function(this: any) { return this; }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    eq: vi.fn(function(this: any) { return this; }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn(function(this: any) { return this; }),
    limit: vi.fn(function(this: any) { return this; }),
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
