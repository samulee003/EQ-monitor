import { describe, expect, it, vi, beforeEach } from 'vitest';
import { insforge } from '@/lib/insforge/client';
import { insforgeAuthService } from './InsForgeAuthService';

vi.mock('@/lib/insforge/client', () => ({
  insforge: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    database: {
      from: vi.fn(() => {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
        return query;
      }),
    },
  },
}));

describe('InsForgeAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('登入時使用 InsForge Auth 並映射使用者資料', async () => {
    const signInWithPassword = insforge.auth.signInWithPassword as ReturnType<typeof vi.fn>;
    signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: '0f6a5a96-7e44-4db2-b533-ec26b5b92f12',
          email: 'lee@example.com',
          createdAt: '2026-05-13T00:00:00Z',
          updatedAt: '2026-05-13T00:00:00Z',
          profile: { name: '李昇恆' },
          metadata: null,
        },
        accessToken: 'token_123',
      },
      error: null,
    });

    const result = await insforgeAuthService.signIn(' Lee@Example.com ', '[REDACTED]');

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'lee@example.com',
      password: '[REDACTED]',
    });
    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('0f6a5a96-7e44-4db2-b533-ec26b5b92f12');
    expect(result.user?.displayName).toBe('李昇恆');
    expect(result.token).toBe('token_123');
  });
});
