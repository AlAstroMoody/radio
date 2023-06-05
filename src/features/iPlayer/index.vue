<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { iPlay, iButton, iSpin, iSound } from 'shared'

import { radioList, useGlobalState } from 'processes'

const state = useGlobalState()

const audio = ref<HTMLAudioElement | null>()
const audioCtx = window.AudioContext
const audioContext = ref<AudioContext | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let canvasContext = ref<CanvasRenderingContext2D | null>(null)
var analyser = ref<AnalyserNode | null>(null)
const width = ref<number>(400)
const height = ref<number>(256)
const bufferLength = ref<number>(1)
const dataArray = ref<Uint8Array | null>(null)

const activeRadio = computed(() =>
  radioList.find((radio) => radio.id === state.activeRadio.value)
)

const volume = ref<number>(50)

watch(activeRadio, () => {
  pending.value = true
  audio.value ? (audio.value.oncanplay = () => play()) : null
})

watch(volume, () => {
  audio.value ? (audio.value.volume = volume.value / 100) : null
})

const pending = ref<boolean>(false)
const isPlaying = ref<boolean>(false)

async function play(): Promise<void> {
  if (!audioContext.value) {
    audioContext.value = new audioCtx()
    audioContext.value.resume()
    buildAudioGraph()
    requestAnimationFrame(visualize)
  }

  pending.value = true
  await audio.value?.play()
  isPlaying.value = true
  pending.value = false
}

function pause(): void {
  audio.value?.pause()
  isPlaying.value = false
  pending.value = false
}

onMounted(() => {
  if (canvas.value) {
    width.value = canvas.value.width
    height.value = canvas.value.height
    canvasContext.value = canvas.value.getContext('2d')
  }
})

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

function visualize() {
  // очистить canvas
  if (canvasContext.value && analyser.value && dataArray.value) {
    canvasContext.value.clearRect(0, 0, width.value, height.value)
    canvasContext.value.fillStyle = 'rgba (0, 0, 0, 0.5)'

    // Получить данные анализатора
    analyser.value.getByteFrequencyData(dataArray.value)

    let barWidth = width.value / bufferLength.value
    let barHeight
    let x = 0

    // коэффициент масштабирования полос
    const heightScale = height.value / 256

    for (let i = 0; i < bufferLength.value; i++) {
      barHeight = dataArray.value[i]
      canvasContext.value.fillStyle = `rgb(100,${barHeight * 4},30)`
      barHeight *= heightScale
      canvasContext.value.fillRect(
        x,
        height.value - barHeight / 2,
        barWidth,
        barHeight / 2
      )

      // 1 - количество пикселей между столбцами
      x += barWidth + 1
    }

    requestAnimationFrame(visualize)
  }
}
</script>
<template>
  <div class="flex">
    <div class="mt-auto py-4 md:relative">
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
            <input type="range" class="h-7" v-model="volume" />
          </div>
        </div>

        <audio
          :src="activeRadio?.src"
          ref="audio"
          class="hidden"
          crossorigin="anonymous"
        />
      </figure>
      <div class="flex text-3xl font-normal">
        <iButton
          title="prev"
          @click="state.prevRadio"
          class="rounded-l-full"
          text-class="-mt-4"
          variant="control"
        />
        <iButton
          :title="isPlaying ? 'pause' : 'play'"
          @click="isPlaying ? pause() : play()"
          class="w-40"
          text-class="-mt-4"
          variant="control"
        >
          <iPlay :is-play="isPlaying" class="mr-2" v-show="!pending" />
          <iSpin v-show="pending" />
        </iButton>
        <iButton
          title="next"
          @click="state.nextRadio"
          class="rounded-r-full"
          text-class="-mt-4"
          variant="control"
        />
      </div>
      <canvas
        ref="canvas"
        width="300"
        height="200"
        class="mx-auto rotate-180"
      />
    </div>
  </div>
</template>
