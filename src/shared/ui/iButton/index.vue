<script setup lang="ts">
interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
})
</script>

<template>
  <button
    class="flex items-center bg-dark-200 p-4 shadow-button hover:shadow-dark-200 dark:bg-light-100 dark:hover:shadow-light-200"
  >
    <slot></slot>
    <span>{{ props.title }}</span>
  </button>
</template>
