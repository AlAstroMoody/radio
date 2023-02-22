<script setup lang="ts">
interface Props {
  title?: string
  textClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  textClass: '',
})
</script>

<template>
  <button
    :aria-label="title"
    class="flex items-center bg-dark-200 py-4 px-1 font-cyberpunk shadow-button hover:shadow-dark-200 dark:bg-light-100 dark:hover:shadow-light-200"
  >
    <slot></slot>
    <span :class="textClass">{{ title }}</span>
  </button>
</template>
