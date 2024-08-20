<script setup lang="ts">
import { computed, onMounted, ref, watch, onUnmounted, reactive } from 'vue'
import { iButton, iPlay, iSpin } from 'shared/ui'

import { useGlobalState } from 'processes'
import { useParallax } from '@vueuse/core'

const { activeRadio, nextRadio, prevRadio } = useGlobalState()

const audio = ref<HTMLAudioElement | null>()
const audioConstructor = ref<HTMLAudioElement | null>()
const audioContext = ref<AudioContext | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const canvasContext = ref<CanvasRenderingContext2D | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const width = ref<number>(400)
const height = ref<number>(256)
const bufferLength = ref<number>(1)
const dataArray = ref<Uint8Array | null>(null)

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

const repeatableAudio = computed(
  () => audioConstructor.value?.src === activeRadio.value?.src
)

const volume = ref<number>(50)

const pending = ref<boolean>(false)
const isPlaying = ref<boolean>(false)
const rafVisualize = ref(0)

async function play(): Promise<void> {
  clearCanvas()
  cancelAnimationFrame(rafVisualize.value)
  if (!activeRadio.value) return
  pending.value = true
  try {
    await fetch(activeRadio.value.src, { method: 'OPTIONS' })
    audio.value?.play().then(() => {
      changeFlags()
      rafVisualize.value = requestAnimationFrame(visualize)
    })
    if (!audioContext.value) {
      audioContext.value = new window.AudioContext()
      audioContext.value.resume()
      buildAudioGraph()
    }
  } catch (e) {
    if (!repeatableAudio.value)
      audioConstructor.value = new Audio(activeRadio.value.src)
    audioConstructor.value?.play()
    changeFlags()
  }
}

function pause(): void {
  audio.value?.pause()
  audioConstructor.value?.pause()
  isPlaying.value = false
  pending.value = false
  cancelAnimationFrame(rafVisualize.value)
  clearCanvas()
}

function changeFlags() {
  isPlaying.value = true
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
  pause()
  play()
})

watch(volume, () => {
  localStorage.setItem('volume', `${volume.value}`)
  if (audio.value) audio.value.volume = volume.value / 100
  if (audioConstructor.value) audioConstructor.value.volume = volume.value / 100
})

onMounted(() => {
  if (canvas.value) {
    width.value = canvas.value.width
    height.value = canvas.value.height
    canvasContext.value = canvas.value.getContext('2d')
  }
  const storageVolume = localStorage.getItem('volume')
  if (storageVolume) volume.value = +storageVolume
  else {
    volume.value = 50
    localStorage.setItem('volume', '50')
  }
})

onUnmounted(() => {
  if (!audioContext.value) return
  audioContext.value.close()
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
              />
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
        />
      </figure>
      <div class="relative z-10 flex text-3xl font-normal">
        <iButton
          class="rounded-l-full"
          variant="control"
          @click="prevRadio"
          label="prev"
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
      :style="cardStyle"
      ref="canvas"
      width="360"
      height="200"
      class="pointer-events-none mx-auto my-2 rotate-180"
    />
    <Transition name="taylor">
      <img
        alt="taylor"
        src="/images/taylor.webp"
        class="pointer-events-none fixed right-6 object-cover bottom-0"
        width="128"
        height="96"
        v-if="activeRadio?.id === 1 && isPlaying"
      />
    </Transition>
  </div>
</template>
<style>
.taylor-enter-active {
  animation: bounce-in 0.5s;
}
.taylor-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: translateY(80px);
  }
  50% {
  }
  100% {
    transform: translateY(0);
  }
}
</style>
