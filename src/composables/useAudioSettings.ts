import type { Ref } from 'vue'

import { useStorage } from '@vueuse/core'
import { watch } from 'vue'

export interface EqualizerPreset {
  name: string
  settings: FilterSettings
}

export interface FilterSettings {
  bass: { frequency: number, gain: number }
  mid: { frequency: number, gain: number }
  treble: { frequency: number, gain: number }
}

export interface useAudioSettingsReturn {
  applyPreset: (presetName: string) => void
  applySettings: () => void
  autoplay: Ref<boolean>
  equalizerPresets: { name: string, settings: { bass: { frequency: number, gain: number }, mid: { frequency: number, gain: number }, treble: { frequency: number, gain: number } } }[]
  filterSettings: Ref<{ bass: { frequency: number, gain: number }, mid: { frequency: number, gain: number }, treble: { frequency: number, gain: number } }>
  loop: Ref<boolean>
  playbackRate: Ref<number>
  selectedPreset: Ref<string>
  visualization: Ref<string>
  visualizationFPS: Ref<number>
  visualizationIntensity: Ref<number>
  volume: Ref<number>
}

export function useAudioSettings(): useAudioSettingsReturn {
  const volume = useStorage('audio-volume', 100)
  const playbackRate = useStorage('audio-playback-rate', 1)
  const loop = useStorage('audio-loop', false)
  const autoplay = useStorage('audio-autoplay', false)
  const visualization = useStorage('audio-visualization', '')
  const visualizationIntensity = useStorage('visualization-intensity', 1)
  const visualizationFPS = useStorage('visualization-fps', 60)
  const selectedPreset = useStorage('audio-equalizer-preset', 'default')
  const filterSettings = useStorage<FilterSettings>('audio-filter-settings', {
    bass: { frequency: 100, gain: 0 },
    mid: { frequency: 1000, gain: 0 },
    treble: { frequency: 4000, gain: 0 },
  })

  const equalizerPresets: EqualizerPreset[] = [
    { name: 'default', settings: { bass: { frequency: 250, gain: 0 }, mid: { frequency: 1000, gain: 0 }, treble: { frequency: 4000, gain: 0 } } },
    { name: 'Pop', settings: { bass: { frequency: 250, gain: 6 }, mid: { frequency: 1000, gain: -2 }, treble: { frequency: 4000, gain: 4 } } },
    { name: 'Rock', settings: { bass: { frequency: 200, gain: 8 }, mid: { frequency: 1200, gain: 4 }, treble: { frequency: 4000, gain: 2 } } },
    { name: 'Jazz', settings: { bass: { frequency: 250, gain: 4 }, mid: { frequency: 800, gain: 3 }, treble: { frequency: 4000, gain: -2 } } },
    { name: 'Electronic', settings: { bass: { frequency: 200, gain: 10 }, mid: { frequency: 1000, gain: 2 }, treble: { frequency: 4500, gain: 6 } } },
    { name: 'Speech', settings: { bass: { frequency: 250, gain: -4 }, mid: { frequency: 2000, gain: 6 }, treble: { frequency: 4000, gain: -2 } } },
  ]

  function applyPreset(presetName: string): void {
    const preset = equalizerPresets.find(p => p.name === presetName)
    if (preset) {
      filterSettings.value = { ...preset.settings }
      selectedPreset.value = presetName
    }
  }

  function applySettings(): void {
    const audio = document.querySelector('audio')
    if (!audio)
      return

    if (audio.volume !== volume.value / 100)
      audio.volume = volume.value / 100
    if (audio.playbackRate !== playbackRate.value)
      audio.playbackRate = playbackRate.value
    if (audio.loop !== loop.value)
      audio.loop = loop.value
    if (audio.autoplay !== autoplay.value)
      audio.autoplay = autoplay.value
  }

  watch([volume, playbackRate, loop, autoplay, filterSettings], () => {
    applySettings()
  }, { deep: true })

  return {
    applyPreset,
    applySettings,
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
  }
}
