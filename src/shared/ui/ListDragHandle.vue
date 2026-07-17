<script setup lang="ts">
import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <span
    v-bind="$attrs"
    role="button"
    tabindex="-1"
    aria-label="Drag to reorder"
    class="flex shrink-0 items-center justify-center self-stretch px-1 text-gray-400 hover:text-purple-500 dark:text-gray-500 dark:hover:text-purple-400"
    @click.stop
    @mousedown.stop
  >
    <EllipsisVerticalIcon class="pointer-events-none h-5 w-5" aria-hidden="true" />
  </span>
</template>
