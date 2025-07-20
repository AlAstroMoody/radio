import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { ViteMinifyPlugin } from 'vite-plugin-minify'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/radio',
  build: {
    // Увеличиваем лимит предупреждений
    chunkSizeWarningLimit: 1000,
    // Оптимизация CSS
    cssCodeSplit: true,
    minify: 'terser',
    // Разделение на чанки
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Оптимизация имен файлов
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          // Аудио библиотеки
          audio: ['@vueuse/core'],
          // Vue и его зависимости
          vue: ['vue'],
        },
      },
    },
    // Оптимизация размера
    target: 'esnext',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
    },
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    exclude: ['@vite/client', '@vite/env'],
    include: ['vue', '@vueuse/core'],
  },
  plugins: [
    vue(),
    tsconfigPaths(),
    ViteMinifyPlugin({}),
    VitePWA({
      includeAssets: ['/icons/*.png', '*.html', '*.js'],
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        // Уменьшаем precache размер
        globIgnores: [
          '**/node_modules/**/*',
          '**/sw.js',
          '**/workbox-*.js',
          '**/*.map',
          '**/test/**/*',
          '**/docs/**/*',
        ],
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2,webp}',
        ],
        runtimeCaching: [
          {
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60,
                maxEntries: 10,
              },
            },
            urlPattern: ({ url }) => url.pathname === '/' || url.pathname === '/?action=open-audio-file',
          },
          {
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-files',
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60,
                maxEntries: 50,
              },
            },
            urlPattern: /\.(?:mp3|wav|ogg|m4a|flac|aac)$/,
          },
          {
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60,
                maxEntries: 100,
              },
            },
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
          },
        ],
      },
    }),
    // Анализ размера бандла
    visualizer({
      brotliSize: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      open: false,
    }),
  ],
})
