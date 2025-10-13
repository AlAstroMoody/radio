<script setup lang="ts">
const { active = false, label = '', variant = 'base' } = defineProps<{
  active?: boolean
  label?: string
  variant?: 'base' | 'control' | 'list' | 'player'
}>()

const classes: Record<string, string> = {
  base: 'text-left text-xl text-dark-200 dark:text-blue-100 flex-1 truncate block',
  control: 'text-2xl px-3 flex items-center py-3 px-1 font-blackcraft bg-glass backdrop-blur-md border border-gray-300/50 shadow-md transition-all duration-300 relative overflow-hidden hover:animate-neon-pulse dark:bg-glass-purple dark:border-glass-purple-border shimmer hover:font-bold transition-all duration-300',
  list: 'flex text-left text-sm md:text-lg text-dark-200 dark:text-blue-100 flex-1 truncate block bg-glass backdrop-blur-md border border-gray-300/50 shadow-md transition-all duration-300 relative overflow-hidden hover:animate-neon-pulse dark:bg-glass-purple dark:border-glass-purple-border rounded-lg px-4 py-3 hover:shadow-xl hover:bg-purple-500/10 hover:border-purple-400/50 dark:hover:bg-purple-500/20 dark:hover:border-purple-400/50',
  player: 'flex items-center justify-center p-2 rounded-full text-dark-200 dark:text-blue-100 md:w-10 md:h-10 hover:scale-110 bg-glass backdrop-blur-md border border-gray-300/50 shadow-md transition-all duration-300 relative overflow-hidden hover:animate-neon-pulse dark:bg-glass-purple dark:border-glass-purple-border shimmer',
}
</script>

<template>
  <button
    :aria-label="label"
    :class="[
      classes[variant],
      active && variant === 'list' && 'font-bold bg-purple-500/40 border-purple-400/80 shadow-purple-500/40 shadow-lg scale-[1.02] dark:bg-purple-500/50 dark:border-purple-400/80',
    ]"
    class="min-w-0 relative active:translate-y-[2px] active:brightness-90 active:shadow-md group dark:border-glass-purple-border"
  >
    <slot />
  </button>
</template>
