<script setup lang="ts">
import { useAudioController } from 'composables/useAudioController'
import { useAudioService } from 'composables/useAudioService'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useHotkeys } from 'composables/useHotkeys'
import { useMediaSession } from 'composables/useMediaSession'
import { storeToRefs } from 'pinia'
import { AudioControls, FileDropZone, MarqueeText, ProgressBar } from 'shared/ui'
import { useLibraryStore, usePlaybackStore } from 'stores'
import { computed, nextTick, ref, watch } from 'vue'

const fileDropZone = ref<InstanceType<typeof FileDropZone> | null>(null)
const wasPlayingBeforeSwitch = ref<boolean>(false)
const isRestoringFromDb = ref(false)

const playbackStore = usePlaybackStore()
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

async function enterMusicMode(shouldPlay: boolean): Promise<void> {
  await nextTick()

  if (!files.value.length) {
    await initPlayerOnMount()
    wasPlayingBeforeSwitch.value = false
    return
  }

  if (!activeFile.value)
    return

  try {
    await initializeAudioWithSettings(shouldPlay)
  }
  catch { }

  wasPlayingBeforeSwitch.value = false
}

async function handleFilesSelected(newFiles: File[]): Promise<void> {
  if (files.value?.map((file: File) => file.name).join() === newFiles.map((file: File) => file.name).join()) {
    return
  }
  if (newFiles.length) {
    // Запоминаем, была ли музыка в процессе воспроизведения
    const wasPlaying = isPlaying.value
    pause()
    wasPlayingBeforeSwitch.value = wasPlaying || autoplay.value
    updateFiles(newFiles)
    changeActiveFile(0)
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
    if (shouldAutoPlay)
      await play()
    wasPlayingBeforeSwitch.value = false
  }
  catch { }
}

async function initPlayerOnMount(): Promise<void> {
  if (files.value.length)
    return

  try {
    const [dbFiles, activeIndex] = await Promise.all([loadFilesFromIndexedDB(), loadActiveFileIndex()])
    if (!dbFiles.length)
      return

    isRestoringFromDb.value = true
    updateFilesWithoutReset(dbFiles)
    const validIndex = Math.min(activeIndex, dbFiles.length - 1)
    changeActiveFile(validIndex)
    await initializeAudioWithSettings(false)
  }
  catch { }
  finally {
    isRestoringFromDb.value = false
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
    pause: () => {
      if (isPlaying.value)
        pause()
    },
    play: () => {
      if (!isPlaying.value)
        void play()
    },
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

initializeAudioService()
setupMediaSessionHandlers()

watch(() => playbackStore.mode, async (mode, oldMode) => {
  if (mode !== 'music') {
    if (oldMode === 'music')
      pause()

    return
  }

  const isEnteringMusic = oldMode === undefined || oldMode !== 'music'
  if (!isEnteringMusic)
    return

  await enterMusicMode(playbackStore.consumeModeEnterResume())
}, { immediate: true })

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
  if (isRestoringFromDb.value)
    return

  const shouldAutoPlay = wasPlayingBeforeSwitch.value || isPlaying.value
  pause()
  setTimeout(() => {
    void initializeAudioWithSettings(shouldAutoPlay)
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
    <div v-if="activeFile" class="flex flex-col my-2 gap-4 items-center">
      <div class="flex w-full justify-between gap-2 px-4 max-w-[360px] font-blackcraft text-black dark:text-white">
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
