<script setup lang="ts">
import { useEventListener, useWindowSize } from '@vueuse/core'
import { useModal } from 'composables/useModal'
import { iClose } from 'shared/ui/icons'
import { computed } from 'vue'

const { closeModal, isOpen, modalContent, modalProps } = useModal()

useEventListener(window, 'keydown', handleKeydown)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeModal()
  }
}

const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)

const modalClasses = computed(() => [
  'fixed inset-0 z-50',
  'flex items-center justify-center',
  'bg-lavender/80 dark:bg-black/80 backdrop-blur-sm',
  {
    'p-0': isMobile.value,
    'p-4': !isMobile.value,
  },
])

const contentClasses = computed(() => [
  'bg-menu',
  'shadow-xl',
  'overflow-auto',
  'flex',
  {
    'min-w-2xl max-h-[90vh] rounded-lg': !isMobile.value,
    'w-full h-full': isMobile.value,
  },
])
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      :class="modalClasses"
      tabindex="-1"
      @click.self="closeModal"
    >
      <div :class="contentClasses" class="m-auto content-visibility-auto">
        <div class="relative w-full flex flex-col">
          <button
            class="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label="Close modal"
            @click="closeModal"
          >
            <iClose class="w-6 h-6" />
          </button>
          <div class="flex-1">
            <component :is="modalContent" v-if="modalContent" v-bind="modalProps || {}" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
