<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { useAudioPosition } from 'composables/useAudioPosition'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useFileList } from 'composables/useFileList'
import { useVisualizer } from 'composables/useVisualizer'
import { BaseButton } from 'shared/ui'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface Filters {
  bass: BiquadFilterNode
  mid: BiquadFilterNode
  treble: BiquadFilterNode
}

const dropZone = ref<HTMLDivElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const audio = ref<HTMLAudioElement>(new Audio())
const canvas = ref<HTMLCanvasElement | null>(null)
const audioContext = ref<AudioContext | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const sourceNode = ref<MediaElementAudioSourceNode | null>(null)
const filters = ref<Filters | null>(null)
const pending = ref<boolean>(false)
const isPlaying = ref<boolean>(false)
const progress = ref<number>(0)

const { activeFile, changeActiveFile, files, nextFile, prevFile } = useFileList()
const currentFileName = computed(() => (activeFile.value as File)?.name || '')

const { applySettings, filterSettings, visualization } = useAudioSettings()
const { clearPosition, restorePosition, savePosition } = useAudioPosition(audio, currentFileName)
const { startVisualization } = useVisualizer(canvas, analyser)

function changeFiles(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files)
    return
  const filesArray = [...input.files]
  if (files.value?.map(file => file.name).join() === filesArray.map(file => file.name).join()) {
    return
  }
  if (filesArray.length) {
    pause()
    files.value = filesArray
    changeActiveFile(0)
    initializeAudio()
  }
}

function changeProgress() {
  const duration = Number.isNaN(audio.value.duration) ? 0 : audio.value.duration
  const currentTime = audio.value.currentTime
  progress.value = duration ? Math.trunc((currentTime / duration) * 100) : 0
  savePosition()
}

function cleanup() {
  if (audio.value) {
    audio.value.pause()
    audio.value.src = ''
  }
  if (sourceNode.value) {
    sourceNode.value.disconnect()
    sourceNode.value = null
  }
  if (audioContext.value) {
    audioContext.value.close()
    audioContext.value = null
  }
  if (audio.value?.src) {
    URL.revokeObjectURL(audio.value.src)
  }
}

function connectFilters(audioContext: AudioContext): Filters | null {
  if (!audioContext)
    return null
  const filters = {
    bass: audioContext.createBiquadFilter(),
    mid: audioContext.createBiquadFilter(),
    treble: audioContext.createBiquadFilter(),
  }
  filters.bass.type = 'lowshelf'
  filters.mid.type = 'peaking'
  filters.treble.type = 'highshelf'
  updateFilterSettings(filters)
  return filters
}

async function initializeAudio() {
  try {
    if (!activeFile.value) {
      throw new Error('Аудиофайл не выбран')
    }
    if (!window.AudioContext) {
      throw new Error('Web Audio API не поддерживается')
    }

    if (!audioContext.value) {
      audioContext.value = new AudioContext()
    }

    audio.value.src = URL.createObjectURL(activeFile.value)

    if (!sourceNode.value) {
      analyser.value = audioContext.value.createAnalyser()
      analyser.value.fftSize = 2048

      sourceNode.value = audioContext.value.createMediaElementSource(audio.value)
      sourceNode.value.connect(analyser.value)
      analyser.value.connect(audioContext.value.destination)

      filters.value = connectFilters(audioContext.value)
      if (filters.value) {
        sourceNode.value.connect(filters.value.bass)
        filters.value.bass.connect(filters.value.mid)
        filters.value.mid.connect(filters.value.treble)
        filters.value.treble.connect(audioContext.value.destination)
      }
    }

    applySettings()
    restorePosition()
    await play()
  }
  catch (error) {
    console.error('Ошибка инициализации аудио:', error)
  }
}

async function openFiles() {
  try {
    if ('showOpenFilePicker' in window) {
      const fileHandles = await window.showOpenFilePicker({
        multiple: true,
        types: [{ accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'] }, description: 'Audio Files' }],
      })
      const newFiles = await Promise.all(fileHandles.map(handle => handle.getFile()))
      if (newFiles.length) {
        pause()
        files.value = newFiles
        changeActiveFile(0)
        initializeAudio()
      }
    }
    else {
      input.value?.click()
    }
  }
  catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Ошибка выбора файлов:', error)
    }
  }
}

function pause() {
  audio.value?.pause()
  isPlaying.value = false
  pending.value = false
}

async function play(): Promise<void> {
  try {
    if (audioContext.value?.state === 'suspended') {
      await audioContext.value.resume()
    }
    pending.value = true
    await audio.value.play()
    isPlaying.value = true
    pending.value = false
    if (visualization.value === 'bars') {
      startVisualization()
    }
  }
  catch (error) {
    console.error('Ошибка воспроизведения:', error)
  }
  finally {
    pending.value = false
  }
}

function setListeners() {
  useEventListener(audio.value, 'timeupdate', changeProgress)
  useEventListener(audio.value, 'ended', () => {
    clearPosition()
    nextFile()
  })
}

function updateFilterSettings(filters: Filters) {
  filters.bass.gain.value = filterSettings.value.bass.gain
  filters.bass.frequency.value = filterSettings.value.bass.frequency
  filters.mid.gain.value = filterSettings.value.mid.gain
  filters.mid.frequency.value = filterSettings.value.mid.frequency
  filters.treble.gain.value = filterSettings.value.treble.gain
  filters.treble.frequency.value = filterSettings.value.treble.frequency
}

onMounted(() => {
  if (window.launchQueue) {
    window.launchQueue.setConsumer(async (launchParams: LaunchParams) => {
      const fileHandles = launchParams.files
      if (fileHandles.length > 0) {
        try {
          const newFiles = await Promise.all(fileHandles.map(handle => handle.getFile()))
          files.value = newFiles
        }
        catch (error) {
          console.error('Error processing launchQueue files:', error)
        }
      }
    })
  }

  if (files.value.length) {
    initializeAudio()
    setListeners()
    return
  }
  if (!dropZone.value)
    return

  dropZone.value.ondrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer?.items) {
      const newFiles = [...e.dataTransfer.items]
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => !!file)
      if (newFiles.length) {
        pause()
        files.value.push(...newFiles)
        changeActiveFile(0)
        initializeAudio()
      }
    }
  }

  dropZone.value.ondragover = e => e.preventDefault()
  setListeners()
})

onUnmounted(() => {
  cleanup()
})

watch(activeFile, () => {
  pause()
  initializeAudio()
})

watch(
  () => filterSettings.value,
  () => {
    if (filters.value) {
      updateFilterSettings(filters.value)
    }
  },
  { deep: true, flush: 'post' },
)
</script>

<template>
  <div class="relative flex flex-col justify-between">
    <div class="sm:max-w-96 m-auto max-w-full">
      <canvas
        ref="canvas"
        width="360"
        height="200"
        class="pointer-events-none mx-auto my-2"
      />
      <div v-if="activeFile" class="flex w-full justify-between gap-2 px-4">
        <div class="max-w-[calc(100%-(48px))] overflow-hidden whitespace-nowrap">
          <div class="animate-marquee hover:animate-pause -translate-x-[90%]">
            {{ currentFileName }}
          </div>
        </div>
        <div class="flex items-center justify-center text-center min-w-[48px]">
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
          @change.stop="changeFiles"
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
