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
</script>
<template>
  <div class="fixed bottom-0 left-0 right-0 py-4 md:relative">
    <figure>
      <figcaption class="text-left font-semibold">
        Listen: {{ activeRadio.name }}
      </figcaption>
      <audio :src="activeRadio.src" ref="audio" class="hidden" />
    </figure>
    <div class="flex py-2 text-3xl font-normal">
      <iButton
        title="prev"
        @click="changeRadio(false)"
        class="rounded-l-full"
        text-class="-mt-4"
      />
      <iButton
        :title="isPlaying ? 'pause' : 'play'"
        @click="play"
        class="w-40"
        text-class="-mt-4"
      >
        <iPlay :is-play="isPlaying" class="mr-2" />
      </iButton>
      <iButton
        title="next"
        @click="changeRadio(true)"
        class="rounded-r-full"
        text-class="-mt-4"
      />
    </div>
  </div>
</template>
