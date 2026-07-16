<script setup lang="ts">
import type { PlaybackMode } from 'stores/playback'

import { useAudioSettings } from 'composables/useAudioSettings'
import { useModal } from 'composables/useModal'
import { useRadio } from 'composables/useRadio'
import { AudioSettings, ControlPanel, iLovePwa, MusicPlayer, RadioList, RadioPlayer, YtPlayer, YtTrackList } from 'features'
import { storeToRefs } from 'pinia'
import { formatYtTitle, getYtThumbnailUrl } from 'shared/types/yt'
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
const { activeTrack: ytActiveTrack } = storeToRefs(ytStore)
const isYtMode = computed(() => playbackStore.mode === 'yt')
const modeLabel = computed(() => {
  if (isYtMode.value)
    return 'yt'
  return isRadioMode.value ? 'radio' : 'music'
})

const ytCoverUrl = computed(() => getYtThumbnailUrl(ytActiveTrack.value, 120))
const ytCoverTitle = computed(() => formatYtTitle(ytActiveTrack.value))
// Тяжёлый UI (списки/плееры) переключаем после paint кнопок ControlPanel
const MODE_ORDER: PlaybackMode[] = ['music', 'radio', 'yt']
const deferredMode = ref<PlaybackMode>(playbackStore.mode)
const isYtView = computed(() => deferredMode.value === 'yt')
const isRadioView = computed(() => deferredMode.value === 'radio')
const isMusicView = computed(() => deferredMode.value === 'music')
const modeSlideName = ref('mode-slide-next')
let deferredModeToken = 0

watch(() => playbackStore.mode, (mode) => {
  if (deferredMode.value === mode)
    return

  const from = MODE_ORDER.indexOf(deferredMode.value)
  const to = MODE_ORDER.indexOf(mode)
  modeSlideName.value = to >= from ? 'mode-slide-next' : 'mode-slide-prev'

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

const showYtCover = computed(() => isYtMode.value && ytCoverArt.value && !!ytCoverUrl.value)
const showVisualizer = computed(() => !!visualization.value && !showYtCover.value)
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
      class="relative flex min-h-mobile w-full flex-col gap-4 md:gap-2"
    >
      <div class="z-1 flex h-[calc(100dvh-144px)] w-full flex-1 pb-safe md:h-[calc(100dvh-64px)] md:flex-row md:gap-3 md:p-3">
        <RadioList
          v-if="!isYtView"
          class="z-1 w-full hidden md:block md:h-full md:w-96 md:min-w-[24rem] bg-glass backdrop-blur-md shadow-lg dark:shadow-xl shadow-right p-4 dark:bg-glass-purple border border-glass dark:border-glass-purple-border border-l-0 border-t-0 rounded-br-lg md:rounded-xl md:border-l md:border-t"
        />
        <YtTrackList
          v-else
          class="z-1 w-full hidden md:block md:h-full md:w-96 md:min-w-[24rem] bg-glass backdrop-blur-md shadow-lg dark:shadow-xl shadow-right p-4 dark:bg-glass-purple border border-glass dark:border-glass-purple-border border-l-0 border-t-0 rounded-br-lg md:rounded-xl md:border-l md:border-t"
        />

        <div class="flex min-h-0 flex-1 flex-col items-center">
          <div
            class="mt-4 flex h-10 w-full max-w-sm shrink-0 items-center justify-center px-3 text-center font-blackcraft text-4xl text-black dark:text-white lg:text-5xl"
          >
            Amazing {{ modeLabel }}
          </div>

          <div class="mt-auto mb-24 flex w-full flex-col items-center gap-3 md:mb-15">
            <div class="flex min-h-40 w-full shrink-0 items-center justify-center md:min-h-48">
              <img
                v-if="showYtCover"
                :src="ytCoverUrl"
                :alt="ytCoverTitle"
                class="size-48 rounded-xl object-cover shadow-lg ring-1 ring-glass-purple-border md:size-40"
              >
              <AudioVisualizer
                v-else-if="showVisualizer"
                class="shrink-0"
              />
            </div>
            <div class="mode-slide-host mx-auto flex min-h-56 w-full max-w-[360px] flex-col justify-end">
              <Transition :name="modeSlideName" mode="out-in">
                <YtPlayer v-if="isYtView" key="yt" class="w-full" />
                <MusicPlayer v-else-if="isMusicView" key="music" class="w-full" />
                <RadioPlayer v-else-if="isRadioView" key="radio" class="w-full" />
              </Transition>
            </div>
          </div>
        </div>

        <AudioSettings
          class="ml-auto mb-auto hidden lg:flex bg-glass backdrop-blur-md border border-glass shadow-lg rounded-bl-lg p-4 dark:bg-glass-purple dark:border-glass-purple-border border-r-0 border-t-0 lg:rounded-xl lg:border-r lg:border-t"
        />
      </div>

      <ControlPanel
        class="md:mx-3 md:mb-2"
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

.mode-slide-host {
  overflow: hidden;
}

.mode-slide-next-enter-active,
.mode-slide-next-leave-active,
.mode-slide-prev-enter-active,
.mode-slide-prev-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.mode-slide-next-enter-from {
  opacity: 0;
  transform: translate3d(28px, 0, 0);
}

.mode-slide-next-leave-to {
  opacity: 0;
  transform: translate3d(-28px, 0, 0);
}

.mode-slide-prev-enter-from {
  opacity: 0;
  transform: translate3d(-28px, 0, 0);
}

.mode-slide-prev-leave-to {
  opacity: 0;
  transform: translate3d(28px, 0, 0);
}
</style>
