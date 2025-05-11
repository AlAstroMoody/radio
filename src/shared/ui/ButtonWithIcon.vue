<script setup lang="ts">
const { label = '', variant = 'base' } = defineProps<{
  label?: string
  variant?: 'base' | 'primary' | 'secondary'
}>()

const classes: Record<string, string> = {
  base: 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700',
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
      class="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none"
    >
      <div
        class="bg-black text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap transform translate-y-0 group-hover:animate-bounce-tooltip"
      >
        {{ label }}
      </div>
    </div>
  </button>
</template>
