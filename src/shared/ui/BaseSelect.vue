<script setup lang="ts" generic="T extends PropertyKey">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

interface Option<T> {
  label: string
  value: T
}

const { label, options, placeholder } = defineProps<{
  label?: string
  options: Option<T>[]
  placeholder?: string
}>()

const emit = defineEmits<{
  change: [value: T]
}>()

const model = defineModel<T>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const focusedOptionIndex = ref(-1)

const selectedOption = computed(() => {
  return options.find(option => option.value === model.value) || { label: '' }
})

function closeDropdown() {
  isOpen.value = false
  focusedOptionIndex.value = -1
}

function focusNextOption() {
  focusedOptionIndex.value = Math.min(focusedOptionIndex.value + 1, options.length - 1)
  scrollToFocusedOption()
}

function focusPreviousOption() {
  focusedOptionIndex.value = Math.max(focusedOptionIndex.value - 1, 0)
  scrollToFocusedOption()
}

function handleClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
    focusedOptionIndex.value = -1
  }
}

function openAndFocusFirst() {
  if (!isOpen.value) {
    isOpen.value = true
    focusedOptionIndex.value = 0
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
  model.value = option.value
  emit('change', option.value)
  isOpen.value = false
  focusedOptionIndex.value = -1
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    focusedOptionIndex.value = options.findIndex(option => option.value === model.value)
    nextTick(() => dropdownRef.value?.focus())
  }
  else {
    focusedOptionIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="flex items-center gap-2 justify-between w-full" @keydown.stop>
    <label v-if="label" class="truncate w-20 flex-1">{{ label }}</label>
    <div ref="selectRef" class="relative w-full max-w-xs flex-1">
      <button
        ref="buttonRef"
        type="button"
        class="w-full bg-white border border-light-100 rounded-md px-2 py-1 text-left flex justify-between items-center text-dark-100 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-100 outline-none"
        @click="toggleDropdown"
        @keydown.enter.prevent="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
        @keydown.arrow-down.prevent="openAndFocusFirst"
        @keydown.escape.prevent="closeDropdown"
      >
        <span>{{ selectedOption.label || placeholder }}</span>
        <svg
          class="w-5 h-5 transition-transform text-dark-200"
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
        class="absolute z-10 w-full mt-1 bg-white border border-light-100 rounded-md shadow-button max-h-60 overflow-auto"
        @keydown.arrow-down.prevent="focusNextOption"
        @keydown.arrow-up.prevent="focusPreviousOption"
        @keydown.enter.prevent="selectFocusedOption"
        @keydown.escape.prevent="closeDropdown"
      >
        <label
          v-for="(option, index) in options"
          :key="option.value"
          class="block px-2 py-1 cursor-pointer transition-all duration-200"
          :class="{
            'bg-light-200 text-dark-100': index === focusedOptionIndex || option.value === model,
            'hover:bg-light-100': index !== focusedOptionIndex && option.value !== model,
            'text-dark-200': index !== focusedOptionIndex && option.value !== model,
          }"
        >
          <input
            v-model="model"
            type="radio"
            :value="option.value"
            class="sr-only"
            @change="selectOption(option)"
          >
          <span>{{ option.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>
