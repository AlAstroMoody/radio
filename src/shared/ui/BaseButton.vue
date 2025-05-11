<script setup lang="ts">
const { label = '', variant = 'base' } = defineProps<{
  label?: string
  variant?: 'base' | 'control' | 'player'
}>()

const classes: Record<string, string> = {
  base: 'text-left text-xl text-dark-200 dark:text-blue-100 flex-1 truncate block',
  control:
    'text-2xl px-3 flex items-center bg-dark-200 py-3 px-1 font-blackcraft shadow-button hover:shadow-dark-200 dark:bg-light-100 dark:hover:shadow-light-200 border-b-[4px] transition-all',
  player:
    'flex items-center justify-center p-2 rounded-full text-dark-200 dark:text-blue-100  bg-opacity-80 shadow-lg shadow-purple-500/40 ring-2 ring-white/20 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/60 hover:ring-offset-2 hover:ring-purple-500 sm:w-10 sm:h-10 dark:from-purple-800 dark:to-purple-900 dark:shadow-purple-800/40 dark:hover:shadow-purple-800/60 dark:focus:ring-purple-700 dark:bg-opacity-70 transition-all duration-300',
}
</script>

<template>
  <button
    :aria-label="label"
    :class="classes[variant]"
    class="hover:font-bold min-w-0 relative active:translate-y-[2px] active:brightness-90 active:shadow-md"
  >
    <slot />
  </button>
</template>
