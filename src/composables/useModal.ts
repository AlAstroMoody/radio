import type { Component } from 'vue'
import { ref } from 'vue'

export function useModal(): {
  isOpen: ReturnType<typeof ref<boolean>>
  modalContent: ReturnType<typeof ref<Component | null>>
  openModal: (component: Component) => void
  closeModal: () => void
} {
  const isOpen = ref(false)
  const modalContent = ref<Component | null>(null)

  const openModal = (component: Component): void => {
    modalContent.value = component
    isOpen.value = true
  }

  const closeModal = (): void => {
    isOpen.value = false
    modalContent.value = null
  }

  return {
    isOpen,
    modalContent,
    openModal,
    closeModal,
  }
}
