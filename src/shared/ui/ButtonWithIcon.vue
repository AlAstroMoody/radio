<script setup lang="ts">
const { active = false, label = '', size = 'md' } = defineProps<{
  active?: boolean
  label?: string
  size?: 'md' | 'sm'
}>()
</script>

<template>
  <button
    :aria-label="label"
    :aria-pressed="active"
    class="relative flex items-center justify-center rounded-full transition-all active:translate-y-[2px] active:scale-95 group"
    :class="[
      size === 'sm' ? 'h-9 w-9' : 'h-12 w-12',
      active
        ? 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400'
        : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700',
    ]"
  >
    <slot />
    <div
      v-if="label"
      class="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:animate-bounce-tooltip group-hover:opacity-100 md:block"
    >
      <div class="whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-sm text-white shadow-lg">
        {{ label }}
      </div>
    </div>
  </button>
</template>
