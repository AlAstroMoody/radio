<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { iClose } from 'shared/ui/icons'
import { computed } from 'vue'

defineProps<{
  isOpen: boolean
}>()
const emit = defineEmits(['close'])

const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)

const modalClasses = computed(() => [
  'fixed inset-0 z-50',
  'flex items-center justify-center',
  'bg-lavender/80 dark:bg-black/80 backdrop-blur-sm',
  {
    'p-4': !isMobile.value,
    'p-0': isMobile.value,
  },
])

const contentClasses = computed(() => [
  'bg-menu',
  'rounded-lg',
  'shadow-xl',
  'overflow-hidden',
  'flex',
  {
    'w-full h-full': isMobile.value,
    'min-w-2xl max-h-[90vh]': !isMobile.value,
  },
])
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      :class="modalClasses"
      @click.self="emit('close')"
    >
      <div :class="contentClasses" class="m-auto">
        <button
          class="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <iClose class="w-6 h-6" />
        </button>
        <slot />
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
