import type { YtTrack } from 'shared/types/yt'
import type { Ref } from 'vue'

import { useYtStore } from 'stores'
import { computed, onScopeDispose, readonly, ref, watch } from 'vue'

import { useAudioControllerRequired } from './useAudioController'
import { useAudioPlayer } from './useAudioPlayer'

export interface UseYtPlayerReturn {
  analyser: Ref<AnalyserNode | null>
  audio: Ref<HTMLAudioElement | null>
  error: Ref<string>
  isPlaying: Ref<boolean>
  pause: () => void
  pending: Ref<boolean>
  play: () => Promise<void>
}

export function useYtPlayer(activeTrack: Ref<undefined | YtTrack>): UseYtPlayerReturn {
  const controller = useAudioControllerRequired()
  const ytStore = useYtStore()

  const loadError = ref('')
  const isLoadInFlight = ref(false)
  let loadPromise: null | Promise<void> = null

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
    onLoadError: (error) => {
      loadError.value = error instanceof Error ? error.message : 'Failed to load stream'
    },
  })

  const pending = computed(() => {
    if (!activeTrack.value?.videoId || loadError.value || controller.state.error)
      return false

    if (audioPlayer.isLoading.value || isLoadInFlight.value)
      return true

    const descriptorId = activeSourceId.value
    const currentId = controller.currentSource.value?.id

    if (descriptorId && currentId !== descriptorId)
      return true

    if (descriptorId && currentId === descriptorId && !controller.state.isReady)
      return true

    return false
  })

  function isCurrentTrackReady(videoId: string): boolean {
    const descriptorId = `yt-${videoId}`
    return controller.currentSource.value?.id === descriptorId
      && controller.state.isReady
      && !controller.state.error
  }

  async function loadCurrentTrack(): Promise<void> {
    const videoId = activeTrack.value?.videoId
    if (typeof videoId !== 'string')
      return

    if (isCurrentTrackReady(videoId)) {
      loadError.value = ''
      await applySavedPosition(videoId)
      return
    }

    if (loadPromise)
      return loadPromise

    loadError.value = ''
    isLoadInFlight.value = true

    const pendingVideoId = videoId

    loadPromise = (async () => {
      try {
        await audioPlayer.load(false)
        if (controller.state.error) {
          loadError.value = controller.state.error
          return
        }
        await applySavedPosition(pendingVideoId)
      }
      catch (error) {
        loadError.value = error instanceof Error ? error.message : 'Failed to load stream'
        audioPlayer.pause()
      }
    })()

    try {
      await loadPromise
    }
    finally {
      loadPromise = null
      isLoadInFlight.value = false
    }
  }

  watch(
    activeTrack,
    async (track, _prev, onCleanup) => {
      if (!track?.videoId) {
        loadError.value = ''
        loadPromise = null
        isLoadInFlight.value = false
        audioPlayer.stop()
        return
      }

      let cancelled = false

      onCleanup(() => {
        cancelled = true
      })

      if (!cancelled)
        await loadCurrentTrack()
    },
    { immediate: true },
  )

  watch(
    () => controller.state.error,
    (error) => {
      if (!error)
        return

      if (!controller.currentSource.value?.id?.startsWith('yt-'))
        return

      loadError.value = error
    },
  )

  async function applySavedPosition(videoId: string): Promise<void> {
    const position = ytStore.getPlaybackPosition(videoId)
    if (position <= 0)
      return

    if (!controller.state.isReady) {
      await new Promise<void>((resolve) => {
        const stop = watch(
          () => controller.state.isReady || !!controller.state.error,
          (done) => {
            if (done) {
              stop()
              resolve()
            }
          },
          { immediate: true },
        )
      })
    }

    if (controller.state.error || !controller.state.isReady)
      return

    if (Math.abs(controller.state.currentTime - position) > 1)
      controller.seek(position)
  }

  async function play(): Promise<void> {
    const track = activeTrack.value
    if (!track?.videoId)
      return

    loadError.value = ''

    if (!isCurrentTrackReady(track.videoId)) {
      await loadCurrentTrack()
      if (loadError.value)
        return
    }

    await applySavedPosition(track.videoId)

    try {
      await audioPlayer.play()
    }
    catch (error) {
      if (error instanceof Error && error.name === 'AbortError')
        return

      loadError.value = error instanceof Error ? error.message : 'Playback failed'
    }
  }

  onScopeDispose(() => {
    audioPlayer.pause()
  })

  return {
    analyser: controller.analyser,
    audio: controller.audio,
    error: readonly(loadError),
    isPlaying: audioPlayer.isPlaying,
    pause: audioPlayer.pause,
    pending: readonly(pending),
    play,
  }
}
