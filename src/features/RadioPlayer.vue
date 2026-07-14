<script setup lang="ts">
import { useAudioSettings } from 'composables/useAudioSettings'
import { useHotkeys } from 'composables/useHotkeys'
import { useMediaSession } from 'composables/useMediaSession'
import { useRadio } from 'composables/useRadio'
import { useRadioPlayer } from 'composables/useRadioPlayer'
import { BaseButton, iPlay, iSpin } from 'shared/ui'
import { usePlaybackStore } from 'stores'
import { nextTick, onMounted, watch } from 'vue'

const { activeRadio, nextRadio, prevRadio } = useRadio()
const { volume } = useAudioSettings()
const playbackStore = usePlaybackStore()

const { isSupported: isMediaSessionSupported, setActionHandlers, setMetadata, setPlaybackState } = useMediaSession()

const {
  audio,
  isPlaying,
  pause,
  pending,
  play,
} = useRadioPlayer(activeRadio)

watch(activeRadio, async (station) => {
  const shouldResume = isPlaying.value
  pause()
  if (!station || !shouldResume)
    return

  try {
    await playRadio()
  }
  catch { }
})

async function playRadio() {
  try {
    await play()
    audio.value!.playbackRate = 1
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return
    }
    throw error
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

function updateRadioMediaSessionMetadata(): void {
  if (!isMediaSessionSupported.value || !activeRadio.value)
    return

  setMetadata({
    title: activeRadio.value.name,
  })
}

useHotkeys([
  { callback: () => {
    if (isPlaying.value) {
      pause()
    }
    else {
      playRadio()
    }
  }, key: ' ', preventDefault: true },
  { callback: () => {
    volume.value = Math.min(100, volume.value + 10)
  }, key: 'ArrowUp', preventDefault: true },
  { callback: () => {
    volume.value = Math.max(0, volume.value - 10)
  }, key: 'ArrowDown', preventDefault: true },
  { callback: nextRadio, key: 'n', preventDefault: true },
  { callback: prevRadio, key: 'p', preventDefault: true },
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
</script>

<template>
  <div class="relative flex flex-col justify-between landscape-flex-row">
    <div class="z-10 mt-auto md:relative">
      <figure>
        <div class="mx-auto flex w-[300px] justify-start font-blackcraft text-black dark:text-white">
          {{ activeRadio?.name }}
        </div>
      </figure>
      <div class="relative z-10 flex text-3xl font-normal justify-center">
        <BaseButton
          class="rounded-l-full"
          variant="control"
          label="prev"
          @click="prevRadio"
        >
          <span class="text-black dark:text-white">prev</span>
        </BaseButton>
        <BaseButton
          class="disabled:opacity-80 w-32"
          :disabled="pending"
          variant="control"
          label="play"
          @click="isPlaying ? pause() : playRadio()"
        >
          <iPlay v-show="!pending" :is-play="isPlaying" class="mr-2" />
          <iSpin v-show="pending" />
          <span class="text-black dark:text-white">{{ isPlaying ? 'pause' : 'play' }}</span>
        </BaseButton>
        <BaseButton
          class="rounded-r-full"
          variant="control"
          label="next"
          @click="nextRadio"
        >
          <span class="text-black dark:text-white">next</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
