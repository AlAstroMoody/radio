// Управление модальными окнами: открытие/закрытие, блокировка скролла страницы при открытии
// Singleton - один экземпляр на все приложение

import { ref } from 'vue'

let modalInstance: null | ReturnType<typeof createModalInstance> = null

export function useModal(): {
  closeModal: () => void
  isOpen: ReturnType<typeof ref<boolean>>
  openModal: () => void
} {
  if (!modalInstance) {
    modalInstance = createModalInstance()
  }

  return modalInstance
}

function createModalInstance(): {
  closeModal: () => void
  isOpen: ReturnType<typeof ref<boolean>>
  openModal: () => void
} {
  const isOpen = ref(false)

  const openModal = (): void => {
    isOpen.value = true
    document.body.style.overflow = 'hidden'
  }

  const closeModal = (): void => {
    isOpen.value = false
    document.body.style.overflow = ''
  }

  return {
    closeModal,
    isOpen,
    openModal,
  }
}
