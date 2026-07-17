<script setup lang="ts">
const {
  count = 6,
  withThumb = false,
} = defineProps<{
  count?: number
  withThumb?: boolean
}>()
</script>

<template>
  <div class="flex flex-col gap-3 py-3 pl-2 pr-2" aria-hidden="true">
    <div
      v-for="n in count"
      :key="n"
      class="flex items-center gap-2 rounded-lg border border-glass dark:border-glass-purple-border bg-glass/50 px-4 py-3 dark:bg-glass-purple/30"
    >
      <div
        v-if="withThumb"
        class="size-10 shrink-0 animate-pulse rounded bg-black/10 dark:bg-white/10"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div
          class="h-3 max-w-[70%] animate-pulse rounded bg-black/10 dark:bg-white/10"
          :style="{ maxWidth: `${55 + (n % 3) * 12}%` }"
        />
        <div
          class="h-2.5 max-w-[45%] animate-pulse rounded bg-black/10 dark:bg-white/10"
          :style="{ maxWidth: `${35 + (n % 4) * 8}%` }"
        />
      </div>
    </div>
  </div>
</template>
