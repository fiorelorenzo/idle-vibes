import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { cpSync, rmSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const EXTENSION_MEDIA = resolve(__dirname, '../extension/media')

/**
 * Copies build output to the extension's media/ directory after each build.
 *
 * IMPORTANT: Rollup's `closeBundle` hook only fires ONCE — when the process
 * exits. In Vite watch mode that means the copy never runs on rebuilds.
 * We use `writeBundle` instead, which fires after every successful build
 * in a watch iteration. The extension's file watcher (createFileSystemWatcher
 * on media/assets/*.js) then triggers a debounced webview reload.
 */
function copyToExtensionMedia() {
  return {
    name: 'copy-to-extension-media',
    writeBundle() {
      try {
        rmSync(EXTENSION_MEDIA, { recursive: true, force: true })
        mkdirSync(EXTENSION_MEDIA, { recursive: true })
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
    // Single bundle — no code splitting. VS Code webviews can't load
    // dynamically imported chunks because relative imports resolve from
    // the webview origin, not the script's source directory.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        // Force everything into one chunk
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
  },
  envDir: '../../',
}))
