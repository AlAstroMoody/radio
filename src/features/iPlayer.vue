<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { iButton, iPlay, iSpin } from 'shared'

import { radioList, useGlobalState } from 'processes'

const state = useGlobalState()

const audio = ref<HTMLAudioElement | null>()
const audioCtx = window.AudioContext
const audioContext = ref<AudioContext | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const canvasContext = ref<CanvasRenderingContext2D | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const width = ref<number>(400)
const height = ref<number>(256)
const bufferLength = ref<number>(1)
const dataArray = ref<Uint8Array | null>(null)

const activeRadio = computed(() =>
  radioList.find((radio) => radio.id === state.activeRadio.value)
)

const volume = ref<number>(50)

const pending = ref<boolean>(false)
const isPlaying = ref<boolean>(false)
const rafVisualize = ref(0)

async function play(): Promise<void> {
  if (!audioContext.value) {
    audioContext.value = new audioCtx()
    audioContext.value.resume()
    buildAudioGraph()
  }

  pending.value = true
  await audio.value?.play()
  isPlaying.value = true
  pending.value = false
  requestAnimationFrame(visualize)
}

function pause(): void {
  audio.value?.pause()
  isPlaying.value = false
  pending.value = false
}

function buildAudioGraph() {
  if (audioContext.value && audio.value) {
    const sourceNode = audioContext.value.createMediaElementSource(audio.value)
    analyser.value = audioContext.value.createAnalyser()
    // 512, 256, 128 и т.д: меняет количество полос
    analyser.value.fftSize = 1024
    bufferLength.value = analyser.value.frequencyBinCount
    dataArray.value = new Uint8Array(bufferLength.value)
    sourceNode.connect(analyser.value)
    analyser.value.connect(audioContext.value.destination)
  }
}

function clearCanvas() {
  canvasContext.value?.clearRect(0, 0, width.value, height.value)
}

function visualize() {
  clearCanvas()
  if (canvasContext.value && analyser.value && dataArray.value) {
    // Получить данные анализатора
    analyser.value.getByteFrequencyData(dataArray.value)
    const barWidth = width.value / bufferLength.value
    let x = 0

    // коэффициент масштабирования полос
    dataArray.value.forEach((value, index) => {
      if (canvasContext.value) {
        canvasContext.value.fillStyle = `rgb(${value + index - 50},${index},${
          value + index
        })`
        canvasContext.value.fillRect(x, height.value - value / 2, 1, value / 2)
        x += barWidth + 1
      }
    })
  }
  rafVisualize.value = requestAnimationFrame(visualize)
}

watch(activeRadio, () => {
  pending.value = true
  audio.value ? (audio.value.oncanplay = () => play()) : null
})

watch(volume, () => {
  audio.value ? (audio.value.volume = volume.value / 100) : null
})

onMounted(() => {
  if (canvas.value) {
    width.value = canvas.value.width
    height.value = canvas.value.height
    canvasContext.value = canvas.value.getContext('2d')
  }
})
</script>

<template>
  <div class="relative">
    <div class="z-10 mt-auto md:relative">
      <figure>
        <figcaption class="text-left font-semibold">
          Listen: {{ activeRadio?.name }}
        </figcaption>

        <div class="mx-auto flex w-[300px] justify-center">
          <img
            alt="taylor"
            src="/images/taylor.webp"
            class="pointer-events-none w-32 object-cover"
          />
          <div class="mt-auto flex-1 items-center">
            <div class="flex items-center text-xl">
              <span>{{ volume }}%</span>
            </div>
            <input v-model="volume" type="range" class="h-7" />
          </div>
        </div>

        <audio
          ref="audio"
          :src="activeRadio?.src"
          class="hidden"
          crossorigin="anonymous"
        />
      </figure>
      <div class="flex text-3xl font-normal">
        <iButton
          title="prev"
          class="rounded-l-full"
          text-class="-mt-4"
          variant="control"
          @click="state.prevRadio"
        />
        <iButton
          :title="isPlaying ? 'pause' : 'play'"
          class="w-40"
          text-class="-mt-4"
          variant="control"
          @click="isPlaying ? pause() : play()"
        >
          <iPlay v-show="!pending" :is-play="isPlaying" class="mr-2" />
          <iSpin v-show="pending" />
        </iButton>
        <iButton
          title="next"
          class="rounded-r-full"
          text-class="-mt-4"
          variant="control"
          @click="state.nextRadio"
        />
      </div>
    </div>
    <canvas
      ref="canvas"
      width="300"
      height="200"
      class="pointer-events-none m-auto rotate-180"
    />
  </div>
</template>
