<script setup lang="ts">
const { formatValue = (value: number) => value.toString(), step = 1, unit = '' } = defineProps<{
  formatValue?: (value: number) => string
  label: string
  max: number
  min: number
  modelValue: number
  step?: number
  unit?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', Number(target.value))
}
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="w-24 text-sm">{{ label }}:</label>
    <input
      :value="modelValue"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="label"
      class="flex-1 max-w-32"
      @input="handleInput"
    >
    <span class="w-10 text-sm whitespace-nowrap">{{ formatValue(modelValue) }}{{ unit }}</span>
  </div>
</template>
