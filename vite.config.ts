import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'
import { ViteMinifyPlugin } from 'vite-plugin-minify'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/radio',
  plugins: [
    vue(),
    tsconfigPaths(),
    ViteMinifyPlugin({}),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        cleanupOutdatedCaches: false,
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2,webp}',
        ],
      },
    }),
  ],
})
