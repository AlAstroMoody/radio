<script setup lang="ts">
import type { PlaybackMode } from 'stores/playback'

import { useAudioSettings } from 'composables/useAudioSettings'
import { useModal } from 'composables/useModal'
import { useRadio } from 'composables/useRadio'
import { AudioSettings, ControlPanel, iLovePwa, MusicPlayer, RadioList, RadioPlayer, YtPlayer, YtTrackList } from 'features'
import { AudioVisualizer, BaseModal, HotkeysHint } from 'shared/ui'
import { runStorageMigration } from 'shared/utils/storage-migration'
import { useLibraryStore, usePlaybackStore, useStationsStore, useYtStore } from 'stores'
import { computed, onMounted, ref, watch } from 'vue'

import AudioRoot from './providers/AudioRoot.vue'

const { isRadioMode } = useRadio()
const stationsStore = useStationsStore()
const libraryStore = useLibraryStore()
const playbackStore = usePlaybackStore()
const ytStore = useYtStore()
const isYtMode = computed(() => playbackStore.mode === 'yt')
const modeLabel = computed(() => {
  if (isYtMode.value)
    return 'yt'
  return isRadioMode.value ? 'radio' : 'music'
})

// Тяжёлый UI (списки/плееры) переключаем после paint кнопок ControlPanel
const deferredMode = ref<PlaybackMode>(playbackStore.mode)
const isYtView = computed(() => deferredMode.value === 'yt')
const isRadioView = computed(() => deferredMode.value === 'radio')
const isMusicView = computed(() => deferredMode.value === 'music')
let deferredModeToken = 0

watch(() => playbackStore.mode, (mode) => {
  if (deferredMode.value === mode)
    return

  const token = ++deferredModeToken
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (token !== deferredModeToken)
        return

      deferredMode.value = mode
    })
  })
})

const { clearFilesFromIndexedDB, saveActiveFileIndex, saveFilesToIndexedDB, updateFiles } = libraryStore
const { openModal } = useModal()
const currentModal = ref<'audio-settings' | 'playlist' | null>(null)
const { visualization, ytCoverArt } = useAudioSettings()

function handleOpenAudioSettings() {
  currentModal.value = 'audio-settings'
  openModal()
}

function handleOpenPlaylist() {
  currentModal.value = 'playlist'
  openModal()
}

onMounted(() => {
  runStorageMigration()
  stationsStore.fetchStations()

  if (window.launchQueue) {
    window.launchQueue.setConsumer(async (launchParams: LaunchParams) => {
      const fileHandles = launchParams.files
      if (fileHandles && fileHandles.length > 0) {
        try {
          // Переключаемся в режим музыки при открытии файлов
          playbackStore.setMode('music')

          const newFiles = await Promise.all(fileHandles.map(handle => handle.getFile()))
          if (newFiles.length) {
            updateFiles(newFiles)
            // Сохраняем файлы в IndexedDB для восстановления
            await clearFilesFromIndexedDB()
            await saveFilesToIndexedDB(newFiles)
            await saveActiveFileIndex(0)
          }
        }
        catch { }
      }
    })
  }
})

watch(isYtMode, (value) => {
  if (value)
    void ytStore.ensureDefaultSearch()
}, { immediate: true })
</script>

<template>
  <AudioRoot>
    <div
      class="flex min-h-mobile w-full flex-col gap-4 relative"
    >
      <div class="flex-1 flex h-[calc(100dvh-144px)] md:h-[calc(100dvh-64px)] w-full z-1 pb-safe md:flex-row">
        <RadioList v-if="!isYtView" class="z-1 w-full md:h-full md:w-96 md:min-w-[24rem] hidden md:block bg-glass backdrop-blur-md shadow-lg dark:shadow-xl shadow-right p-4 dark:bg-glass-purple border border-glass dark:border-glass-purple-border border-l-0 border-t-0 rounded-br-lg" />
        <YtTrackList v-else class="z-1 w-full md:h-full md:w-96 md:min-w-[24rem] hidden md:block bg-glass backdrop-blur-md shadow-lg dark:shadow-xl shadow-right p-4 dark:bg-glass-purple border border-glass dark:border-glass-purple-border border-l-0 border-t-0 rounded-br-lg" />

        <div class="flex-1 flex flex-col items-center min-h-0">
          <div
            class="h-10 mt-4 w-full max-w-sm shrink-0 font-blackcraft text-4xl lg:text-5xl text-black dark:text-white text-center flex gap-2 justify-center"
          >
            Amazing <div class="w-20">
              {{ modeLabel }}
            </div>
          </div>

          <div class="mt-auto mb-15 flex w-full flex-col items-center gap-3">
            <AudioVisualizer
              v-if="visualization && !(isYtView && ytCoverArt)"
              class="shrink-0"
            />
            <div class="flex w-full max-w-[360px] min-h-56 flex-col justify-end mx-auto">
              <YtPlayer v-if="isYtView" class="w-full" />
              <MusicPlayer v-else-if="isMusicView" class="w-full min-h-56" />
              <RadioPlayer v-else-if="isRadioView" class="w-full" />
            </div>
          </div>
        </div>

        <AudioSettings class="ml-auto mb-auto hidden lg:flex bg-glass backdrop-blur-md border border-glass shadow-lg rounded-bl-lg p-4 dark:bg-glass-purple dark:border-glass-purple-border border-r-0 border-t-0" />
      </div>

      <ControlPanel
        class="fixed max-w-15 md:relative md:max-w-fit"
        @open-audio-settings="handleOpenAudioSettings"
        @open-playlist="handleOpenPlaylist"
      />

      <iLovePwa />

      <HotkeysHint />

      <BaseModal>
        <AudioSettings v-if="currentModal === 'audio-settings'" class="m-auto" />
        <YtTrackList v-if="currentModal === 'playlist' && isYtMode" />
        <RadioList v-else-if="currentModal === 'playlist'" />
      </BaseModal>
    </div>
  </AudioRoot>
</template>

<style>
@import './index.css';
</style>
