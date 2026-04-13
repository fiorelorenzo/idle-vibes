import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { cpSync } from 'fs'
import { resolve } from 'path'

const EXTENSION_MEDIA = resolve(__dirname, '../extension/media')

/**
 * Vite plugin that copies build output to the extension's media/ directory
 * after each build. In watch mode this runs on every rebuild, triggering
 * the extension's file watcher to auto-reload the webview.
 */
function copyToExtensionMedia() {
  return {
    name: 'copy-to-extension-media',
    closeBundle() {
      try {
        cpSync(resolve(__dirname, 'dist'), EXTENSION_MEDIA, { recursive: true })
        console.log('[idle_vibes] UI assets copied to extension/media/')
      } catch (e) {
        console.error('[idle_vibes] Failed to copy UI assets:', e)
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [svelte(), copyToExtensionMedia()],
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
  // Vite loads .env.[mode] from envDir automatically.
  // Modes: 'development', 'preview', 'production'
  envDir: '../../',
}))
