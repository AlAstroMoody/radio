<script setup lang="ts">
import { useAudioController } from 'composables/useAudioController'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useHotkeys } from 'composables/useHotkeys'
import { useMediaSession } from 'composables/useMediaSession'
import { useYt } from 'composables/useYt'
import { useYtPlayer } from 'composables/useYtPlayer'
import { usePlaybackStore } from 'stores'
import { formatYtArtists, formatYtTitle, getYtThumbnailArtwork, getYtThumbnailUrl } from 'shared/types/yt'
import { BaseButton, iPlay, iSpin } from 'shared/ui'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const { activeTrack, nextTrack, prevTrack } = useYt()
const playbackStore = usePlaybackStore()
const { isYtMode } = storeToRefs(playbackStore)
const { volume, autoplay, ytCoverArt } = useAudioSettings()

const { isSupported: isMediaSessionSupported, setActionHandlers, setMetadata, setPlaybackState } = useMediaSession()

const {
  audio,
  isPlaying,
  pause,
  pending,
  play,
} = useYtPlayer(activeTrack)

const audioController = useAudioController()
const wasPlayingBeforeToggle = ref(false)
const wasPlayingBeforeSwitch = ref(false)

const trackTitle = computed(() => formatYtTitle(activeTrack.value))
const trackArtist = computed(() => formatYtArtists(activeTrack.value))
const coverUrl = computed(() => getYtThumbnailUrl(activeTrack.value, 120))

watch(activeTrack, async (track) => {
  const shouldResume = isPlaying.value || wasPlayingBeforeSwitch.value
  wasPlayingBeforeSwitch.value = false
  pause()

  if (!track)
    return

  if (!autoplay.value && !shouldResume)
    return

  try {
    await playYt()
  }
  catch {}
})

watch(() => isYtMode.value, (value) => {
  if (!value) {
    wasPlayingBeforeToggle.value = isPlaying.value
    pause()
    return
  }

  if (wasPlayingBeforeToggle.value) {
    nextTick(() => {
      if (!isYtMode.value || !activeTrack.value)
        return

      playYt()
      wasPlayingBeforeToggle.value = false
    })
  }
})

watch(
  () => audioController?.state.ended,
  (ended) => {
    if (!ended || !isYtMode.value)
      return

    if (!audioController?.currentSource.value?.id?.startsWith('yt-'))
      return

    wasPlayingBeforeSwitch.value = true
    nextTrack()
  },
)

async function playYt(): Promise<void> {
  try {
    await play()
    if (audio.value)
      audio.value.playbackRate = 1
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      return

    throw error
  }
}

function setupYtMediaSessionHandlers(): void {
  if (!isMediaSessionSupported.value)
    return

  setActionHandlers({
    nexttrack: nextTrack,
    pause: () => {
      if (isPlaying.value)
        pause()
    },
    play: () => {
      if (!isPlaying.value)
        void playYt()
    },
    previoustrack: prevTrack,
  })
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

useHotkeys([
  { callback: () => {
    if (isPlaying.value)
      pause()
    else
      void playYt()
  }, key: ' ', preventDefault: true },
  { callback: () => {
    volume.value = Math.min(100, volume.value + 10)
  }, key: 'ArrowUp', preventDefault: true },
  { callback: () => {
    volume.value = Math.max(0, volume.value - 10)
  }, key: 'ArrowDown', preventDefault: true },
  { callback: nextTrack, key: 'n', preventDefault: true },
  { callback: prevTrack, key: 'p', preventDefault: true },
])

onMounted(() => {
  setupYtMediaSessionHandlers()
  updateYtMediaSessionMetadata()
})

watch(activeTrack, () => {
  updateYtMediaSessionMetadata()
})

watch(isPlaying, (playing) => {
  if (isMediaSessionSupported.value)
    setPlaybackState(playing ? 'playing' : 'paused')
})
</script>

<template>
  <div class="relative flex flex-col justify-between landscape-flex-row">
    <div class="z-10 mt-auto md:relative">
      <figure>
        <img
          v-if="coverUrl && ytCoverArt"
          :src="coverUrl"
          :alt="trackTitle"
          class="mx-auto mb-4 size-48 rounded-xl object-cover shadow-lg ring-1 ring-glass-purple-border md:size-56"
        >
        <div class="mx-auto flex w-[300px] flex-col justify-start font-blackcraft text-black dark:text-white">
          <div class="truncate">
            {{ trackTitle }}
          </div>
          <div class="truncate text-lg opacity-80">
            {{ trackArtist }}
          </div>
        </div>
      </figure>
      <div class="relative z-10 flex justify-center text-3xl font-normal">
        <BaseButton
          class="rounded-l-full"
          variant="control"
          label="prev"
          :disabled="!activeTrack"
          @click="prevTrack"
        >
          <span class="text-black dark:text-white">prev</span>
        </BaseButton>
        <BaseButton
          class="w-32 disabled:opacity-80"
          :disabled="pending || !activeTrack"
          variant="control"
          label="play"
          @click="isPlaying ? pause() : playYt()"
        >
          <iPlay v-show="!pending" :is-play="isPlaying" class="mr-2" />
          <iSpin v-show="pending" />
          <span class="text-black dark:text-white">{{ isPlaying ? 'pause' : 'play' }}</span>
        </BaseButton>
        <BaseButton
          class="rounded-r-full"
          variant="control"
          label="next"
          :disabled="!activeTrack"
          @click="nextTrack"
        >
          <span class="text-black dark:text-white">next</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
