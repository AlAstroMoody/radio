// Создает и управляет HTMLAudioElement, обрабатывает события воспроизведения (play, pause, ended, timeupdate и т.д.)
// и синхронизирует их с состоянием приложения

import type { AudioPlaybackState } from 'app/providers/audio'
import type { Ref } from 'vue'

import { useEventListener } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface UseAudioElementReturn {
  audio: Ref<HTMLAudioElement | null>
}

export function useAudioElement(state: AudioPlaybackState): UseAudioElementReturn {
  const audio = ref<HTMLAudioElement | null>(null)

  function initializeAudioElement(): void {
    const audioElement = new Audio()
    audioElement.crossOrigin = 'anonymous'
    audioElement.preload = 'metadata'
    audio.value = audioElement

    useEventListener(audioElement, 'loadedmetadata', () => {
      const element = audio.value
      if (!element)
        return

      state.duration = Number.isFinite(element.duration) ? element.duration : 0
      state.isReady = true
      state.buffered = element.buffered
      state.volume = element.volume
      state.muted = element.muted
    })

    useEventListener(audioElement, 'timeupdate', () => {
      const element = audio.value
      if (!element)
        return

      state.currentTime = element.currentTime
      state.buffered = element.buffered
    })

    useEventListener(audioElement, 'play', () => {
      state.isPlaying = true
      state.ended = false
      state.error = null
    })

    useEventListener(audioElement, 'pause', () => {
      state.isPlaying = false
    })

    useEventListener(audioElement, 'ended', () => {
      state.isPlaying = false
      state.ended = true
    })

    useEventListener(audioElement, 'volumechange', () => {
      const element = audio.value
      if (!element)
        return

      state.volume = element.volume
      state.muted = element.muted
    })

    useEventListener(audioElement, 'error', () => {
      const element = audio.value
      const error = element?.error
      if (!error) {
        state.error = 'Неизвестная ошибка аудио'
        return
      }

      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          state.error = 'Воспроизведение прервано'
          break
        case MediaError.MEDIA_ERR_DECODE:
          state.error = 'Ошибка декодирования аудио'
          break
        case MediaError.MEDIA_ERR_NETWORK:
          state.error = 'Сетевая ошибка воспроизведения'
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          state.error = 'Источник аудио не поддерживается'
          break
        default:
          state.error = 'Ошибка аудио'
      }
    })
  }

  function cleanupAudioElement(): void {
    if (audio.value) {
      audio.value.pause()
      audio.value.src = ''
      audio.value = null
    }
  }

  onMounted(() => {
    initializeAudioElement()
  })

  onBeforeUnmount(() => {
    cleanupAudioElement()
  })

  return {
    audio,
  }
}
