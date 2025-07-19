<script setup lang="ts">
import { useEventListener, useWindowSize } from '@vueuse/core'
import { useModal } from 'composables/useModal'
import { iClose } from 'shared/ui/icons'
import { computed } from 'vue'

const { closeModal, isOpen, modalContent, modalProps } = useModal()

useEventListener(window, 'keydown', handleKeydown)
useEventListener(window, 'touchstart', handleTouchStart)
useEventListener(window, 'touchend', handleTouchEnd)

let touchStartX = 0
let touchStartY = 0
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeModal()
  }
}

function handleTouchEnd(event: TouchEvent) {
  if (!isOpen.value)
    return

  const target = event.target as HTMLElement
  if (target && (
    target.tagName === 'BUTTON'
    || target.tagName === 'INPUT'
    || target.tagName === 'SELECT'
    || target.tagName === 'TEXTAREA'
    || target.closest('button')
    || target.closest('input')
    || target.closest('select')
    || target.closest('textarea')
    || target.closest('[role="button"]')
    || target.closest('[role="slider"]')
  )) {
    return
  }

  const touch = event.changedTouches[0]
  const dx = Math.abs(touch.clientX - touchStartX)
  const dy = Math.abs(touch.clientY - touchStartY)
  // Любой свайп (больше 30px по любой оси)
  if (dx > 30 || dy > 30) {
    closeModal()
  }
}

function handleTouchStart(event: TouchEvent) {
  if (!isOpen.value)
    return
  const touch = event.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
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
      <div :class="contentClasses" class="m-auto">
        <div class="p-4 relative w-full">
          <button
            class="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
            @click="closeModal"
          >
            <iClose class="w-6 h-6" />
          </button>
          <component :is="modalContent" v-if="modalContent" v-bind="modalProps || {}" />
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
