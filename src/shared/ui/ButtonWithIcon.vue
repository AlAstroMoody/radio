<script setup lang="ts">
const { variant = 'base', label = '' } = defineProps<{
  variant?: 'base' | 'primary' | 'secondary'
  label?: string
}>()

const classes: Record<string, string> = {
  base: 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
  primary: 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
}
</script>

<template>
  <button
    :aria-label="label"
    :class="classes[variant]"
    class="flex items-center justify-center w-12 h-12 rounded-full transition-all active:translate-y-[2px] active:scale-95 group relative"
  >
    <slot />
    <div
      v-if="label"
      class="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 "
    >
      <div
        class="bg-black text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap transform translate-y-0 group-hover:animate-bounce-tooltip"
      >
        {{ label }}
      </div>
    </div>
  </button>
</template>
