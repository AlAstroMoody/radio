import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './index.vue'

export const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
