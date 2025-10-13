<script setup lang="ts">
import { useAudioService } from 'composables/useAudioService'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useFileList } from 'composables/useFileList'
import { useHotkeys } from 'composables/useHotkeys'
import { useIndexedDB } from 'composables/useIndexedDB'
import { useMediaSession } from 'composables/useMediaSession'
import { AudioControls, AudioVisualizer, FileDropZone, MarqueeText, ProgressBar } from 'shared/ui'
import { computed, onMounted, ref, watch } from 'vue'

const fileDropZone = ref<InstanceType<typeof FileDropZone> | null>(null)
const audio = ref<HTMLAudioElement>(new Audio())
const visualizer = ref(null)
const pending = ref<boolean>(false)
const wasPlayingBeforeSwitch = ref<boolean>(false)

const { activeFile, activeIndex, changeActiveFile, files, isRepeat, isShuffle, nextFile, prevFile, shuffleFiles, toggleRepeat, updateFiles, updateFilesWithoutReset } = useFileList()
const { volume } = useAudioSettings()
const currentFileName = computed(() => activeFile.value?.name || '')

// Media Session API
const { isSupported: isMediaSessionSupported, setActionHandlers, setMetadata, setPlaybackState, setPositionState } = useMediaSession()

const {
  currentTime,
  duration,
  getAnalyser,
  handleProgressSeek,
  initializeAudio,
  initializeAudioService,
  isMetadataLoading,
  isPlaying,
  pause,
  play,
  progress,
  seekBackward,
  seekForward,
  togglePlayPause,
  undoLastSeek,
} = useAudioService(audio, currentFileName)

const { clearFilesFromIndexedDB, loadActiveFileIndex, loadFilesFromIndexedDB, saveActiveFileIndex, saveFilesToIndexedDB } = useIndexedDB()

async function handleFilesSelected(newFiles: File[]) {
  if (files.value?.map(file => file.name).join() === newFiles.map(file => file.name).join()) {
    return
  }
  if (newFiles.length) {
    // Запоминаем, была ли музыка в процессе воспроизведения
    const wasPlaying = isPlaying.value
    pause()
    updateFiles(newFiles)
    changeActiveFile(0)
    await initializeAudioWithSettings(wasPlaying)
    await clearFilesFromIndexedDB()
    await saveFilesToIndexedDB(newFiles)
    await saveActiveFileIndex(0)
  }
  else {
    updateFiles([])
    await clearFilesFromIndexedDB()
  }
}

async function initializeAudioWithSettings(shouldAutoPlay = false) {
  if (!activeFile.value)
    return

  try {
    await initializeAudio(activeFile.value)
    if (shouldAutoPlay) {
      await play()
    }
  }
  catch (error) {
    console.error('Ошибка инициализации аудио:', error)
  }
}

function initPlayerOnMount() {
  // Восстанавливаем файлы из IndexedDB, если они есть и файлов сейчас нет
  if (!files.value.length) {
    Promise.all([loadFilesFromIndexedDB(), loadActiveFileIndex()]).then(([dbFiles, activeIndex]) => {
      if (dbFiles.length) {
        updateFilesWithoutReset(dbFiles)
        const validIndex = Math.min(activeIndex, dbFiles.length - 1)
        changeActiveFile(validIndex)
        // При восстановлении из IndexedDB не запускаем автоматически
        initializeAudioWithSettings(false)
      }
    }).catch((error) => {
      console.error('❌ Ошибка при восстановлении файлов:', error)
    })
  }
}

function openFiles() {
  fileDropZone.value?.openFiles()
}

// Media Session функции
function setupMediaSessionHandlers(): void {
  if (!isMediaSessionSupported.value)
    return

  setActionHandlers({
    nexttrack: nextFile,
    pause: togglePlayPause,
    play: togglePlayPause,
    previoustrack: prevFile,
    seekbackward: (_details) => {
      seekBackward()
    },
    seekforward: (_details) => {
      seekForward()
    },
  })
}

function updateMediaSessionMetadata(): void {
  if (!isMediaSessionSupported.value || !activeFile.value)
    return

  const fileName = activeFile.value.name
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '') // Убираем расширение

  setMetadata({
    title: nameWithoutExt,
  })
}

function updateMediaSessionPosition(): void {
  if (!isMediaSessionSupported.value)
    return

  setPositionState({
    duration: duration.value,
    playbackRate: 1,
    position: currentTime.value,
  })
}

