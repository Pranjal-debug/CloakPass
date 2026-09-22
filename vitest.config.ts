import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 600_000,
    hookTimeout: 600_000,
    include: ['src/**/*.test.ts'],
    sequence: { concurrent: false }
  },
});
