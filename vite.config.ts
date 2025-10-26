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
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          utils: ['@vueuse/core'],
          vue: ['vue'],
        },
      },
    },
  },

  plugins: [
    vue(),
    tsconfigPaths(),
    command === 'build' && VitePWA({
      registerType: 'autoUpdate', // Автоматическое обновление
      workbox: {
        // Кеш автоматически инвалидируется при изменении контента
        cleanupOutdatedCaches: true,
        clientsClaim: true, // Немедленный контроль клиентов
        globPatterns: [
          '**/*.{js,css,html,png,svg,json,woff2,webp,ico}',
        ],
        runtimeCaching: [
          // JS/CSS файлы с хешем - CacheFirst (они не изменяются)
          {
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
                maxEntries: 100,
              },
            },
            urlPattern: /\.(?:js|css)$/,
          },
          // Изображения и шрифты - CacheFirst
          {
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-assets',
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60, // 1 месяц
                maxEntries: 200,
              },
            },
            urlPattern: /\.(?:png|svg|webp|woff2|ico)$/,
          },
        ],
        skipWaiting: true, // Принудительное обновление
      },
    }),
  ].filter(Boolean),
}))