// Горячие клавиши
useHotkeys([
  { callback: togglePlayPause, key: ' ', preventDefault: true },
  { callback: seekBackward, key: 'ArrowLeft', preventDefault: true },
  { callback: seekForward, key: 'ArrowRight', preventDefault: true },
  { callback: () => {
    volume.value = Math.min(100, volume.value + 10)
  }, key: 'ArrowUp', preventDefault: true },
  { callback: () => {
    volume.value = Math.max(0, volume.value - 10)
  }, key: 'ArrowDown', preventDefault: true },
  { callback: nextFile, key: 'n', preventDefault: true },
  { callback: prevFile, key: 'p', preventDefault: true },
  { callback: toggleRepeat, key: 'r', preventDefault: true },
  { callback: shuffleFiles, key: 's', preventDefault: true },
  { callback: undoLastSeek, key: 'u', preventDefault: true },
  { callback: openFiles, key: 'o', preventDefault: true },
])

onMounted(() => {
  // Инициализируем AudioService
  initializeAudioService()

  // Настраиваем Media Session
  setupMediaSessionHandlers()

  // Добавляем обработчик события ended для перехода к следующему файлу
  audio.value.addEventListener('ended', () => {
    // Если включен repeat или есть следующие файлы, продолжаем воспроизведение
    if (isRepeat.value || activeIndex.value < files.value.length - 1) {
      // Запоминаем, что песня должна продолжиться
      wasPlayingBeforeSwitch.value = true
      nextFile()
    }
  })

  if (files.value.length) {
    initializeAudioWithSettings()
    return
  }

  initPlayerOnMount()
})

watch(activeFile, () => {
  // Запоминаем состояние воспроизведения ДО остановки
  const shouldContinuePlaying = wasPlayingBeforeSwitch.value || isPlaying.value
  pause()
  setTimeout(() => {
    initializeAudioWithSettings(shouldContinuePlaying)
    // Обновляем метаданные Media Session при смене трека
    updateMediaSessionMetadata()
  }, 50)
})

watch(() => files.value.findIndex(file => file === activeFile.value), async (newIndex) => {
  if (newIndex !== -1) {
    await saveActiveFileIndex(newIndex)
  }
})

// Media Session watchers
watch(isPlaying, (playing) => {
  if (isMediaSessionSupported.value) {
    setPlaybackState(playing ? 'playing' : 'paused')
  }
})

watch([currentTime, duration], () => {
  if (isMediaSessionSupported.value && duration.value > 0) {
    updateMediaSessionPosition()
  }
})
</script>

<template>
  <div class="relative flex flex-col justify-between">
    <div class="z-10 mt-auto md:relative">
      <FileDropZone
        ref="fileDropZone"
        :has-files="!!files?.length"
        @files-selected="handleFilesSelected"
      />
      <audio
        ref="audio"
        class="hidden"
        crossorigin="anonymous"
        preload="metadata"
      />
    </div>
    <div class="sm:max-w-96 m-auto max-w-full">
      <AudioVisualizer
        ref="visualizer"
        :analyser="getAnalyser()"
        :is-playing="isPlaying"
      />
      <div v-if="activeFile" class="flex w-full justify-between gap-2 px-4 max-w-[360px] font-blackcraft ">
        <MarqueeText
          :text="currentFileName"
          :speed="30"
          :min-duration="8"
          class="max-w-[calc(100%-48px)]"
        />
        <div class="flex items-center justify-center text-center min-w-[48px]">
          {{ progress }}%
        </div>
      </div>
    </div>

    <div v-if="activeFile" class="flex flex-col my-2 gap-4 items-center">
      <AudioControls
        :is-playing="isPlaying"
        :is-shuffle="isShuffle"
        :is-repeat="isRepeat"
        :pending="pending"
        @seek-backward="seekBackward"
        @prev-file="prevFile"
        @toggle-play-pause="togglePlayPause"
        @next-file="nextFile"
        @seek-forward="seekForward"
        @shuffle-files="shuffleFiles"
        @open-files="openFiles"
        @toggle-repeat="toggleRepeat"
        @undo-last-seek="undoLastSeek"
      />

      <ProgressBar
        :current-time="currentTime"
        :duration="duration"
        :progress="progress"
        :is-loading="isMetadataLoading"
        @seek="handleProgressSeek"
      />
    </div>
  </div>
</template>
