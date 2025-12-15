// Плеер для радиостанций: автоматически загружает станцию при изменении activeRadio.
// Используется в RadioPlayer

import type { Wave } from 'shared/types/audio'
import type { Ref } from 'vue'

import { computed, readonly, watch } from 'vue'

import { useAudioController } from './useAudioController'
import { useAudioPlayer } from './useAudioPlayer'

export interface UseRadioPlayerReturn {
  analyser: Ref<AnalyserNode | null>
  audio: Ref<HTMLAudioElement | null>
  isPlaying: Ref<boolean>
  pause: () => void
  pending: Ref<boolean>
  play: () => Promise<void>
}

export function useRadioPlayer(activeRadio: Ref<undefined | Wave>): UseRadioPlayerReturn {
  const controller = useAudioController()

  if (!controller)
    throw new Error('Audio controller is required for useRadioPlayer')

  const activeSourceId = computed(() => (activeRadio.value ? `radio-${activeRadio.value.id}` : null))

  const audioPlayer = useAudioPlayer({
    getDescriptor: () => {
      const station = activeRadio.value
      if (!station)
        return null

      return {
        id: activeSourceId.value ?? `radio-${station.id}`,
        label: station.name,
        src: station.src,
        type: 'stream',
      }
    },
  })

  const pending = computed(() => audioPlayer.isLoading.value && !audioPlayer.isPlaying.value)

  watch(
    activeRadio,
    async (station, _prev, onCleanup) => {
      if (!station) {
        audioPlayer.stop()
        return
      }

      let cancelled = false

      onCleanup(() => {
        cancelled = true
      })

      const descriptorId = activeSourceId.value ?? `radio-${station.id}`

      if (controller.currentSource.value?.id === descriptorId)
        return

      if (!cancelled) {
        try {
          await audioPlayer.load(false)
        }
        catch {}
      }
    },
    { immediate: true },
  )

  watch(
    () => controller.state.isPlaying,
    () => {},
  )

  return {
    analyser: controller.analyser,
    audio: controller.audio,
    isPlaying: audioPlayer.isPlaying,
    pause: audioPlayer.pause,
    pending: readonly(pending),
    play: audioPlayer.play,
  }
}
