import type { Ref } from 'vue'

import { useAudioPosition } from 'composables/useAudioPosition'
import { useAudioSettings } from 'composables/useAudioSettings'
import { AudioService } from 'services'
import { computed, onUnmounted, readonly, ref, watch } from 'vue'

// Константы
const SEEK_STEP = 10 // секунд для перемотки
const AUDIO_CONFIG = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
} as const

export function useAudioService(
  audio: Ref<HTMLAudioElement>,
  fileName?: Ref<string>,
): {
    cleanup: () => void
    currentTime: Ref<number>
    duration: Ref<number>
    getAnalyser: () => AnalyserNode | null
    handleProgressSeek: (percent: number) => void
    initializeAudio: (file: File) => Promise<void>
    initializeAudioService: () => void
    isMetadataLoading: Ref<boolean>
    isPlaying: Ref<boolean>
    pause: () => void
    play: () => Promise<void>
    progress: Ref<number>
    seekBackward: () => void
    seekForward: () => void
    togglePlayPause: () => void
  } {
  // Состояние
  const audioService = ref<AudioService | null>(null)
  const state = ref({
    currentTime: 0,
    duration: 0,
    isMetadataLoading: false,
    isPlaying: false,
    progress: 0,
  })

  // Композаблы
  const { applySettings, autoplay, filterSettings, loop, playbackRate, volume } = useAudioSettings()
  const { clearPosition, restorePosition, savePosition } = useAudioPosition(audio, fileName || ref(''))

  // Анимация
  let animationFrameId: null | number = null

  // Вспомогательные функции
  function updateAudioState(): void {
    if (!audioService.value)
      return

    state.value.progress = audioService.value.getProgress()
    state.value.currentTime = audioService.value.getCurrentTime()
    state.value.duration = audioService.value.getDuration()
    savePosition()
  }

  function startProgressUpdate(): void {
    if (!animationFrameId) {
      updateProgress()
    }
  }

  function stopProgressUpdate(): void {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  function updateProgress(): void {
    if (audioService.value && state.value.isPlaying) {
      updateAudioState()
      animationFrameId = requestAnimationFrame(updateProgress)
    }
  }

  // Обработчики событий
  const eventHandlers = {
    ended: (): void => {
      state.value.isPlaying = false
      stopProgressUpdate()
      clearPosition()
    },
    loadedMetadata: (): void => {
      state.value.isMetadataLoading = false
      if (audioService.value) {
        state.value.duration = audioService.value.getDuration()
      }
    },
    pause: (): void => {
      state.value.isPlaying = false
      stopProgressUpdate()
    },
    play: (): void => {
      state.value.isPlaying = true
      startProgressUpdate()
    },
    timeUpdate: (): void => {
      updateAudioState()
    },
  }

  // Инициализация
  function initializeAudioService(): void {
    if (!audio.value)
      return

    audioService.value = new AudioService(audio.value, AUDIO_CONFIG)

    // Устанавливаем обработчики событий AudioService
    audioService.value.onTimeUpdate(eventHandlers.timeUpdate)
    audioService.value.onEnded(eventHandlers.ended)
    audioService.value.onLoadedMetadata(eventHandlers.loadedMetadata)

    // Синхронизируем состояние воспроизведения с реальным состоянием аудио
    audio.value.addEventListener('play', eventHandlers.play)
    audio.value.addEventListener('pause', eventHandlers.pause)
    audio.value.addEventListener('ended', eventHandlers.ended)
  }

  async function initializeAudio(file: File): Promise<void> {
    if (!audioService.value)
      return

    try {
      state.value.isMetadataLoading = true
      await audioService.value.initializeAudio(file)
      applySettings()
      restorePosition()

      if (audioService.value) {
        state.value.duration = audioService.value.getDuration()
      }
    }
    catch (error) {
      console.error('Ошибка инициализации аудио:', error)
      state.value.isMetadataLoading = false
      throw error
    }
  }

  // Управление воспроизведением
  async function play(): Promise<void> {
    if (!audioService.value)
      return

    try {
      await audioService.value.play()
      // Состояние будет установлено обработчиком события 'play'
    }
    catch (error) {
      console.error('Ошибка воспроизведения:', error)
      state.value.isPlaying = false
    }
  }

  function pause(): void {
    if (!audioService.value)
      return
    audioService.value.pause()
    // Состояние будет установлено обработчиком события 'pause'
  }

  function togglePlayPause(): void {
    if (state.value.isPlaying) {
      pause()
    }
    else {
      play()
    }
  }

  // Управление перемоткой
  function seekBackward(): void {
    if (!audioService.value)
      return
    audioService.value.seekBySeconds(-SEEK_STEP)
  }

  function seekForward(): void {
    if (!audioService.value)
      return
    audioService.value.seekBySeconds(SEEK_STEP)
  }

  function handleProgressSeek(percent: number): void {
    if (!audioService.value)
      return

    const duration = audioService.value.getDuration()
    if (duration <= 0)
      return

    audioService.value.seek(percent * duration)
  }

  // Утилиты
  function getAnalyser(): AnalyserNode | null {
    return audioService.value?.getAnalyser() || null
  }

  function cleanup(): void {
    // Удаляем обработчики событий
    if (audio.value) {
      audio.value.removeEventListener('play', eventHandlers.play)
      audio.value.removeEventListener('pause', eventHandlers.pause)
      audio.value.removeEventListener('ended', eventHandlers.ended)
    }

    stopProgressUpdate()
    audioService.value?.cleanup()
    audioService.value = null
  }

  // Watchers
  watch(filterSettings, (newSettings) => {
    audioService.value?.updateFilterSettings(newSettings)
  }, { deep: true })

  watch([volume, playbackRate, loop, autoplay], () => {
    if (audioService.value) {
      audioService.value.applyAudioSettings({
        autoplay: autoplay.value,
        loop: loop.value,
        playbackRate: playbackRate.value,
        volume: volume.value,
      })
    }
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    cleanup,
    currentTime: readonly(computed(() => state.value.currentTime)),
    duration: readonly(computed(() => state.value.duration)),
    getAnalyser,
    handleProgressSeek,
    initializeAudio,
    initializeAudioService,
    isMetadataLoading: readonly(computed(() => state.value.isMetadataLoading)),
    isPlaying: readonly(computed(() => state.value.isPlaying)),
    pause,
    play,
    progress: readonly(computed(() => state.value.progress)),
    seekBackward,
    seekForward,
    togglePlayPause,
  }
}
