import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

export const useGlobalState = createGlobalState(() => {
  const activeRadio = ref<number>(0)
  // изменить на id, а не индексы
  const changeActiveRadio = (index: number): void => {
    activeRadio.value = index
  }

  return { activeRadio, changeActiveRadio }
})
