<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { iPlay, iButton } from 'shared'

import { radioList } from 'processes'

import { useGlobalState } from 'processes'
const state = useGlobalState()

const audio = ref<HTMLAudioElement | null>()

const activeRadio = computed(() => radioList[state.activeRadio.value])

const play = (): void => {
  isPlaying.value ? audio.value?.pause() : audio.value?.play()
  isPlaying.value = !isPlaying.value
}

// const mute = (bool: boolean): void => {
//   audio.value ? (audio.value.muted = bool) : null
//   isMuted.value = !isMuted.value
// }

const changeRadio = (value: boolean): void => {
  if (!value) {
    if (state.activeRadio.value > 0) {
      state.changeActiveRadio(state.activeRadio.value - 1)
    } else {
      state.changeActiveRadio(radioList.length - 1)
    }
  } else {
    if (state.activeRadio.value === radioList.length - 1) {
      state.changeActiveRadio(0)
    } else {
      state.changeActiveRadio(state.activeRadio.value + 1)
    }
  }

  nextTick(() => (isPlaying.value ? audio.value?.play() : null))
}

const isPlaying = ref<boolean>(false)
// const isMuted = ref<boolean>(false)
</script>
<template>
  <div class="py-4">
    <figure>
      <figcaption class="text-left font-semibold">
        Listen radio: {{ activeRadio.name }}
      </figcaption>
      <audio :src="activeRadio.src" ref="audio" class="hidden" />
    </figure>
    <div class="flex py-2 text-3xl font-normal">
      <iButton
        title="prev"
        @click="changeRadio(false)"
        class="rounded-l-full"
      />
      <iButton :title="isPlaying ? 'pause' : 'play'" @click="play" class="w-40">
        <iPlay :is-play="isPlaying" class="mr-2" />
      </iButton>
      <iButton title="next" @click="changeRadio(true)" class="rounded-r-full" />
    </div>
    <!-- <iButton title="mute" @click="mute" class="rounded-full" /> -->
  </div>
</template>
