<script setup lang="ts">
import { iButton } from 'shared/ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const dropZone = ref<HTMLDivElement | null>()
const input = ref<HTMLInputElement | null>()

const files = ref<File[]>([])
const activeIndex = ref(0)
const currentFile = computed(() => files.value[activeIndex.value])

const progress = ref(0)
const audio = ref<HTMLAudioElement>()
const frequencyArray = ref()
const audioContext = ref<AudioContext | null>(null)

function openFiles() {
  if (!input.value)
    return
  input.value.click()
}

function changeFiles() {
  if (!input.value)
    return
  input.value.onchange = () => {
    if (!input.value?.files)
      return

    const filesArray = [...input.value.files]
    if (
      files.value.map(file => file.name).join()
      === filesArray.map(file => file.name).join()
    ) {
      return
    }

    if (files.value)
      pause()
    activeIndex.value = 0
    files.value = filesArray
    playTrack()
  }
}
const canvas = ref<HTMLCanvasElement | null>(null)
const canvasContext = ref<CanvasRenderingContext2D | null>(null)
const width = ref<number>(400)
const height = ref<number>(256)
const audioConstructor = ref<HTMLAudioElement | null>()

const analyser = ref<AnalyserNode | null>(null)

const pending = ref<boolean>(false)
const isPlaying = ref<boolean>(false)
const rafVisualize = ref(0)

const centerX = computed(() => width.value / 2)
const centerY = computed(() => height.value / 2)
const bars = 360
const barWidth = ref(1)

onMounted(() => {
  if (!dropZone.value)
    return

  dropZone.value.ondrop = (e) => {
    e.preventDefault()

    if (e.dataTransfer?.items) {
      ;[...e.dataTransfer?.items].forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file)
            files.value.push(file)
        }
      })
      activeIndex.value = 0
      playTrack()
    }
  }

  dropZone.value.ondragover = e => e.preventDefault()

  dropZone.value.onclick = () => changeFiles()

  if (canvas.value) {
    width.value = canvas.value.width
    height.value = canvas.value.height
    canvasContext.value = canvas.value.getContext('2d')
  }
})

function playTrack() {
  if (!dropZone.value)
    return
  // dropZone.value.style.display = 'none'
  start()

  function start() {
    audio.value = new Audio()
    audioContext.value = new AudioContext()
    analyser.value = audioContext.value.createAnalyser()

    audio.value.src = URL.createObjectURL(currentFile.value)

    const sourceNode = audioContext.value.createMediaElementSource(audio.value)

    sourceNode.connect(analyser.value)
    analyser.value.connect(audioContext.value.destination)

    frequencyArray.value = new Uint8Array(analyser.value.frequencyBinCount)

    audio.value.play().then(() => (isPlaying.value = true))

    audio.value.loop = true

    startAnimation()
  }
}

async function play(): Promise<void> {
  clearCanvas()
  pending.value = true
  audio.value?.play().then(() => {
    isPlaying.value = true
    pending.value = false
  })
  startAnimation()
}

function pause() {
  audio.value?.pause()
  audioConstructor.value?.pause()
  isPlaying.value = false
  pending.value = false
  setTimeout(() => {
    if (!isPlaying.value)
      cancelAnimationFrame(rafVisualize.value)
  }, 400)
}

function clearCanvas() {
  canvasContext.value?.clearRect(0, 0, width.value, height.value)
}

function openNextFile(bool: boolean) {
  pause()
  if (bool) {
    if (activeIndex.value < files.value.length - 1)
      activeIndex.value += 1
    else activeIndex.value = 0
  }
  else {
    if (activeIndex.value > 0)
      activeIndex.value -= 1
    else activeIndex.value = files.value.length - 1
  }
  playTrack()
}

