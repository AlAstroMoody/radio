<script setup lang="ts">
import { useAudioSettings } from 'composables/useAudioSettings'

const { volume, playbackRate, loop, autoplay, visualization } = useAudioSettings()

const playbackRateOptions = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
]

const visualizationOptions = [
  { value: 'bars', label: 'bars' },
  { value: 'radial', label: 'radial' },
  { value: '', label: 'nothing' },
]
</script>

<template>
  <div class="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg w-fit m-auto">
    <div class="flex items-center gap-2">
      <label for="volume" class="w-32">Volume:</label>
      <input
        id="volume"
        v-model.number="volume"
        type="range"
        min="0"
        max="100"
        class="flex-1"
      >
      <span class="w-12">{{ volume }}%</span>
    </div>

    <div class="flex items-center gap-2">
      <label for="playbackRate" class="w-32">PlaybackRate:</label>
      <select
        id="playbackRate"
        v-model.number="playbackRate"
        class="px-2 py-1 border rounded"
      >
        <option
          v-for="option in playbackRateOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="flex items-center gap-2">
      <label for="visualization" class="w-32">Visualization:</label>
      <select
        id="visualization"
        v-model="visualization"
        class="px-2 py-1 border rounded"
      >
        <option
          v-for="option in visualizationOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="flex items-center gap-2">
      <label for="loop" class="w-32">Repeat:</label>
      <input
        id="loop"
        v-model="loop"
        type="checkbox"
        class="w-5 h-5"
      >
    </div>

    <div class="flex items-center gap-2">
      <label for="autoplay" class="w-32">Autoplay:</label>
      <input
        id="autoplay"
        v-model="autoplay"
        type="checkbox"
        class="w-5 h-5"
      >
    </div>
  </div>
</template>
