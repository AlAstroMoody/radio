<script setup lang="ts">
import { useAudioController } from 'composables/useAudioController'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useHotkeys } from 'composables/useHotkeys'
import { useMediaSession } from 'composables/useMediaSession'
import { usePlaybackProgress } from 'composables/usePlaybackProgress'
import { useToast } from 'composables/useToast'
import { useYt } from 'composables/useYt'
import { useYtPlayer } from 'composables/useYtPlayer'
import { storeToRefs } from 'pinia'
import { formatYtArtists, formatYtTitle, getYtThumbnailArtwork } from 'shared/types/yt'
import { AudioControls, MarqueeText, ProgressBar } from 'shared/ui'
import { usePlaybackStore, useYtStore } from 'stores'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const POSITION_SAVE_INTERVAL = 1000

const { activeTrack, isLoadingLiked, isLoadingRadio, isRepeat, isShuffle, lastQuery, loadLiked, loadSimilarTracks, nextTrack, prevTrack, shuffleTracks, toggleRepeat } = useYt()
const playbackStore = usePlaybackStore()
const ytStore = useYtStore()
const { isYtMode } = storeToRefs(playbackStore)
const { loop, volume } = useAudioSettings()
const { showToast } = useToast()

const { isSupported: isMediaSessionSupported, setActionHandlers, setMetadata, setPlaybackState, setPositionState } = useMediaSession()

const {
  error: playError,
  isPlaying,
  pause,
  pending,
  play,
} = useYtPlayer(activeTrack)

watch(playError, (error) => {
  if (error)
    showToast(error)
})

const audioController = useAudioController()
const wasPlayingBeforeSwitch = ref(false)
let lastPositionSavedAt = 0

const trackTitle = computed(() => formatYtTitle(activeTrack.value))
const trackArtist = computed(() => formatYtArtists(activeTrack.value))
const marqueeText = computed(() => `${trackTitle.value} — ${trackArtist.value}`)
const fallbackDuration = computed(() => activeTrack.value?.duration_seconds)
const activeSourceId = computed(() => (
  activeTrack.value?.videoId ? `yt-${activeTrack.value.videoId}` : null
))

const repeatMode = computed(() => {
  if (loop.value)
    return 'one' as const
  if (isRepeat.value)
    return 'all' as const
  return 'off' as const
})

function cycleRepeat(): void {
  if (loop.value) {
    loop.value = false
    if (!isRepeat.value)
      toggleRepeat()
    return
  }

  if (isRepeat.value) {
    toggleRepeat()
    return
  }

  loop.value = true
}

const {
  currentTime,
  duration,
  handleProgressSeek,
  progress,
  seekBackward,
  seekForward,
} = usePlaybackProgress({
  fallbackDuration,
  isActiveSource: () => {
    const currentId = audioController?.currentSource.value?.id
    return !!currentId && currentId === activeSourceId.value
  },
})

function onProgressSeek(percent: number): void {
  handleProgressSeek(percent)
  saveCurrentPosition()
}

async function playYt(): Promise<void> {
  try {
    await play()
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      return

    throw error
  }
}

function saveCurrentPosition(): void {
  const videoId = activeTrack.value?.videoId
  if (!videoId || !audioController)
    return

  const currentId = audioController.currentSource.value?.id
  if (currentId !== activeSourceId.value)
    return

  ytStore.savePlaybackPosition(videoId, audioController.state.currentTime)
  lastPositionSavedAt = Date.now()
}

function saveCurrentPositionThrottled(): void {
  if (!isYtMode.value || !activeTrack.value?.videoId)
    return

  const currentId = audioController?.currentSource.value?.id
  if (!currentId || currentId !== activeSourceId.value)
    return

  const now = Date.now()
  if (now - lastPositionSavedAt < POSITION_SAVE_INTERVAL)
    return

  saveCurrentPosition()
}

function setupYtMediaSessionHandlers(): void {
  if (!isMediaSessionSupported.value)
    return

  setActionHandlers({
    nexttrack: () => {
      void nextTrack()
    },
    pause: () => {
      if (isPlaying.value)
        pause()
    },
    play: () => {
      if (!isPlaying.value)
        void playYt()
    },
    previoustrack: prevTrack,
    seekbackward: () => {
      seekBackward()
    },
    seekforward: () => {
      seekForward()
    },
  })
}

function togglePlayPause(): void {
  if (isPlaying.value)
    pause()
  else
    void playYt()
}

function updateYtMediaSessionMetadata(): void {
  if (!isMediaSessionSupported.value || !activeTrack.value)
    return

  setMetadata({
    artist: trackArtist.value,
    artwork: getYtThumbnailArtwork(activeTrack.value),
    title: trackTitle.value,
  })
}

