import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    hmr: {
      host: 'localhost',
    },
  },
  // Vite loads .env.[mode] from envDir automatically.
  // Modes: 'development', 'preview', 'production'
  // Default envPrefix is 'VITE_' — no override needed.
  envDir: '../../',
}))
