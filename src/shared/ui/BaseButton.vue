<script setup lang="ts">
const { label = '', variant = 'base' } = defineProps<{
  label?: string
  variant?: 'base' | 'control' | 'player'
}>()

const classes: Record<string, string> = {
  base: 'text-left text-xl text-dark-200 dark:text-blue-100 flex-1 truncate block',
  control: 'text-2xl px-3 flex items-center py-3 px-1 font-blackcraft bg-glass backdrop-blur-md border border-glass shadow-lg transition-all duration-300 relative overflow-hidden hover:animate-neon-pulse dark:bg-glass-purple shimmer',
  player: 'flex items-center justify-center p-2 rounded-full text-dark-200 dark:text-blue-100 sm:w-10 sm:h-10 hover:scale-110 bg-glass backdrop-blur-md border border-glass shadow-lg transition-all duration-300 relative overflow-hidden hover:animate-neon-pulse dark:bg-glass-purple shimmer',
}
</script>

<template>
  <button
    :aria-label="label"
    :class="classes[variant]"
    class="hover:font-bold min-w-0 relative active:translate-y-[2px] active:brightness-90 active:shadow-md group  dark:border-glass-purple-border"
  >
    <slot />
  </button>
</template>
