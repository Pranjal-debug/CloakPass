import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'node:path';

export default defineConfig({
  base: './',
  root: '.',
  plugins: [
    wasm(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      'fs/promises': path.resolve(__dirname, 'src/shims/empty.ts'),
      'node:fs/promises': path.resolve(__dirname, 'src/shims/empty.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    outDir: '../dist/frontend',
    emptyOutDir: true,
  },
});
