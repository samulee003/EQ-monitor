import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// Mock supabaseAdapter
// ═══════════════════════════════════════════════════════════════

const mockCreateSupabaseAdapter = vi.hoisted(() => vi.fn(() => ({ adapterType: 'supabase' } as any)));
const mockCreateInsforgeAdapter = vi.hoisted(() => vi.fn(() => ({ adapterType: 'insforge' } as any)));

vi.mock('./supabaseAdapter.js', () => ({
  createSupabaseAdapter: mockCreateSupabaseAdapter,
}));

vi.mock('./insforgeAdapter.js', () => ({
  createInsforgeAdapter: mockCreateInsforgeAdapter,
}));

describe('db adapter factory', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('DATABASE_URL', '');
    mockCreateSupabaseAdapter.mockClear();
    mockCreateInsforgeAdapter.mockClear();
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

  it('DATABASE_URL 指向 insforge.app 時返回 insforge adapter', async () => {
    // Arrange
    vi.stubEnv(
      'DATABASE_URL',
      'postgresql://postgres:pwd@b88egxiz.ap-southeast.database.insforge.app:5432/insforge?sslmode=require'
    );
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_KEY', '');

    // Act
    const { adapterName } = await import('./index.js');

    // Assert
    expect(adapterName).toBe('insforge');
    expect(mockCreateInsforgeAdapter).toHaveBeenCalledTimes(1);
    expect(mockCreateSupabaseAdapter).not.toHaveBeenCalled();
  });

  it('DATABASE_URL 為 insforge 時優先於 supabase 配置', async () => {
    // Arrange
    vi.stubEnv(
      'DATABASE_URL',
      'postgresql://postgres:pwd@host.insforge.app:5432/db?sslmode=require'
    );
    vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-key');

    // Act
    const { adapterName } = await import('./index.js');

    // Assert
    expect(adapterName).toBe('insforge');
    expect(mockCreateInsforgeAdapter).toHaveBeenCalledTimes(1);
    expect(mockCreateSupabaseAdapter).not.toHaveBeenCalled();
  });
});
