<script setup lang="ts">
import { computed } from 'vue'

const { label } = defineProps<{
  label: string
}>()

const modelValue = defineModel<boolean>({ required: true })

const inputId = computed(() => `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`)
</script>

<template>
  <label :for="inputId" class="text-sm flex items-center gap-2 text-black dark:text-white">
    {{ label }}:
    <input
      :id="inputId"
      v-model="modelValue"
      type="checkbox"
      :aria-label="label"
      class="checkbox-input"
    >
  </label>
</template>

<style>
.checkbox-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #9ca3af;
  background-color: var(--color-white);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  accent-color: var(--color-purple-500);
}

.checkbox-input:checked {
  background-color: var(--color-purple-500);
  border-color: var(--color-purple-500);
}

.checkbox-input:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.dark .checkbox-input {
  border: 2px solid var(--color-gray-600);
  background-color: var(--color-dark-200);
  accent-color: var(--color-purple-400);
}

.dark .checkbox-input:checked {
  background-color: var(--color-purple-400);
  border-color: var(--color-purple-400);
}
</style>
