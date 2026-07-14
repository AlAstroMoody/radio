<script setup lang="ts">
const { active = false, label = '' } = defineProps<{
  active?: boolean
  label?: string
}>()
</script>

<template>
  <button
    :aria-label="label"
    :aria-pressed="active"
    class="flex items-center justify-center w-12 h-12 rounded-full transition-all active:translate-y-[2px] active:scale-95 group relative"
    :class="active
      ? 'text-purple-500 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-500/20'
      : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'"
  >
    <slot />
    <div
      v-if="label"
      class="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 group-hover:animate-bounce-tooltip hidden md:block"
    >
      <div
        class="bg-black text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg"
      >
        {{ label }}
      </div>
    </div>
  </button>
</template>
