<script setup lang="ts">
const { variant = 'base', label = '' } = defineProps<{
  variant?: 'base' | 'control'
  label?: string
}>()

const classes: Record<string, string> = {
  base: 'text-left text-xl text-dark-200 dark:text-blue-100',
  control:
    'bg-dark-200 py-4 px-1 font-cyberpunk shadow-button hover:shadow-dark-200 dark:bg-light-100 dark:hover:shadow-light-200 border-b-[4px] transition-all active:translate-y-[2px] active:border-b-[2px] active:brightness-90',
}
</script>

<template>
  <button
    :aria-label="label"
    :class="classes[variant]"
    class="flex items-center hover:font-bold"
  >
    <slot />
  </button>
</template>
