<script setup lang="ts">
const { formatValue = (value: number) => value.toString(), step = 1, unit = '' } = defineProps<{
  formatValue?: (value: number) => string
  label: string
  max: number
  min: number
  step?: number
  unit?: string
}>()

const modelValue = defineModel<number>({ required: true })
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="w-24 text-sm text-black dark:text-white">{{ label }}:</label>
    <input
      v-model.number="modelValue"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="label"
      class="range-input flex-1 max-w-32"
    >
    <span class="w-10 text-sm whitespace-nowrap text-black dark:text-white">{{ formatValue(modelValue) }}{{ unit }}</span>
  </div>
</template>

<style>
.range-input {
  appearance: none;
  cursor: pointer;
  height: 8px;
  background: var(--color-gray-200);
  border-radius: var(--radius-max);
  border: 1px solid var(--color-gray-600);
}

.dark .range-input {
  background: var(--color-gray-700);
  border: 1px solid var(--color-gray-600);
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--color-purple-500);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  border: 2px solid var(--color-white);
}

.dark .range-input::-webkit-slider-thumb {
  background: var(--color-purple-400);
  border: 2px solid var(--color-dark-100);
}

.range-input::-moz-range-track {
  background: var(--color-gray-200);
  height: 8px;
  border-radius: var(--radius-max);
  border: 1px solid var(--color-gray-600);
}

.dark .range-input::-moz-range-track {
  background: var(--color-gray-700);
  border: 1px solid var(--color-gray-600);
}

.range-input::-moz-range-progress {
  background: var(--color-purple-500);
  height: 8px;
  border-radius: var(--radius-max);
}

.dark .range-input::-moz-range-progress {
  background: var(--color-purple-400);
}

.range-input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--color-purple-500);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--color-white);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.dark .range-input::-moz-range-thumb {
  background: var(--color-purple-400);
  border: 2px solid var(--color-dark-100);
}
</style>
