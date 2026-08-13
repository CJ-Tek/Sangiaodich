import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration tests read local Supabase credentials from .env.local.
    env: loadEnv(mode, process.cwd(), ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
