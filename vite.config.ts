import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use the external manifest.webmanifest we created in public/
      manifest: false,
      // Include icons and top-level jpgs in the precache manifest.
      // Deliberately exclude public/bg/ — those PNGs are 2-2.4 MB each
      // and are handled by the runtime CacheFirst rule below instead.
      includeAssets: ['icon-192.png', 'icon-512.png', '*.jpg', 'manifest.webmanifest'],
      workbox: {
        // Activate updated service worker immediately without waiting for user to close all tabs
        skipWaiting: true,
        clientsClaim: true,
        // Increase precache file size limit to 6 MiB to support bundle assets
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Precache all built JS/CSS/HTML + small images.
        // Explicitly ignore the oversized bg/ PNGs (2MB+) so Workbox
        // doesn't throw "exceeds maximumFileSizeToCacheInBytes" errors.
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
        globIgnores: ['**/bg/**', '**/node_modules/**'],
        // SPA fallback: any navigation request not matched by precache
        // falls back to /index.html so React handles client-side routing
        navigateFallback: '/index.html',
        // Don't navigate-fallback for non-app paths
        navigateFallbackDenylist: [/^\/api\//, /^\/verify\/.+/],
        // Runtime caching strategies
        runtimeCaching: [
          // Local hero / background images (top-level jpg + bg/ PNGs)
          // CacheFirst: cached on first load, served from cache forever after
          {
            urlPattern: /\/(?:hero_|sahakar_|bg\/).+\.(jpg|jpeg|png)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-images',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Also catch any remaining same-origin images by extension
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|ico|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-images',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Google Fonts stylesheets — stale-while-revalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Google Fonts actual font files — CacheFirst (immutable)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Unsplash avatar images used in seed data — CacheFirst
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          pdf: ['jspdf', 'html2canvas'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
