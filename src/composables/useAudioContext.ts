import type { Ref } from 'vue'

import { useAudioSettings } from 'composables/useAudioSettings'
import { ref, watch } from 'vue'

interface Filters {
  bass: BiquadFilterNode
  mid: BiquadFilterNode
  treble: BiquadFilterNode
}

export function useAudioContext(audio: Ref<HTMLAudioElement>): {
  analyser: Ref<AnalyserNode | null>
  audioContext: Ref<AudioContext | null>
  cleanup: () => void
  filters: Ref<Filters | null>
  initializeAudio: (file: File) => Promise<void>
  isMetadataLoading: Ref<boolean>
  resumeAudioContext: () => Promise<void>
  sourceNode: Ref<MediaElementAudioSourceNode | null>
} {
  const audioContext = ref<AudioContext | null>(null)
  const analyser = ref<AnalyserNode | null>(null)
  const sourceNode = ref<MediaElementAudioSourceNode | null>(null)
  const filters = ref<Filters | null>(null)
  const isMetadataLoading = ref<boolean>(false)

  const { filterSettings } = useAudioSettings()

  function connectFilters(audioContext: AudioContext): Filters | null {
    if (!audioContext)
      return null
    const filters = {
      bass: audioContext.createBiquadFilter(),
      mid: audioContext.createBiquadFilter(),
      treble: audioContext.createBiquadFilter(),
    }
    filters.bass.type = 'lowshelf'
    filters.mid.type = 'peaking'
    filters.treble.type = 'highshelf'
    updateFilterSettings(filters)
    return filters
  }

  function updateFilterSettings(filters: Filters): void {
    filters.bass.gain.value = filterSettings.value.bass.gain
    filters.bass.frequency.value = filterSettings.value.bass.frequency
    filters.mid.gain.value = filterSettings.value.mid.gain
    filters.mid.frequency.value = filterSettings.value.mid.frequency
    filters.treble.gain.value = filterSettings.value.treble.gain
    filters.treble.frequency.value = filterSettings.value.treble.frequency
  }

  function cleanup(): void {
    if (sourceNode.value) {
      sourceNode.value.disconnect()
      sourceNode.value = null
    }
    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }
    if (audio.value?.src) {
      URL.revokeObjectURL(audio.value.src)
    }
    filters.value = null
    analyser.value = null
  }

  async function initializeAudio(file: File): Promise<void> {
    try {
      if (!file) {
        throw new Error('Аудиофайл не выбран')
      }
      if (!window.AudioContext) {
        throw new Error('Web Audio API не поддерживается')
      }

      if (!audioContext.value) {
        audioContext.value = new AudioContext()
      }

      // Устанавливаем состояние загрузки метаданных
      isMetadataLoading.value = true
      audio.value.src = URL.createObjectURL(file)

      if (!sourceNode.value) {
        analyser.value = audioContext.value.createAnalyser()
        analyser.value.fftSize = 2048

        sourceNode.value = audioContext.value.createMediaElementSource(audio.value)

        filters.value = connectFilters(audioContext.value)
        if (filters.value) {
          sourceNode.value.connect(analyser.value)
          analyser.value.connect(filters.value.bass)
          filters.value.bass.connect(filters.value.mid)
          filters.value.mid.connect(filters.value.treble)
          filters.value.treble.connect(audioContext.value.destination)
        }
        else {
          sourceNode.value.connect(analyser.value)
          analyser.value.connect(audioContext.value.destination)
        }
      }
    }
    catch (error) {
      console.error('Ошибка инициализации аудио:', error)
      isMetadataLoading.value = false
      throw error
    }
  }

  function resumeAudioContext(): Promise<void> {
    if (audioContext.value?.state === 'suspended') {
      return audioContext.value.resume()
    }
    return Promise.resolve()
  }

  // Слушаем изменения настроек фильтров
  watch(
    () => filterSettings.value,
    () => {
      if (filters.value) {
        updateFilterSettings(filters.value)
      }
    },
    { deep: true, flush: 'post' },
  )

  return {
    analyser,
    audioContext,
    cleanup,
    filters,
    initializeAudio,
    isMetadataLoading,
    resumeAudioContext,
    sourceNode,
  }
}
