import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// Mock supabaseAdapter
// ═══════════════════════════════════════════════════════════════

const mockCreateSupabaseAdapter = vi.hoisted(() => vi.fn(() => ({ adapterType: 'supabase' } as any)));

vi.mock('./supabaseAdapter.js', () => ({
  createSupabaseAdapter: mockCreateSupabaseAdapter,
}));

describe('db adapter factory', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockCreateSupabaseAdapter.mockClear();
  });

  it('無 Supabase 配置時返回 memory adapter', async () => {
    // Arrange
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_KEY', '');

    // Act
    const { adapterName, db } = await import('./index.js');
    const { memoryAdapter } = await import('./memoryAdapter.js');

    // Assert
    expect(adapterName).toBe('memory');
    expect(db).toBe(memoryAdapter);
    expect(mockCreateSupabaseAdapter).not.toHaveBeenCalled();
  });

  it('有 Supabase 配置時返回 supabase adapter', async () => {
    // Arrange
    vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-key');

    // Act
    const { adapterName } = await import('./index.js');

    // Assert
    expect(adapterName).toBe('supabase');
    expect(mockCreateSupabaseAdapter).toHaveBeenCalledTimes(1);
    expect(mockCreateSupabaseAdapter).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-key'
    );
  });

  it('缺少 SUPABASE_SERVICE_KEY 時返回 memory adapter', async () => {
    // Arrange
    vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_KEY', '');

    // Act
    const { adapterName } = await import('./index.js');

    // Assert
    expect(adapterName).toBe('memory');
    expect(mockCreateSupabaseAdapter).not.toHaveBeenCalled();
  });

  it('缺少 SUPABASE_URL 時返回 memory adapter', async () => {
    // Arrange
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-key');

    // Act
    const { adapterName } = await import('./index.js');

    // Assert
    expect(adapterName).toBe('memory');
    expect(mockCreateSupabaseAdapter).not.toHaveBeenCalled();
  });
});
