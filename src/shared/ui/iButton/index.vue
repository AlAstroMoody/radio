<script setup lang="ts">
interface Props {
  title?: string
  textClass?: string
  variant?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  textClass: '',
  variant: 'base',
})

const classes: Record<string, string> = {
  base: 'text-left text-xl text-dark-200 dark:text-blue-100 hover:',
  control:
    'bg-dark-200 py-4 px-1 font-cyberpunk shadow-button hover:shadow-dark-200 dark:bg-light-100 dark:hover:shadow-light-200',
}
</script>

<template>
  <button
    :aria-label="title"
    :class="classes[props.variant]"
    class="flex items-center"
  >
    <slot></slot>
    <span :class="textClass">{{ title }}</span>
  </button>
</template>