function updateYtMediaSessionPosition(): void {
  if (!isMediaSessionSupported.value || duration.value <= 0)
    return

  setPositionState({
    duration: duration.value,
    playbackRate: 1,
    position: currentTime.value,
  })
}

watch(activeTrack, async (track, oldTrack) => {
  updateYtMediaSessionMetadata()

  const trackChanged = !!oldTrack?.videoId && track?.videoId !== oldTrack.videoId

  const shouldResume = isPlaying.value || wasPlayingBeforeSwitch.value
  wasPlayingBeforeSwitch.value = false
  pause()

  if (!track)
    return

  if (trackChanged) {
    ytStore.clearPlaybackPosition()
    lastPositionSavedAt = 0
  }

  if (!shouldResume)
    return

  try {
    await playYt()
  }
  catch {}
})

watch(() => isYtMode.value, async (value) => {
  if (!value) {
    saveCurrentPosition()
    pause()
    return
  }

  await nextTick()

  if (!playbackStore.consumeModeEnterResume() || !activeTrack.value)
    return

  try {
    await playYt()
  }
  catch {}
}, { immediate: true })

watch(
  () => audioController?.state.ended,
  (ended) => {
    if (!ended || !isYtMode.value)
      return

    if (!audioController?.currentSource.value?.id?.startsWith('yt-'))
      return

    if (activeTrack.value?.videoId) {
      ytStore.clearPlaybackPosition()
      lastPositionSavedAt = 0
    }

    wasPlayingBeforeSwitch.value = true
    void nextTrack()
  },
)

useHotkeys([
  { callback: togglePlayPause, key: ' ', preventDefault: true },
  { callback: seekBackward, key: 'ArrowLeft', preventDefault: true },
  { callback: seekForward, key: 'ArrowRight', preventDefault: true },
  { callback: () => {
    volume.value = Math.min(100, volume.value + 10)
  }, key: 'ArrowUp', preventDefault: true },
  { callback: () => {
    volume.value = Math.max(0, volume.value - 10)
  }, key: 'ArrowDown', preventDefault: true },
  { callback: () => {
    void nextTrack()
  }, key: 'n', preventDefault: true },
  { callback: prevTrack, key: 'p', preventDefault: true },
  { callback: cycleRepeat, key: 'r', preventDefault: true },
  { callback: shuffleTracks, key: 's', preventDefault: true },
])

onMounted(() => {
  setupYtMediaSessionHandlers()
  updateYtMediaSessionMetadata()
})

watch(isPlaying, (playing, wasPlaying) => {
  if (wasPlaying && !playing)
    saveCurrentPosition()

  if (isMediaSessionSupported.value)
    setPlaybackState(playing ? 'playing' : 'paused')
})

watch(currentTime, () => {
  saveCurrentPositionThrottled()
})

watch([currentTime, duration], () => {
  if (isMediaSessionSupported.value && duration.value > 0)
    updateYtMediaSessionPosition()
})
</script>

<template>
  <div
    v-if="activeTrack"
    class="flex w-full max-w-[360px] flex-col items-center gap-2"
  >
    <AudioControls
      :is-playing="isPlaying"
      :pending="pending"
      :play-error="playError"
      :loading-similar-tracks="isLoadingRadio"
      :loading-favorites="isLoadingLiked"
      :is-favorites="lastQuery === 'Liked'"
      :is-shuffle="isShuffle"
      :repeat-mode="repeatMode"
      :show-library-controls="false"
      @seek-backward="seekBackward"
      @prev-file="prevTrack"
      @toggle-play-pause="togglePlayPause"
      @next-file="() => void nextTrack()"
      @seek-forward="seekForward"
      @load-similar-tracks="() => void loadSimilarTracks()"
      @load-favorites="() => void loadLiked()"
      @shuffle-files="shuffleTracks"
      @toggle-repeat="cycleRepeat"
    />

    <ProgressBar
      class="w-full"
      :current-time="currentTime"
      :duration="duration"
      :progress="progress"
      :is-loading="pending && !playError"
      @seek="onProgressSeek"
    />

    <div class="flex w-full justify-between gap-2 px-2 font-blackcraft text-black dark:text-white">
      <MarqueeText
        :text="marqueeText"
        :speed="30"
        :min-duration="8"
        class="max-w-[calc(100%-48px)]"
      />
      <div class="flex min-w-[48px] items-center justify-center text-center">
        {{ progress }}%
      </div>
    </div>
  </div>
  <p
    v-else
    class="flex min-h-40 w-full max-w-[360px] items-center justify-center px-4 text-center text-sm opacity-70 dark:text-white"
  >
    Search or pick a track to play
  </p>
</template>
