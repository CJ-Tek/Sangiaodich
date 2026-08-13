import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration tests read local Supabase credentials from .env.local.
    env: loadEnv(mode, process.cwd(), ''),
    // The `.int.` suites share one local database and assert on platform-wide
    // totals, so two files running at once would see each other's fixtures.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
