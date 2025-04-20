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
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: false,
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2,webp}',
        ],
      },
    }),
  ],
})
