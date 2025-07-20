<script setup lang="ts">
import { computed } from 'vue'

const { label } = defineProps<{
  label: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const inputId = computed(() => `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`)

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <label :for="inputId" class="text-sm flex items-center gap-2">
    {{ label }}:
    <input
      :id="inputId"
      :checked="modelValue"
      type="checkbox"
      :aria-label="label"
      class="w-4 h-4"
      @change="handleChange"
    >
  </label>
</template>
