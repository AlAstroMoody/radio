import type { Ref } from 'vue'

import { useAudioPosition } from 'composables/useAudioPosition'
import { useAudioSettings } from 'composables/useAudioSettings'
import { AudioService } from 'services'
import { onUnmounted, readonly, ref, watch } from 'vue'

export function useAudioService(audio: Ref<HTMLAudioElement>, fileName?: Ref<string>): {
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
  const audioService = ref<AudioService | null>(null)
  const isPlaying = ref(false)
  const progress = ref(0)
  const currentTime = ref(0)
  const duration = ref(0)
  const isMetadataLoading = ref(false)

  // Сохраняем ссылки на обработчики для правильной очистки
  const playHandler = (): void => {
    isPlaying.value = true
    startProgressUpdate()
  }
  const pauseHandler = (): void => {
    isPlaying.value = false
    stopProgressUpdate()
  }
  const endedHandler = (): void => {
    isPlaying.value = false
    stopProgressUpdate()
  }

  const { applySettings, autoplay, filterSettings, loop, playbackRate, volume } = useAudioSettings()
  const { clearPosition, restorePosition, savePosition } = useAudioPosition(audio, fileName || ref(''))

  let animationFrameId: null | number = null

  function updateProgress(): void {
    if (audioService.value && isPlaying.value) {
      progress.value = audioService.value.getProgress()
      currentTime.value = audioService.value.getCurrentTime()
      duration.value = audioService.value.getDuration()
      savePosition()
      animationFrameId = requestAnimationFrame(updateProgress)
    }
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

  function initializeAudioService(): void {
    if (!audio.value)
      return

    audioService.value = new AudioService(audio.value, {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
    })

    // Устанавливаем обработчики событий
    audioService.value.onTimeUpdate(() => {
      if (audioService.value) {
        progress.value = audioService.value.getProgress()
        currentTime.value = audioService.value.getCurrentTime()
        duration.value = audioService.value.getDuration()
        savePosition()
      }
    })

    audioService.value.onEnded(() => {
      clearPosition()
      isPlaying.value = false
      stopProgressUpdate()
    })

    audioService.value.onLoadedMetadata(() => {
      isMetadataLoading.value = false
      // Обновляем duration при загрузке метаданных
      if (audioService.value) {
        duration.value = audioService.value.getDuration()
      }
    })

    // Синхронизируем состояние воспроизведения с реальным состоянием аудио
    audio.value.addEventListener('play', playHandler)
    audio.value.addEventListener('pause', pauseHandler)
    audio.value.addEventListener('ended', endedHandler)
  }

  async function initializeAudio(file: File): Promise<void> {
    if (!audioService.value)
      return

    try {
      isMetadataLoading.value = true
      await audioService.value.initializeAudio(file)
      applySettings()
      restorePosition()
      // Обновляем duration после инициализации
      if (audioService.value) {
        duration.value = audioService.value.getDuration()
      }
    }
    catch (error) {
      console.error('Ошибка инициализации аудио:', error)
      isMetadataLoading.value = false
      throw error
    }
  }

  async function play(): Promise<void> {
    if (!audioService.value)
      return

    try {
      await audioService.value.play()
      // Состояние будет установлено обработчиком события 'play'
    }
    catch (error) {
      console.error('Ошибка воспроизведения:', error)
      isPlaying.value = false
    }
  }

  function pause(): void {
    if (!audioService.value)
      return

    audioService.value.pause()
    // Состояние будет установлено обработчиком события 'pause'
  }

  function togglePlayPause(): void {
    if (isPlaying.value) {
      pause()
    }
    else {
      play()
    }
  }

  function seekBackward(): void {
    if (!audioService.value)
      return
    audioService.value.seekBySeconds(-10)
  }

  function seekForward(): void {
    if (!audioService.value)
      return
    audioService.value.seekBySeconds(10)
  }

  function handleProgressSeek(percent: number): void {
    if (!audioService.value)
      return

    const duration = audioService.value.getDuration()
    if (duration <= 0)
      return

    audioService.value.seek(percent * duration)
  }

  function getAnalyser(): AnalyserNode | null {
    return audioService.value?.getAnalyser() || null
  }

  function cleanup(): void {
    // Удаляем обработчики событий
    if (audio.value) {
      audio.value.removeEventListener('play', playHandler)
      audio.value.removeEventListener('pause', pauseHandler)
      audio.value.removeEventListener('ended', endedHandler)
    }

    stopProgressUpdate()
    audioService.value?.cleanup()
    audioService.value = null
  }

  // Следим за изменениями настроек фильтров
  watch(filterSettings, (newSettings) => {
    audioService.value?.updateFilterSettings(newSettings)
  }, { deep: true })

  // Следим за изменениями аудио настроек
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
    currentTime: readonly(currentTime),
    duration: readonly(duration),
    getAnalyser,
    handleProgressSeek,

    initializeAudio,
    // Методы
    initializeAudioService,
    isMetadataLoading: readonly(isMetadataLoading),
    // Состояние
    isPlaying: readonly(isPlaying),
    pause,
    play,
    progress: readonly(progress),
    seekBackward,
    seekForward,
    togglePlayPause,
  }
}
