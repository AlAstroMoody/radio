import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { ViteMinifyPlugin } from 'vite-plugin-minify'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/radio',
  plugins: [
    vue(),
    tsconfigPaths(),
    ViteMinifyPlugin({}),
    VitePWA({
      includeAssets: ['/icons/*.png', '*.html', '*.js'],
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: false,
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
        ],
      },
    }),
  ],
})
