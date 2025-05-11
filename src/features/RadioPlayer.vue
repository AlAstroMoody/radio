<script setup lang="ts">
import { useParallax } from '@vueuse/core'
import { useAudioSettings } from 'composables/useAudioSettings'
import { usePlayer } from 'composables/usePlayer'
import { useRadio } from 'composables/useRadio'
import { BaseButton, iPlay, iSpin } from 'shared/ui'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const { activeRadio, nextRadio, prevRadio } = useRadio()
const canvas = ref<HTMLCanvasElement | null>(null)

const {
  audio,
  isPlaying,
  pause,
  pending,
  play,
} = usePlayer(canvas, activeRadio)

const { autoplay } = useAudioSettings()

const parallax = reactive(useParallax(canvas))
const cardStyle = computed(() => ({
  transform: `rotateX(${parallax.roll * 20 + 170}deg) rotateY(${
    parallax.tilt * 20 + 170
  }deg)`,
  transition: '.3s ease-out all',
}))

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
    <canvas
      ref="canvas"
      :style="cardStyle"
      width="360"
      height="200"
      class="pointer-events-none mx-auto my-2 rotate-180 overflow-hidden rounded-2xl shadow-next dark:shadow-card"
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
