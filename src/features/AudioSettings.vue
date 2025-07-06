<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { useAudioSettings } from 'composables/useAudioSettings'
import { BaseSelect } from 'shared'
import { onMounted } from 'vue'

const {
  applyPreset,
  autoplay,
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

// Функция для определения максимального FPS устройства
function getMaxDeviceFPS(): Promise<number> {
  return new Promise((resolve) => {
    // Проверяем поддержку refreshRate API (доступен в основном на мобильных устройствах)
    if (window.screen && 'refreshRate' in window.screen) {
      const refreshRate = window.screen.refreshRate
      if (typeof refreshRate === 'number' && refreshRate > 0) {
        resolve(Math.min(120, Math.round(refreshRate)))
        return
      }
    }

    // Для большинства устройств используем тест производительности
    const start = performance.now()
    let frameCount = 0

    function testFrame() {
      frameCount++
      if (frameCount >= 30) { // Тестируем 30 кадров
        const elapsed = performance.now() - start
        const actualFPS = Math.round((frameCount / elapsed) * 1000)

        // Определяем максимальный поддерживаемый FPS
        let maxFPS = 120 // По умолчанию 120 для современных устройств
        if (actualFPS >= 100)
          maxFPS = 120
        else if (actualFPS >= 80)
          maxFPS = 90
        else if (actualFPS >= 50)
          maxFPS = 60
        else if (actualFPS >= 30)
          maxFPS = 45
        else maxFPS = 30

        resolve(maxFPS)
        return
      }
      requestAnimationFrame(testFrame)
    }

    requestAnimationFrame(testFrame)
  })
}

const maxDeviceFPS = useStorage('visualization-max-fps', 120)
const hasInitializedFPS = useStorage('visualization-fps-initialized', false)

// Инициализируем максимальный FPS при загрузке
onMounted(async () => {
  // Определяем максимальный FPS только если еще не определили
  if (maxDeviceFPS.value === 120) {
    maxDeviceFPS.value = await getMaxDeviceFPS()
  }

  // Убеждаемся, что текущий FPS не превышает максимальный
  // Но только при первой инициализации
  if (!hasInitializedFPS.value && visualizationFPS.value > maxDeviceFPS.value) {
    visualizationFPS.value = maxDeviceFPS.value
  }
  hasInitializedFPS.value = true
})

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

    <BaseSelect
      v-model="selectedPreset" :options="equalizerPresets.map((preset) => ({
        label: preset.name,
        value: preset.name,
      }))" placeholder="default" label="Equalizer Preset:" @change="applyPreset(selectedPreset)"
    />

    <div class="flex flex-col gap-2 pl-4">
      <div
        v-for="(filter, key) in filterSettings"
        :key="key"
        class="flex items-center gap-2"
      >
        <label :for="`${key}Gain`" class="w-28">{{ key.charAt(0).toUpperCase() + key.slice(1) }} Gain:</label>
        <input
          :id="`${key}Gain`"
          v-model.number="filter.gain"
          type="range"
          min="-12"
          max="12"
          class="flex-1"
        >
        <span class="w-12">{{ filter.gain }} dB</span>
      </div>
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
      <label for="visualizationFPS" class="w-32">Vis. FPS:</label>
      <input
        id="visualizationFPS"
        v-model.number="visualizationFPS"
        type="range"
        min="15"
        :max="maxDeviceFPS"
        step="15"
        class="flex-1"
      >
      <span class="w-12 whitespace-nowrap">{{ visualizationFPS }} FPS</span>
    </div>

    <div class="flex items-center gap-2">
      <label for="loop" class="w-32">Repeat (one file):</label>
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
