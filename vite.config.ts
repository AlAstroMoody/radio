import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import EnvironmentPlugin from 'vite-plugin-environment'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/radio',
  plugins: [
    vue(),
    tsconfigPaths(),
    EnvironmentPlugin('all', { prefix: 'VITE_' }),
  ],
})
