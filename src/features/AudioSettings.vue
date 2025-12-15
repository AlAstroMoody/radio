<script setup lang="ts">
import { useAudioSettings } from 'composables/useAudioSettings'
import { useRadio } from 'composables/useRadio'
import { BaseSelect, CheckboxInput, RangeInput } from 'shared'

const { isRadioMode } = useRadio()
const {
  applyPreset,
  autoplay,
  electricEffects,
  equalizerPresets,
  filterSettings,
  loop,
  playbackRate,
  selectedPreset,
  visualization,
  visualizationFPS,
  visualizationIntensity,
  volume,
} = useAudioSettings()

function handlePresetChange(presetName: string) {
  if (presetName) {
    applyPreset(presetName)
  }
}

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
  { label: 'HexagonGrid', value: 'hexagongrid' },
  { label: 'Nothing', value: '' },
]
</script>

<template>
  <div class="flex flex-col gap-3 p-4 w-fit max-h-[90vh] overflow-y-auto">
    <div class="text-center font-blackcraft text-3xl text-black dark:text-white">
      Settings
    </div>
    <RangeInput
      v-model="volume"
      label="Volume"
      :min="0"
      :max="100"
      unit="%"
    />

    <BaseSelect v-model="playbackRate" :options="playbackRateOptions" placeholder="default" label="Playback Rate:" :disabled="isRadioMode" />
    <BaseSelect v-model="visualization" :options="visualizationOptions" placeholder="default" label="Visualization:" />

    <BaseSelect
      v-model="selectedPreset" :options="equalizerPresets.map((preset) => ({
        label: preset.name,
        value: preset.name,
      }))" placeholder="default" label="Equalizer Preset:" @change="handlePresetChange"
    />

    <div class="flex flex-col gap-2 pl-3 p-2 bg-purple-500/15 border border-purple-500/50 rounded-lg shadow-md dark:bg-purple-500/20 dark:border-purple-500/50 dark:shadow-lg">
      <RangeInput
        v-for="(filter, key) in filterSettings"
        :key="`${key}-${selectedPreset}`"
        v-model="filter.gain"
        :label="key.charAt(0).toUpperCase() + key.slice(1)"
        :min="-12"
        :max="12"
        unit=" dB"
        class="w-full!"
      />
    </div>

    <RangeInput
      v-model="visualizationIntensity"
      label="Vis. Intensity"
      :min="0.5"
      :max="2"
      :step="0.1"
      unit="x"
      :format-value="(value) => value.toFixed(1)"
    />

    <RangeInput
      v-model="visualizationFPS"
      label="Vis. FPS"
      :min="30"
      :max="144"
      :step="1"
      unit=" FPS"
    />

    <CheckboxInput
      v-model="loop"
      label="Repeat (one file)"
    />

    <CheckboxInput
      v-model="autoplay"
      label="Autoplay"
    />

    <CheckboxInput
      v-model="electricEffects"
      label="Electric Effects"
    />
  </div>
</template>
