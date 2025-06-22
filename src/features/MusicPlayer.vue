<script setup lang="ts">
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowsUpDownIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, PauseIcon, PlayIcon } from '@heroicons/vue/24/solid'
import { useEventListener, useParallax } from '@vueuse/core'
import { useAudioPosition } from 'composables/useAudioPosition'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useFileList } from 'composables/useFileList'
import { useVisualizer } from 'composables/useVisualizer'
import { BaseButton } from 'shared/ui'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

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

const { activeFile, changeActiveFile, files, isRepeat, isShuffle, nextFile, prevFile, shuffleFiles, toggleRepeat, updateFiles } = useFileList()
const currentFileName = computed(() => (activeFile.value as File)?.name || '')

const { applySettings, filterSettings } = useAudioSettings()
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
    updateFiles(filesArray)
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
        updateFiles(newFiles)
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
    startVisualization()
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
          updateFiles(newFiles)
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
        updateFiles(newFiles)
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

const parallax = reactive(useParallax(canvas))
const cardStyle = computed(() => ({
  transform: `rotateX(${parallax.roll * 20 + 170}deg) rotateY(${
    parallax.tilt * 20 + 170
  }deg)`,
  transition: '.3s ease-out all',
}))

function formatTime(seconds: number) {
  seconds = Math.trunc(seconds)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function handleProgressClick(event: MouseEvent) {
  if (!audio.value || !audio.value.duration)
    return

  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const progressBarWidth = rect.width
  const clickPercent = clickX / progressBarWidth

  audio.value.currentTime = clickPercent * audio.value.duration
}
</script>

<template>
  <div class="relative flex flex-col justify-between">
    <div class="z-10 mt-auto md:relative">
      <div
        ref="dropZone"
        :class="files?.length ? 'hidden' : 'flex'"
        class="z-10 mx-auto h-24 w-24 cursor-pointer items-center justify-between rounded-xl border border-dashed border-dark-100 dark:border-light-100"
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
    <div class="sm:max-w-96 m-auto max-w-full">
      <canvas
        ref="canvas"
        :style="cardStyle"
        width="360"
        height="200"
        class="pointer-events-none mx-auto my-2 overflow-hidden rounded-2xl shadow-next dark:shadow-card rotate-180"
      />
      <div v-if="activeFile" class="flex w-full justify-between gap-2 px-4 max-w-[360px]">
        <div class="max-w-[calc(100%-48px)] overflow-hidden whitespace-nowrap font-blackcraft">
          <div class="animate-marquee hover:animate-pause -translate-x-[90%]">
            {{ currentFileName }}
          </div>
        </div>
        <div class="flex items-center justify-center text-center min-w-[48px]">
          {{ progress }}%
        </div>
      </div>
    </div>

    <div v-if="activeFile" class="flex flex-col my-2 gap-4 items-center">
      <!-- Основные кнопки управления -->
      <div class="flex items-center gap-4">
        <BaseButton
          variant="player"
          @click="prevFile"
        >
          <ChevronDoubleLeftIcon class="h-6 w-6" />
        </BaseButton>
        <BaseButton
          variant="player"
          class="!size-14"
          @click="isPlaying ? pause() : play()"
        >
          <PlayIcon v-if="!isPlaying" class="h-10 w-10" />
          <PauseIcon v-else class="h-10 w-10" />
        </BaseButton>
        <BaseButton
          variant="player"
          @click="nextFile"
        >
          <ChevronDoubleRightIcon class="h-6 w-6" />
        </BaseButton>
      </div>

      <!-- Дополнительные кнопки -->
      <div class="flex items-center gap-4">
        <BaseButton
          variant="player"
          :class="{ 'text-purple-500': isShuffle }"
          @click="shuffleFiles"
        >
          <div class="relative">
            <ArrowsUpDownIcon class="h-5 w-5" />
            <div
              v-if="isShuffle"
              class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"
            />
          </div>
        </BaseButton>
        <BaseButton
          variant="player"
          @click="openFiles"
        >
          <ArrowDownTrayIcon class="h-5 w-5" />
        </BaseButton>
        <BaseButton
          variant="player"
          :class="{ 'text-purple-500': isRepeat }"
          @click="toggleRepeat"
        >
          <div class="relative">
            <ArrowPathIcon class="h-5 w-5" />
            <div
              v-if="isRepeat"
              class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"
            />
          </div>
        </BaseButton>
      </div>
      <div class="w-full">
        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>{{ formatTime(audio.currentTime || 0) }}</span>
          <span>{{ formatTime(audio.duration || 0) }}</span>
        </div>
        <div
          class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 cursor-pointer"
          @click="handleProgressClick"
        >
          <div
            class="bg-purple-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
