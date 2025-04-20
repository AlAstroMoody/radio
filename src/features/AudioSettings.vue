<script setup lang="ts">
import { useAudioSettings } from 'composables/useAudioSettings'

const {
  applyPreset,
  autoplay,
  equalizerPresets,
  filterSettings,
  loop,
  playbackRate,
  selectedPreset,
  visualization,
  visualizationIntensity, // Новый параметр
  volume,
} = useAudioSettings()

const playbackRateOptions = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
]

const visualizationOptions = [
  { label: 'Bars', value: 'bars' },
  { label: 'Radial', value: 'radial' },
  { label: 'Waveform', value: 'waveform' },
  { label: 'Particle', value: 'particle' },
  { label: 'Spectrum', value: 'spectrum' },
  { label: 'Nothing', value: '' },
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
      <label for="playbackRate" class="w-32">Playback Rate:</label>
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
      <label for="visualizationIntensity" class="w-32">Vis. Intensity:</label>
      <input
        id="visualizationIntensity"
        v-model.number="visualizationIntensity"
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        class="flex-1"
      >
      <span class="w-12">{{ visualizationIntensity.toFixed(1) }}x</span>
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

    <div class="flex items-center gap-2">
      <label for="equalizerPreset" class="w-32">Equalizer Preset:</label>
      <select
        id="equalizerPreset"
        v-model="selectedPreset"
        class="px-2 py-1 border rounded"
        @change="applyPreset(selectedPreset)"
      >
        <option
          v-for="preset in equalizerPresets"
          :key="preset.name"
          :value="preset.name"
        >
          {{ preset.name }}
        </option>
      </select>
    </div>

    <div class="flex flex-col gap-2 pl-4">
      <div class="flex items-center gap-2">
        <label for="bassGain" class="w-28">Bass Gain:</label>
        <input
          id="bassGain"
          v-model.number="filterSettings.bass.gain"
          type="range"
          min="-12"
          max="12"
          class="flex-1"
        >
        <span class="w-12">{{ filterSettings.bass.gain }} dB</span>
      </div>
      <div class="flex items-center gap-2">
        <label for="midGain" class="w-28">Mid Gain:</label>
        <input
          id="midGain"
          v-model.number="filterSettings.mid.gain"
          type="range"
          min="-12"
          max="12"
          class="flex-1"
        >
        <span class="w-12">{{ filterSettings.mid.gain }} dB</span>
      </div>
      <div class="flex items-center gap-2">
        <label for="trebleGain" class="w-28">Treble Gain:</label>
        <input
          id="trebleGain"
          v-model.number="filterSettings.treble.gain"
          type="range"
          min="-12"
          max="12"
          class="flex-1"
        >
        <span class="w-12">{{ filterSettings.treble.gain }} dB</span>
      </div>
    </div>
  </div>
</template>
