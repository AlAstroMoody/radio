<script setup lang="ts">
import { useAudioSettings } from 'composables/useAudioSettings'
import { BaseSelect } from 'shared'

const {
  applyPreset,
  autoplay,
  equalizerPresets,
  filterSettings,
  loop,
  playbackRate,
  selectedPreset,
  visualization,
  visualizationIntensity,
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
  { label: 'CircleWave', value: 'circlewave' },
  { label: 'Nothing', value: '' },
]
</script>

<template>
  <div class="flex flex-col gap-4 p-4 w-fit">
    <div class="text-center font-blackcraft text-3xl text-black dark:text-white">
      Settings
    </div>
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

    <BaseSelect v-model="playbackRate" :options="playbackRateOptions" placeholder="default" label="Playback Rate:" />
    <BaseSelect v-model="visualization" :options="visualizationOptions" placeholder="default" label="Visualization:" />

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

    <BaseSelect
      v-model="selectedPreset" :options="equalizerPresets.map((preset) => ({
        label: preset.name,
        value: preset.name,
      }))" placeholder="default" label="Equalizer Preset:" @change="applyPreset(selectedPreset)"
    />

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
