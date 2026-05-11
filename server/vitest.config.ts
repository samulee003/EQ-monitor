import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    exclude: ['node_modules/', 'dist/'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage-report',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'coverage-report/',
        'vitest.config.ts',
        '**/*.test.ts',
        'src/index.ts',
        'src/utils/logger.ts',
        'src/middleware/**',
        'src/api/**',
        'src/db/supabaseAdapter.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
