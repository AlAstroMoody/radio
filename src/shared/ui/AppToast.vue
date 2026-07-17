<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { useToast } from 'composables/useToast'
import { computed } from 'vue'

const SHEET_BREAKPOINT = 1024
const { hideToast, message, visible } = useToast()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < SHEET_BREAKPOINT)
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed left-1/2 z-60 w-[min(92vw,24rem)] -translate-x-1/2"
      :class="isMobile
        ? 'bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))]'
        : 'top-4'"
    >
      <Transition name="toast">
        <button
          v-if="visible"
          type="button"
          class="pointer-events-auto w-full rounded-xl border border-glass bg-black/85 px-4 py-3 text-left text-sm text-white shadow-lg backdrop-blur-md dark:border-glass-purple-border dark:bg-dark-100/95"
          role="status"
          aria-live="polite"
          @click="hideToast"
        >
          {{ message }}
        </button>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
