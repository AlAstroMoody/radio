<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { useAudioPosition } from 'composables/useAudioPosition'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useFileList } from 'composables/useFileList'
import { useVisualizer } from 'composables/useVisualizer'
import { BaseButton } from 'shared/ui'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const { files, activeFile, nextFile, prevFile, changeActiveFile } = useFileList()

const dropZone = ref<HTMLDivElement | null>()
const input = ref<HTMLInputElement | null>()

const currentFileName = computed(() => (activeFile.value as File)?.name || '')

const progress = ref(0)
const audio = ref<HTMLAudioElement>(new Audio())
const canvas = ref<HTMLCanvasElement | null>(null)
const audioContext = ref<AudioContext | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const pending = ref<boolean>(false)
const isPlaying = ref<boolean>(false)
const sourceNode = ref<MediaElementAudioSourceNode>()

const { startVisualization } = useVisualizer(canvas, analyser)
const { applySettings } = useAudioSettings()

const { savePosition, restorePosition, clearPosition } = useAudioPosition(
  audio,
  currentFileName,
)

function openFiles() {
  input.value?.click()
}

function changeFiles() {
  if (!input.value)
    return
  input.value.onchange = () => {
    if (!input.value?.files)
      return

    const filesArray = [...input.value.files]
    if (files.value?.map(file => file.name).join() === filesArray.map(file => file.name).join()) {
      return
    }

    if (filesArray.length) {
      pause()
      files.value = filesArray
      changeActiveFile(0)
      playTrack()
    }
  }
}

onMounted(() => {
  if (files.value.length) {
    playTrack()
    setListeners()
    return
  }
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
      playTrack()
    }
  }

  dropZone.value.ondragover = e => e.preventDefault()
  dropZone.value.onclick = () => changeFiles()

  setListeners()
})

function setListeners() {
  useEventListener(audio.value, 'timeupdate', changeProgress)
  useEventListener(audio.value, 'ended', () => {
    clearPosition()
    nextFile()
  })
}

function changeProgress() {
  const piece = Number.isNaN(audio.value.duration)
    ? 0
    : audio.value.currentTime / audio.value.duration
  progress.value = Math.trunc(piece * 100)
  savePosition()
}

async function playTrack() {
  if (!dropZone.value)
    return

  audioContext.value = new AudioContext()
  audio.value.src = URL.createObjectURL(activeFile.value)
  if (!sourceNode.value) {
    analyser.value = audioContext.value.createAnalyser()
    sourceNode.value = audioContext.value.createMediaElementSource(audio.value)
    sourceNode.value.connect(analyser.value)
    analyser.value.connect(audioContext.value.destination)
  }
  restorePosition()
  play()
}

async function play(): Promise<void> {
  pending.value = true
  await audio.value?.play()
  isPlaying.value = true
  pending.value = false
  startVisualization()
  applySettings()
}

function pause() {
  audio.value?.pause()
  isPlaying.value = false
  pending.value = false
}

watch(activeFile, () => {
  pause()
  playTrack()
})

onUnmounted(() => {
  if (!audioContext.value)
    return
  audioContext.value.close()
})
</script>

<template>
  <div class="relative flex flex-col justify-between">
    <div class="sm:max-w-96 m-auto max-w-lvw">
      <canvas
        ref="canvas"

        width="360"
        height="200"
        class="pointer-events-none mx-auto my-2"
      />
      <div v-if="activeFile" class="flex w-full justify-between gap-2 px-4">
        <div class="max-w-[calc(100%-(48px)] overflow-hidden whitespace-nowrap">
          <div class="animate-marquee hover:animate-pause -translate-x-[90%]">
            {{ currentFileName }}
          </div>
        </div>
        <div class="flex  items-center justify-center text-center min-w-[48px]">
          {{ progress }}%
        </div>
      </div>
    </div>
    <div class="z-10 mt-auto md:relative">
      <div
        ref="dropZone"
        :class="files?.length ? 'hidden' : 'flex'"
        class="fixed left-0 z-10 right-0 bottom-80 mx-auto h-24 w-24 cursor-pointer items-center justify-between rounded-xl border border-dashed border-dark-100 dark:border-light-100"
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
        <audio
          ref="audio"
          class="hidden"
          crossorigin="anonymous"
          preload="metadata"
        />
      </div>
    </div>
    <div v-if="activeFile" class="flex flex-col my-2">
      <div class="mx-auto flex gap-2 font-semibold">
        <BaseButton
          label="prev"
          class="w-fit rounded-bl-xl rounded-br-xl rounded-tr-xl bg-light-200 px-1 md:px-3 pb-3 pt-2 font-cyberpunk dark:bg-dark-200"
          @click="prevFile"
        >
          Prev
        </BaseButton>

        <BaseButton
          label="load"
          class="w-fit rounded-bl-xl rounded-br-xl bg-light-200 px-1 md:px-3 pb-3 pt-2 font-cyberpunk dark:bg-dark-200"
          @click="openFiles"
        >
          Load
        </BaseButton>
        <BaseButton
          label="play"
          class="w-25 rounded-bl-xl rounded-br-xl bg-light-200 px-1 md:px-3 pb-3 pt-2 font-cyberpunk dark:bg-dark-200"
          @click="isPlaying ? pause() : play()"
        >
          <span v-show="!pending" class="m-auto">
            {{ isPlaying ? 'Pause' : 'Play' }}
          </span>
        </BaseButton>

        <BaseButton
          label="next"
          class="w-fit rounded-bl-xl rounded-br-xl rounded-tl-xl bg-light-200 px-1 md:px-3 pb-3 pt-2 font-cyberpunk dark:bg-dark-200"
          @click="nextFile"
        >
          Next
        </BaseButton>
      </div>
    </div>
  </div>
</template>
