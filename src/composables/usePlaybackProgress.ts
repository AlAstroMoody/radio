import type { Ref } from 'vue'

import { useAudioControllerRequired } from 'composables/useAudioController'
import { computed, readonly, ref } from 'vue'

const SEEK_STEP = 10

interface UsePlaybackProgressOptions {
  fallbackDuration?: Ref<number | undefined>
  isActiveSource: () => boolean
}

export function usePlaybackProgress(options: UsePlaybackProgressOptions): {
  currentTime: Readonly<Ref<number>>
  duration: Readonly<Ref<number>>
  handleProgressSeek: (percent: number) => void
  progress: Readonly<Ref<number>>
  seekBackward: () => void
  seekForward: () => void
  undoLastSeek: () => void
} {
  const controller = useAudioControllerRequired()
  const lastSeekPosition = ref<null | number>(null)

  const isActive = computed(() => options.isActiveSource())

  const currentTime = computed(() => (
    isActive.value ? controller.state.currentTime : 0
  ))

  const duration = computed(() => {
    if (!isActive.value)
      return 0

    const audioDuration = controller.state.duration
    if (Number.isFinite(audioDuration) && audioDuration > 0)
      return audioDuration

    const fallback = options.fallbackDuration?.value
    if (fallback && fallback > 0)
      return fallback

    return 0
  })

  const progress = computed(() => {
    if (duration.value <= 0)
      return 0

    return Math.trunc((currentTime.value / duration.value) * 100)
  })

  function seekBackward(): void {
    if (!isActive.value)
      return

    lastSeekPosition.value = controller.state.currentTime
    controller.seek(Math.max(0, controller.state.currentTime - SEEK_STEP))
  }

  function seekForward(): void {
    if (!isActive.value)
      return

    lastSeekPosition.value = controller.state.currentTime
    controller.seek(controller.state.currentTime + SEEK_STEP)
  }

  function undoLastSeek(): void {
    if (!isActive.value || lastSeekPosition.value === null)
      return

    controller.seek(lastSeekPosition.value)
    lastSeekPosition.value = null
  }

  function handleProgressSeek(percent: number): void {
    if (!isActive.value || duration.value <= 0)
      return

    lastSeekPosition.value = controller.state.currentTime
    controller.seek(percent * duration.value)
  }

  return {
    currentTime: readonly(currentTime),
    duration: readonly(duration),
    handleProgressSeek,
    progress: readonly(progress),
    seekBackward,
    seekForward,
    undoLastSeek,
  }
}
