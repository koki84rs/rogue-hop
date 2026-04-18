import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0
  },
  server: {
    host: true, // 同じWi-Fiのスマホから http://{MacのIP}:5173 でテスト可能にする
    port: 5173
  }
});
