import Routing from './index.vue'

export const routes = [
  { path: '/', component: () => import('./audioPlayerPage.vue') },
]

export { Routing }
