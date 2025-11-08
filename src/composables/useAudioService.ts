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

const POSITION_SAVE_INTERVAL = 1000 // мс между автосохранениями

export function useAudioService(
  audio: Ref<HTMLAudioElement>,
  fileName: Ref<string>,
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
  undoLastSeek: () => void
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

  // История перемотки
  const lastSeekPosition = ref<null | number>(null)

  const { applySettings, autoplay, filterSettings, loop, playbackRate, volume } = useAudioSettings()
  const { clearPosition, restorePosition, savePosition, setTrackName } = useAudioPosition(
    audio,
    fileName,
  )

  let lastPositionSavedAt = 0

  function savePositionThrottled(): void {
    const now = Date.now()
    if (now - lastPositionSavedAt < POSITION_SAVE_INTERVAL)
      return

    savePosition()
    lastPositionSavedAt = now
  }

  function flushPositionSave(): void {
    savePosition()
    lastPositionSavedAt = Date.now()
  }

  function clearStoredPosition(): void {
    clearPosition()
    lastPositionSavedAt = 0
  }

  // Анимация
  let animationFrameId: null | number = null

  // Вспомогательные функции
  function updateAudioState(): void {
    if (!audioService.value)
      return

    state.value.progress = audioService.value.getProgress()
    state.value.currentTime = audioService.value.getCurrentTime()
    state.value.duration = audioService.value.getDuration()
    savePositionThrottled()
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
      clearStoredPosition()
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
      flushPositionSave()
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
      // Сбрасываем историю перемотки при смене файла
      lastSeekPosition.value = null
      await audioService.value.initializeAudio(file)
      setTrackName(file.name)
      lastPositionSavedAt = 0
      applySettings()
      restorePosition()
      flushPositionSave()

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

    lastSeekPosition.value = audioService.value.getCurrentTime()
    audioService.value.seekBySeconds(-SEEK_STEP)
    flushPositionSave()
  }

  function seekForward(): void {
    if (!audioService.value)
      return

    lastSeekPosition.value = audioService.value.getCurrentTime()
    audioService.value.seekBySeconds(SEEK_STEP)
    flushPositionSave()
  }

  function undoLastSeek(): void {
    if (!audioService.value || lastSeekPosition.value === null) {
      return
    }

    audioService.value.seek(lastSeekPosition.value)
    lastSeekPosition.value = null
  }

  function handleProgressSeek(percent: number): void {
    if (!audioService.value)
      return

    const duration = audioService.value.getDuration()
    if (duration <= 0)
      return

    lastSeekPosition.value = audioService.value.getCurrentTime()
    audioService.value.seek(percent * duration)
    flushPositionSave()
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
    flushPositionSave()
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
    undoLastSeek,
  }
}
