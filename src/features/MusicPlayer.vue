<script setup lang="ts">
import { useAudioController } from 'composables/useAudioController'
import { useAudioService } from 'composables/useAudioService'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useHotkeys } from 'composables/useHotkeys'
import { useMediaSession } from 'composables/useMediaSession'
import { useRadio } from 'composables/useRadio'
import { storeToRefs } from 'pinia'
import { AudioControls, FileDropZone, MarqueeText, ProgressBar } from 'shared/ui'
import { useLibraryStore } from 'stores'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const fileDropZone = ref<InstanceType<typeof FileDropZone> | null>(null)
const wasPlayingBeforeSwitch = ref<boolean>(false)
const { isRadioMode } = useRadio()

const libraryStore = useLibraryStore()
const {
  activeFile,
  activeIndex,
  files,
  isRepeat,
  isShuffle,
} = storeToRefs(libraryStore)
const {
  changeActiveFile,
  clearFilesFromIndexedDB,
  loadActiveFileIndex,
  loadFilesFromIndexedDB,
  nextFile,
  prevFile,
  saveActiveFileIndex,
  saveFilesToIndexedDB,
  shuffleFiles,
  toggleRepeat,
  updateFiles,
  updateFilesWithoutReset,
} = libraryStore
const { autoplay, volume } = useAudioSettings()

const currentFileName = computed(() => activeFile.value?.name || '')

const { isSupported: isMediaSessionSupported, setActionHandlers, setMetadata, setPlaybackState, setPositionState } = useMediaSession()
const audioController = useAudioController()

const {
  currentTime,
  duration,
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
} = useAudioService(currentFileName)
const pending = computed(() => isMetadataLoading.value)

async function handleFilesSelected(newFiles: File[]): Promise<void> {
  if (files.value?.map((file: File) => file.name).join() === newFiles.map((file: File) => file.name).join()) {
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
    if (audioController) {
      audioController.audio.value!.playbackRate = 1
    }
    wasPlayingBeforeSwitch.value = false
  }
  catch { }
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
    }).catch(() => { })
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
  initializeAudioService()
  setupMediaSessionHandlers()

  if (files.value.length) {
    initializeAudioWithSettings()
    return
  }

  initPlayerOnMount()
})

watch(
  () => audioController?.state.ended,
  (ended) => {
    if (!ended)
      return

    if (isRepeat.value || activeIndex.value < files.value.length - 1) {
      wasPlayingBeforeSwitch.value = true
      nextFile()
    }
  },
)

watch(activeFile, () => {
  const shouldContinuePlaying = wasPlayingBeforeSwitch.value || isPlaying.value
  pause()
  setTimeout(() => {
    initializeAudioWithSettings(shouldContinuePlaying)
    updateMediaSessionMetadata()
  }, 50)
})

watch(() => files.value.findIndex((file: File) => file === activeFile.value), async (newIndex: number) => {
  if (newIndex !== -1) {
    await saveActiveFileIndex(newIndex)
  }
})

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

watch(() => isRadioMode.value, (value) => {
  if (value) {
    wasPlayingBeforeSwitch.value = isPlaying.value
    pause()
    return
  }

  if (!activeFile.value || !files.value.length)
    return

  const shouldPlay = wasPlayingBeforeSwitch.value || autoplay.value

  if (shouldPlay) {
    nextTick(() => {
      if (!isRadioMode.value && activeFile.value) {
        initializeAudioWithSettings(shouldPlay)
      }
    })
  }
  else {
    nextTick(() => {
      if (!isRadioMode.value && activeFile.value) {
        initializeAudioWithSettings(false)
      }
    })
  }
  wasPlayingBeforeSwitch.value = false
})
</script>

<template>
  <div class="relative flex flex-col justify-between landscape-flex-row">
    <div class="z-10 mt-auto md:relative">
      <FileDropZone
        ref="fileDropZone"
        :has-files="!!files?.length"
        @files-selected="handleFilesSelected"
      />
    </div>
    <div class="md:max-w-96 m-auto max-w-full">
      <div v-if="activeFile" class="flex w-full justify-between gap-2 px-4 max-w-[360px] font-blackcraft text-black dark:text-white">
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
