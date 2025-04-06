<script setup lang="ts">
import { useParallax } from '@vueuse/core'
import { usePlayer } from 'composables/usePlayer'
import { useRadio } from 'composables/useRadio'
import { iButton, iPlay, iSpin } from 'shared/ui'
import { computed, reactive, ref, watch } from 'vue'

const { activeRadio, nextRadio, prevRadio } = useRadio()
const canvas = ref<HTMLCanvasElement | null>(null)

const {
  audio,
  volume,
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
  pending.value = true
  pause()
  await play()
})
</script>

<template>
  <div class="relative">
    <div class="z-10 mt-auto md:relative">
      <figure>
        <div class="mx-auto flex w-[300px] justify-center">
          <div class="relative mt-auto flex-1 items-center">
            <div class="flex items-center text-xl">
              <input
                v-model="volume"
                type="range"
                class="h-7 mr-1"
                label="volume"
              >
              <span>{{ volume }}%</span>
            </div>

            <div class="text-left font-semibold">
              {{ activeRadio?.name }}
            </div>
          </div>
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
        <iButton
          class="rounded-l-full"
          variant="control"
          label="prev"
          @click="prevRadio"
        >
          <span class="-mt-4">prev</span>
        </iButton>
        <iButton
          class="w-40 disabled:opacity-80"
          :disabled="pending"
          variant="control"
          label="play"
          @click="isPlaying ? pause() : play()"
        >
          <iPlay v-show="!pending" :is-play="isPlaying" class="mr-2" />
          <iSpin v-show="pending" />
          <span class="-mt-4">{{ isPlaying ? 'pause' : 'play' }}</span>
        </iButton>
        <iButton
          class="rounded-r-full"
          variant="control"
          label="next"
          @click="nextRadio"
        >
          <span class="-mt-4">next</span>
        </iButton>
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
        class="pointer-events-none fixed right-6 object-cover bottom-0"
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
