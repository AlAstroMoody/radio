<script setup lang="ts">
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, PauseIcon, PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/vue/24/solid'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useHotkeys } from 'composables/useHotkeys'
import { useMediaSession } from 'composables/useMediaSession'
import { useRadio } from 'composables/useRadio'
import { useRadioPlayer } from 'composables/useRadioPlayer'
import { useToast } from 'composables/useToast'
import { BaseButton, iSpin, MarqueeText, RangeInput } from 'shared/ui'
import { usePlaybackStore } from 'stores'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const { activeRadio, nextRadio, prevRadio } = useRadio()
const { volume } = useAudioSettings()
const { showToast } = useToast()
const playbackStore = usePlaybackStore()

const { isSupported: isMediaSessionSupported, setActionHandlers, setMetadata, setPlaybackState } = useMediaSession()

const {
  audio,
  isPlaying,
  pause,
  pending,
  play,
} = useRadioPlayer(activeRadio)

const muted = ref(false)
const volumeBeforeMute = ref(100)

const isLive = computed(() => isPlaying.value && !pending.value)
const isBuffering = computed(() => pending.value)
const stationName = computed(() => activeRadio.value?.name || 'No station selected')

watch(activeRadio, async (station) => {
  const shouldResume = isPlaying.value
  pause()
  if (!station || !shouldResume)
    return

  await playRadio()
})

async function playRadio() {
  try {
    await play()
    audio.value!.playbackRate = 1
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      return

    showToast(error instanceof Error ? error.message : 'Playback failed')
  }
}

function setupRadioMediaSessionHandlers(): void {
  if (!isMediaSessionSupported.value)
    return

  setActionHandlers({
    nexttrack: nextRadio,
    pause: () => {
      if (isPlaying.value)
        pause()
    },
    play: () => {
      if (!isPlaying.value)
        void playRadio()
    },
    previoustrack: prevRadio,
  })
}

function toggleMute(): void {
  if (muted.value || volume.value === 0) {
    volume.value = volumeBeforeMute.value > 0 ? volumeBeforeMute.value : 50
    muted.value = false
    return
  }

  volumeBeforeMute.value = volume.value
  volume.value = 0
  muted.value = true
}

function togglePlayPause(): void {
  if (isPlaying.value)
    pause()
  else
    void playRadio()
}

function updateRadioMediaSessionMetadata(): void {
  if (!isMediaSessionSupported.value || !activeRadio.value)
    return

  setMetadata({
    title: activeRadio.value.name,
  })
}

useHotkeys([
  { callback: togglePlayPause, key: ' ', preventDefault: true },
  { callback: () => {
    volume.value = Math.min(100, volume.value + 10)
  }, key: 'ArrowUp', preventDefault: true },
  { callback: () => {
    volume.value = Math.max(0, volume.value - 10)
  }, key: 'ArrowDown', preventDefault: true },
  { callback: nextRadio, key: 'n', preventDefault: true },
  { callback: prevRadio, key: 'p', preventDefault: true },
  { callback: toggleMute, key: 'm', preventDefault: true },
])

onMounted(() => {
  setupRadioMediaSessionHandlers()
  updateRadioMediaSessionMetadata()

  const shouldResume = playbackStore.consumeModeEnterResume()
  if (!shouldResume)
    return

  nextTick(() => {
    if (!activeRadio.value)
      return

    void playRadio()
  })
})

watch(activeRadio, () => {
  updateRadioMediaSessionMetadata()
})

watch(isPlaying, (playing) => {
  if (isMediaSessionSupported.value) {
    setPlaybackState(playing ? 'playing' : 'paused')
  }
})

watch(volume, (value) => {
  if (value > 0)
    muted.value = false
  else if (!muted.value)
    muted.value = true
})
</script>

<template>
  <div class="relative mx-auto flex w-full max-w-[360px] flex-col items-center gap-2">
    <div class="flex w-full items-center gap-3 px-2">
      <MarqueeText
        :text="stationName"
        :speed="30"
        :min-duration="8"
        class="min-w-0 flex-1 font-blackcraft text-black dark:text-white"
      />
      <span
        v-if="isLive"
        class="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-wide text-red-500 dark:text-red-300"
      >
        <span class="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
        LIVE
      </span>
      <span
        v-else-if="isBuffering"
        class="inline-flex shrink-0 items-center gap-1.5 text-xs opacity-70 dark:text-white"
      >
        <iSpin class="size-3!" />
        Buffering
      </span>
    </div>

    <div class="flex items-center gap-4">
      <BaseButton
        variant="player"
        label="Previous station"
        :disabled="!activeRadio"
        @click="prevRadio"
      >
        <ChevronDoubleLeftIcon class="h-6 w-6" />
      </BaseButton>
      <BaseButton
        variant="player"
        class="size-14!"
        :disabled="pending || !activeRadio"
        :label="pending ? 'Loading' : isPlaying ? 'Pause' : 'Play'"
        @click="togglePlayPause"
      >
        <iSpin v-if="pending" class="mr-0! h-10 w-10" />
        <PlayIcon v-else-if="!isPlaying" class="h-10 w-10" />
        <PauseIcon v-else class="h-10 w-10" />
      </BaseButton>
      <BaseButton
        variant="player"
        label="Next station"
        :disabled="!activeRadio"
        @click="nextRadio"
      >
        <ChevronDoubleRightIcon class="h-6 w-6" />
      </BaseButton>
    </div>

    <div class="flex w-full items-center gap-2 px-1">
      <BaseButton
        variant="player"
        class="size-9!"
        :label="muted || volume === 0 ? 'Unmute' : 'Mute'"
        @click="toggleMute"
      >
        <SpeakerXMarkIcon v-if="muted || volume === 0" class="size-5" />
        <SpeakerWaveIcon v-else class="size-5" />
      </BaseButton>
      <RangeInput
        v-model="volume"
        compact
        label="Volume"
        :min="0"
        :max="100"
        unit="%"
      />
    </div>
  </div>
</template>