function startAnimation() {
  if (!canvas.value || !canvasContext.value || !analyser.value || !audio.value)
    return

  const piece = audio.value.currentTime / audio.value.duration

  let radius = 35

  canvasContext.value.clearRect(0, 0, width.value, height.value)

  canvasContext.value.beginPath()
  canvasContext.value.arc(
    centerX.value,
    centerY.value,
    radius,
    0,
    Math.PI * (2 * piece),
  )
  canvasContext.value.strokeStyle = '#1a385b'
  canvasContext.value.lineWidth = 35
  canvasContext.value.stroke()

  progress.value = Math.trunc(piece * 100)
  analyser.value.getByteFrequencyData(frequencyArray.value)
  for (let i = 0; i < bars; i++) {
    radius = 50
    const rads = (Math.PI * 2) / bars
    const barHeight = frequencyArray.value[i] * 0.4

    const x = centerX.value + Math.cos(rads * i) * radius
    const y = centerY.value + Math.sin(rads * i) * radius
    const xEnd = centerX.value + Math.cos(rads * i) * (radius + barHeight)
    const yEnd = centerY.value + Math.sin(rads * i) * (radius + barHeight)

    drawBar(x, y, xEnd, yEnd, barWidth.value, frequencyArray.value[i])
  }
  rafVisualize.value = requestAnimationFrame(startAnimation)
}

function drawBar(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  frequency: number,
) {
  if (!canvasContext.value)
    return
  const lineColor = `rgb(${frequency}, ${frequency}, ${205})`

  canvasContext.value.strokeStyle = lineColor
  canvasContext.value.lineWidth = width
  canvasContext.value.beginPath()
  canvasContext.value.moveTo(x1, y1)
  canvasContext.value.lineTo(x2, y2)
  canvasContext.value.stroke()
}

onUnmounted(() => {
  if (!audioContext.value)
    return
  audioContext.value.close()
})
</script>

<template>
  <div class="relative">
    <div class="z-10 mt-auto md:relative">
      <div
        ref="dropZone"
        :class="files.length ? 'hidden' : 'flex'"
        class="fixed left-0 z-10 right-0 mx-auto h-24 w-24 cursor-pointer items-center justify-between rounded-xl border border-dashed border-dark-100 dark:border-light-100"
      >
        <span class="absolute left-0 right-0 text-center">
          click or drag
          <br>
          for add files
        </span>
        <input
          ref="input"
          type="file"
          accept="audio/*"
          multiple
          class="h-full w-full cursor-pointer opacity-0"
        >
      </div>
    </div>
    <div v-if="currentFile" class="flex flex-col my-2">
      <div class="mx-auto flex gap-2 font-semibold">
        <iButton
          label="next"
          class="w-fit rounded-bl-xl rounded-br-xl rounded-tl-xl bg-light-200 px-1 md:px-3 pb-3 pt-2 font-cyberpunk dark:bg-dark-200"
          @click="openNextFile(true)"
        >
          Next
        </iButton>
        <iButton
          label="load"
          class="w-fit rounded-bl-xl rounded-br-xl bg-light-200 px-1 md:px-3 pb-3 pt-2 font-cyberpunk dark:bg-dark-200"
          @click="openFiles"
        >
          Load
        </iButton>
        <iButton
          label="play"
          class="w-25 rounded-bl-xl rounded-br-xl bg-light-200 px-1 md:px-3 pb-3 pt-2 font-cyberpunk dark:bg-dark-200"
          @click="isPlaying ? pause() : play()"
        >
          <span v-show="!pending" class="m-auto">
            {{ isPlaying ? 'Pause' : 'Play' }}
          </span>
        </iButton>

        <iButton
          label="prev"
          class="w-fit rounded-bl-xl rounded-br-xl rounded-tr-xl bg-light-200 px-1 md:px-3 pb-3 pt-2 font-cyberpunk dark:bg-dark-200"
          @click="openNextFile(false)"
        >
          Prev
        </iButton>
      </div>
    </div>
    <div class="max-w-80 sm:max-w-96 m-auto">
      <div class="w-full relative h-96">
        <canvas
          ref="canvas"
          height="320"
          class="pointer-events-none m-auto block w-full rotate-180"
        />
      </div>
      <div v-if="currentFile" class="flex w-full justify-between gap-2 px-4">
        <div class="max-w-[calc(100%-(48px)] overflow-hidden whitespace-nowrap">
          <div class="animate-marquee hover:animate-pause -translate-x-[90%]">
            {{ currentFile.name }}
          </div>
        </div>
        <div class="flex  items-center justify-center text-center min-w-[48px]">
          {{ progress }}%
        </div>
      </div>
    </div>
  </div>
</template>
