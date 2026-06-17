import type { YtTrack } from 'shared/types/yt'
import type { Ref } from 'vue'

import { useYtStore } from 'stores'
import { computed, onScopeDispose, readonly, watch } from 'vue'

import { useAudioController } from './useAudioController'
import { useAudioPlayer } from './useAudioPlayer'

export interface UseYtPlayerReturn {
  analyser: Ref<AnalyserNode | null>
  audio: Ref<HTMLAudioElement | null>
  isPlaying: Ref<boolean>
  pause: () => void
  pending: Ref<boolean>
  play: () => Promise<void>
}

export function useYtPlayer(activeTrack: Ref<undefined | YtTrack>): UseYtPlayerReturn {
  const controller = useAudioController()
  const ytStore = useYtStore()

  if (!controller)
    throw new Error('Audio controller is required for useYtPlayer')

  const activeSourceId = computed(() => (
    activeTrack.value?.videoId ? `yt-${activeTrack.value.videoId}` : null
  ))

  const audioPlayer = useAudioPlayer({
    getDescriptor: () => {
      const track = activeTrack.value
      if (!track?.videoId)
        return null

      return {
        id: activeSourceId.value ?? `yt-${track.videoId}`,
        label: track.title || track.videoId,
        src: ytStore.getStreamUrl(track.videoId),
        type: 'stream',
      }
    },
  })

  const pending = computed(() => audioPlayer.isLoading.value && !audioPlayer.isPlaying.value)

  watch(
    activeTrack,
    async (track, _prev, onCleanup) => {
      if (!track?.videoId) {
        audioPlayer.stop()
        return
      }

      let cancelled = false

      onCleanup(() => {
        cancelled = true
      })

      const descriptorId = activeSourceId.value ?? `yt-${track.videoId}`

      if (controller.currentSource.value?.id === descriptorId)
        return

      if (!cancelled) {
        try {
          await audioPlayer.load(false)
        }
        catch { }
      }
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    audioPlayer.pause()
    if (controller.currentSource.value?.id?.startsWith('yt-')) {
      audioPlayer.stop()
    }
  })

  return {
    analyser: controller.analyser,
    audio: controller.audio,
    isPlaying: audioPlayer.isPlaying,
    pause: audioPlayer.pause,
    pending: readonly(pending),
    play: audioPlayer.play,
  }
}
