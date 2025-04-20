import type { Component } from 'vue'

import { ref } from 'vue'

export function useModal(): {
  closeModal: () => void
  isOpen: ReturnType<typeof ref<boolean>>
  modalContent: ReturnType<typeof ref<Component | null>>
  modalProps: ReturnType<typeof ref<null | Record<string, unknown>>>
  openModal: (component: Component, props?: Record<string, unknown>) => void
} {
  const isOpen = ref(false)
  const modalContent = ref<Component | null>(null)
  const modalProps = ref<null | Record<string, unknown>>(null)

  const openModal = (component: Component, props?: Record<string, unknown>): void => {
    modalContent.value = component
    modalProps.value = props || null
    isOpen.value = true
  }

  const closeModal = (): void => {
    isOpen.value = false
    modalContent.value = null
    modalProps.value = null
  }

  return {
    closeModal,
    isOpen,
    modalContent,
    modalProps,
    openModal,
  }
}
