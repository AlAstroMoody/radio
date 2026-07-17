<script setup lang="ts" generic="T extends PropertyKey">
import { onClickOutside } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef } from 'vue'

interface Option<T> {
  disabled?: boolean
  label: string
  value: T
}

const { disabled = false, label, options, placeholder } = defineProps<{
  disabled?: boolean
  label?: string
  options: Option<T>[]
  placeholder?: string
}>()

const emit = defineEmits<{
  change: [value: T]
}>()

const model = defineModel<T>()

const isOpen = ref(false)
const buttonRef = useTemplateRef('buttonRef')
const dropdownRef = useTemplateRef('dropdownRef')
const focusedOptionIndex = ref(-1)
const selectRef = useTemplateRef('selectRef')

const selectedOption = computed(() => {
  return options.find(option => option.value === model.value) || { label: '' }
})

onClickOutside(selectRef, () => {
  if (!isOpen.value)
    return
  closeDropdown()
})

function closeDropdown() {
  isOpen.value = false
  focusedOptionIndex.value = -1
}

function focusNextOption() {
  for (let i = focusedOptionIndex.value + 1; i < options.length; i += 1) {
    if (!options[i]?.disabled) {
      focusedOptionIndex.value = i
      scrollToFocusedOption()
      return
    }
  }
}

function focusPreviousOption() {
  for (let i = focusedOptionIndex.value - 1; i >= 0; i -= 1) {
    if (!options[i]?.disabled) {
      focusedOptionIndex.value = i
      scrollToFocusedOption()
      return
    }
  }
}

function openAndFocusFirst() {
  if (!isOpen.value) {
    isOpen.value = true
    focusedOptionIndex.value = options.findIndex(option => !option.disabled)
    nextTick(() => dropdownRef.value?.focus())
  }
}

function scrollToFocusedOption() {
  if (dropdownRef.value && focusedOptionIndex.value >= 0) {
    const focusedElement = dropdownRef.value.children[focusedOptionIndex.value]
    focusedElement?.scrollIntoView({ block: 'nearest' })
  }
}

function selectFocusedOption() {
  if (focusedOptionIndex.value >= 0) {
    selectOption(options[focusedOptionIndex.value])
  }
}

function selectOption(option: Option<T>) {
  if (option.disabled)
    return

  model.value = option.value
  emit('change', option.value)
  isOpen.value = false
  focusedOptionIndex.value = -1
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    const currentIndex = options.findIndex(option => option.value === model.value)
    focusedOptionIndex.value = currentIndex >= 0 && !options[currentIndex]?.disabled
      ? currentIndex
      : options.findIndex(option => !option.disabled)
    nextTick(() => dropdownRef.value?.focus())
  }
  else {
    focusedOptionIndex.value = -1
  }
}
</script>

<template>
  <div class="flex items-center gap-2 justify-between w-full" @keydown.stop>
    <label v-if="label" class="truncate w-20 flex-1 text-black dark:text-white">{{ label }}</label>
    <div ref="selectRef" class="relative w-full max-w-xs flex-1">
      <button
        ref="buttonRef"
        type="button"
        :aria-label="label ? `${label}: ${selectedOption.label || placeholder}` : selectedOption.label || placeholder"
        :disabled="disabled"
        class="w-full bg-white dark:bg-dark-200 border border-light-100 dark:border-purple-500/50 rounded-md px-2 py-1 text-left flex justify-between items-center text-dark-100 dark:text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-100 dark:focus-visible:ring-purple-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        @click="toggleDropdown"
        @keydown.enter.prevent="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
        @keydown.arrow-down.prevent="openAndFocusFirst"
        @keydown.escape.prevent="closeDropdown"
      >
        <span>{{ selectedOption.label || placeholder }}</span>
        <svg
          class="w-5 h-5 transition-transform text-dark-200 dark:text-white"
          :class="{ 'rotate-180': isOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        v-if="isOpen"
        ref="dropdownRef"
        tabindex="-1"
        class="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-light-100 bg-white shadow-button outline-none dark:border-purple-500/50 dark:bg-dark-200 dark:shadow-lg"
        @keydown.arrow-down.prevent="focusNextOption"
        @keydown.arrow-up.prevent="focusPreviousOption"
        @keydown.enter.prevent="selectFocusedOption"
        @keydown.escape.prevent="closeDropdown"
      >
        <label
          v-for="(option, index) in options"
          :key="String(option.value)"
          class="block px-2 py-1 transition-all duration-200"
          :class="{
            'cursor-pointer': !option.disabled,
            'cursor-not-allowed opacity-40': option.disabled,
            'bg-light-200 dark:bg-purple-500/30 text-dark-100 dark:text-white': !option.disabled && (index === focusedOptionIndex || option.value === model),
            'hover:bg-light-100 dark:hover:bg-purple-500/20': !option.disabled && index !== focusedOptionIndex && option.value !== model,
            'text-dark-200 dark:text-gray-200': !option.disabled && index !== focusedOptionIndex && option.value !== model,
            'bg-light-200/60 dark:bg-purple-500/20 text-dark-100 dark:text-white': option.disabled && option.value === model,
          }"
        >
          <input
            type="radio"
            :checked="option.value === model"
            :disabled="option.disabled"
            class="sr-only"
            @click.prevent="selectOption(option)"
          >
          <span>{{ option.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>
