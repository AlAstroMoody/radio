import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: '/radio',
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          utils: ['@vueuse/core'],
          vue: ['vue'],
        },
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'], // Убираем console и debugger
  },

  plugins: [
    vue(),
    tsconfigPaths(),
    // PWA только для production
    command === 'build' && VitePWA({
      registerType: 'autoUpdate', // Автоматическое обновление
      workbox: {
        // Кеш автоматически инвалидируется при изменении контента
        cleanupOutdatedCaches: true,
        globPatterns: [
          '**/*.{js,css,html,png,svg,json,woff2,webp}',
        ],
        runtimeCaching: [
          // Главная страница - NetworkFirst с увеличенным TTL
          {
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: {
                maxAgeSeconds: 7 * 24 * 60 * 60, // 1 неделя
                maxEntries: 10,
              },
              networkTimeoutSeconds: 3,
            },
            urlPattern: ({ url }) => url.pathname === '/' || url.pathname === '/radio',
          },
          // JS/CSS файлы - CacheFirst с долгим TTL
          {
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60, // 1 месяц
                maxEntries: 50,
              },
            },
            urlPattern: /\.(?:js|css)$/,
          },
          // Изображения - CacheFirst с увеличенным TTL
          {
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxAgeSeconds: 14 * 24 * 60 * 60, // 2 недели
                maxEntries: 100,
              },
            },
            urlPattern: /\.(?:png|svg|webp)$/,
          },
        ],
      },
    }),
  ].filter(Boolean),
}))
