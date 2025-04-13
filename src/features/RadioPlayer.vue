<script setup lang="ts">
import { useParallax } from '@vueuse/core'
import { useAudioSettings } from 'composables/useAudioSettings'
import { usePlayer } from 'composables/usePlayer'
import { useRadio } from 'composables/useRadio'
import { BaseButton, iPlay, iSpin } from 'shared/ui'
import { computed, reactive, ref, watch } from 'vue'

const { activeRadio, nextRadio, prevRadio } = useRadio()
const canvas = ref<HTMLCanvasElement | null>(null)

const {
  audio,
  pending,
  isPlaying,
  play,
  pause,
} = usePlayer(canvas, activeRadio)

const parallax = reactive(useParallax(canvas))
const cardStyle = computed(() => ({
  borderRadius: '20px',
  overflow: 'hidden',
  transition: '.3s ease-out all',
  boxShadow: '0 0 20px 0 rgba(255, 255, 255, 0.25)',
  transform: `rotateX(${parallax.roll * 20 + 170}deg) rotateY(${
    parallax.tilt * 20 + 170
  }deg)`,
}))

watch(activeRadio, async () => {
  pause()
  await play()
  useAudioSettings().applySettings()
})
</script>

<template>
  <div class="relative">
    <div class="z-10 mt-auto md:relative">
      <figure>
        <div class="mx-auto flex w-[300px] justify-start font-cyberpunk">
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
      <div class="relative z-10 flex text-3xl font-normal">
        <BaseButton
          class="rounded-l-full"
          variant="control"
          label="prev"
          @click="prevRadio"
        >
          <span class="-mt-4">prev</span>
        </BaseButton>
        <BaseButton
          class="w-40 disabled:opacity-80"
          :disabled="pending"
          variant="control"
          label="play"
          @click="isPlaying ? pause() : play()"
        >
          <iPlay v-show="!pending" :is-play="isPlaying" class="mr-2" />
          <iSpin v-show="pending" />
          <span class="-mt-4">{{ isPlaying ? 'pause' : 'play' }}</span>
        </BaseButton>
        <BaseButton
          class="rounded-r-full"
          variant="control"
          label="next"
          @click="nextRadio"
        >
          <span class="-mt-4">next</span>
        </BaseButton>
      </div>
    </div>
    <canvas
      ref="canvas"
      :style="cardStyle"
      width="360"
      height="200"
      class="pointer-events-none mx-auto my-2 rotate-180"
    />
    <Transition name="taylor">
      <img
        v-if="activeRadio?.id === 1 && isPlaying"
        alt="taylor"
        src="/images/taylor.webp"
        class="pointer-events-none fixed right-2 object-cover bottom-0"
        width="128"
        height="96"
      >
    </Transition>
  </div>
</template>

<style>
.taylor-enter-active {
  animation: var(--animate-bounce-in);
}
.taylor-leave-active {
  animation: var(--animate-bounce-in) reverse;
}
</style>
