import { vi } from 'vitest';

export const createClient = vi.fn(() => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
  db: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn(), limit: vi.fn(), eq: vi.fn(), single: vi.fn() })),
      insert: vi.fn(),
      delete: vi.fn(() => ({ eq: vi.fn() })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      upsert: vi.fn(),
    })),
  },
}));
