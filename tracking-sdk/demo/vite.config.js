import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: '../dist/demo',
  },
});