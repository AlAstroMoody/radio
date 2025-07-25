<script setup lang="ts">
import { useAudioSettings } from 'composables/useAudioSettings'
import { useRadio } from 'composables/useRadio'
import { useRadioPlayer } from 'composables/useRadioPlayer'
import { AudioVisualizer, BaseButton, iPlay, iSpin } from 'shared/ui'
import { onMounted, watch } from 'vue'

const { activeRadio, nextRadio, prevRadio } = useRadio()

const {
  analyser,
  audio,
  isPlaying,
  pause,
  pending,
  play,
} = useRadioPlayer(activeRadio)

const { autoplay } = useAudioSettings()

watch(activeRadio, async () => {
  pause()
  playRadio()
})

async function playRadio() {
  useAudioSettings().applySettings()
  await play()
}

onMounted(() => {
  if (autoplay.value)
    play()
})
</script>

<template>
  <div class="relative flex flex-col justify-between">
    <AudioVisualizer
      :analyser="analyser"
      :is-playing="isPlaying"
    />
    <div class="z-10 mt-auto md:relative">
      <figure>
        <div class="mx-auto flex w-[300px] justify-start font-blackcraft">
          {{ activeRadio?.name }}
        </div>
        <audio
          ref="audio"
          :src="activeRadio?.src"
          class="hidden"
          crossorigin="anonymous"
          preload="metadata"
        />
      </figure>
      <div class="relative z-10 flex text-3xl font-normal justify-center">
        <BaseButton
          class="rounded-l-full"
          variant="control"
          label="prev"
          @click="prevRadio"
        >
          <span>prev</span>
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
          <span>{{ isPlaying ? 'pause' : 'play' }}</span>
        </BaseButton>
        <BaseButton
          class="rounded-r-full"
          variant="control"
          label="next"
          @click="nextRadio"
        >
          <span>next</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
