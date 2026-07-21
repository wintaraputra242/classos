import { fileURLToPath, URL } from 'node:url'

import { writeFileSync } from 'fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'StikerNews Pelajar',
        short_name: 'StikerNews',
        description: 'Platform edukasi audio untuk pelajar Indonesia',
        theme_color: '#1DB954',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // skipWaiting: true,        // ← langsung aktif tanpa nunggu tab ditutup
        // clientsClaim: true,       // ← ambil alih semua tab yang terbuka
        // cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/isn-speed-id-dev\.s3\.ap-southeast-3\.amazonaws\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 hari
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
      },
      devOptions: {
        enabled: true, // aktifkan PWA saat development
      },
    }),
    {
      name: 'generate-version',
      closeBundle() {
        writeFileSync('dist/version.json', JSON.stringify({
          version: Date.now().toString(),
          buildAt: new Date().toISOString()
        }, null, 2))
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api-dashboard': {
        target: 'https://classos.isn-speed.com',
        // target: 'https://classos-beta.isn-speed.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-dashboard/, '/api'),
      }
    }
  },
  optimizeDeps: {
    include: [
      '@tensorflow/tfjs',
      '@tensorflow-models/coco-ssd',
    ],
    exclude: [] // kosongkan exclude kalau sebelumnya ada TF di sini
  },
  build: {
    commonjsOptions: {
      include: [/@tensorflow/, /node_modules/]
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      }
    }
  }
})
