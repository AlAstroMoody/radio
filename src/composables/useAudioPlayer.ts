// Базовый composable для управления воспроизведением любого аудио источника (файл или радио)
// Содержит общую логику загрузки, воспроизведения и синхронизации состояния. Используется в useAudioService и useRadioPlayer

import type { AudioSourceDescriptor } from 'app/providers/audio'
import type { Ref } from 'vue'

import { useAudioSettings } from 'composables/useAudioSettings'
import { usePlaybackStore } from 'stores'
import { readonly, ref, watch } from 'vue'

import { useAudioControllerRequired } from './useAudioController'

export interface UseAudioPlayerOptions {
  /**
   * Функция для получения дескриптора источника
   */
  getDescriptor: () => AudioSourceDescriptor | null

  /**
   * Callback после успешной загрузки
   */
  onLoaded?: (descriptor: AudioSourceDescriptor) => void

  /**
   * Callback после ошибки загрузки
   */
  onLoadError?: (error: unknown) => void

  /**
   * Функция для проверки, нужно ли загружать источник
   */
  shouldLoad?: (descriptor: AudioSourceDescriptor) => boolean
}

export interface UseAudioPlayerReturn {
  currentDescriptor: Ref<AudioSourceDescriptor | null>
  isLoading: Ref<boolean>
  isPlaying: Ref<boolean>
  load: (autoplay?: boolean) => Promise<void>
  pause: () => void
  play: () => Promise<void>
  stop: () => void
}

export function useAudioPlayer(options: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const controller = useAudioControllerRequired()
  const playbackStore = usePlaybackStore()
  const { volume } = useAudioSettings()

  const isLoading = ref(false)
  const isPlaying = ref(false)
  const currentDescriptor = ref<AudioSourceDescriptor | null>(null)

  const { getDescriptor, onLoaded, onLoadError, shouldLoad = () => true } = options

  async function load(autoplay = false): Promise<void> {
    const descriptor = getDescriptor()
    if (!descriptor)
      return

    if (!shouldLoad(descriptor))
      return

    if (!autoplay && controller.currentSource.value?.id === descriptor.id) {
      playbackStore.setCurrentSourceId(descriptor.id ?? null)
      currentDescriptor.value = descriptor
      return
    }

    isLoading.value = true

    try {
      await controller.load({
        ...descriptor,
        autoplay,
      })
      playbackStore.setCurrentSourceId(descriptor.id ?? null)
      currentDescriptor.value = descriptor
      onLoaded?.(descriptor)
    }
    catch (error) {
      onLoadError?.(error)
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function play(): Promise<void> {
    const descriptor = getDescriptor()
    if (!descriptor)
      return

    if (controller.currentSource.value?.id !== descriptor.id) {
      await load(false)
      if (controller.currentSource.value?.id !== descriptor.id)
        return
    }

    isLoading.value = true
    try {
      await controller.play()
      isPlaying.value = true
      if (descriptor.id)
        playbackStore.setCurrentSourceId(descriptor.id ?? null)
    }
    catch (error) {
      isLoading.value = false
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  function pause(): void {
    controller.pause()
    isPlaying.value = false
  }

  function stop(): void {
    controller.stop()
    isPlaying.value = false
    currentDescriptor.value = null
  }

  watch(
    () => controller.state.isPlaying,
    (playing) => {
      if (currentDescriptor.value?.id === controller.currentSource.value?.id) {
        isPlaying.value = playing
      }
      else {
        isPlaying.value = false
      }
    },
  )

  watch(volume, () => {
    const audioRef = controller.audio.value
    if (audioRef) {
      audioRef.volume = volume.value / 100
    }
  })

  return {
    currentDescriptor: readonly(currentDescriptor),
    isLoading: readonly(isLoading),
    isPlaying: readonly(isPlaying),
    load,
    pause,
    play,
    stop,
  }
}
