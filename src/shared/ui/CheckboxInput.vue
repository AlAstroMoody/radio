<script setup lang="ts">
const { label } = defineProps<{
  label: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <label class="text-sm flex items-center gap-2">
    {{ label }}:
    <input
      :checked="modelValue"
      type="checkbox"
      class="w-4 h-4"
      @change="handleChange"
    >
  </label>
</template>
