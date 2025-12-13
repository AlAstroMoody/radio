<script setup lang="ts">
import { useAudioController } from 'composables/useAudioController'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useModal } from 'composables/useModal'
import { useRadio } from 'composables/useRadio'
import { AudioSettings, ControlPanel, iLovePwa, MusicPlayer, RadioList, RadioPlayer } from 'features'
import { AudioVisualizer, BaseModal, HotkeysHint } from 'shared/ui'
import { runStorageMigration } from 'shared/utils/storage-migration'
import { useLibraryStore, useStationsStore } from 'stores'
import { onMounted, ref, watch } from 'vue'

import AudioRoot from './providers/AudioRoot.vue'

const { isRadioMode } = useRadio()
const stationsStore = useStationsStore()
const libraryStore = useLibraryStore()
const { clearFilesFromIndexedDB, saveActiveFileIndex, saveFilesToIndexedDB, updateFiles } = libraryStore
const { openModal } = useModal()
const currentModal = ref<'audio-settings' | 'radio-list' | null>(null)
const audioController = useAudioController(false)
const { visualization } = useAudioSettings()

function handleOpenAudioSettings() {
  currentModal.value = 'audio-settings'
  openModal()
}

function handleOpenRadioList(_isRadioMode: boolean) {
  currentModal.value = 'radio-list'
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
          isRadioMode.value = false

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

watch(() => isRadioMode.value, (value) => {
  if (!audioController)
    return

  audioController.pause()

  if (value) {
    audioController.setEffectChain(null)
  }
}, { flush: 'post' })
</script>

<template>
  <AudioRoot>
    <div
      class="flex min-h-mobile w-full flex-col gap-4 relative"
    >
      <div class="flex-1 flex h-[calc(100dvh-144px)] md:h-[calc(100dvh-64px)] w-full z-[1] pb-safe md:flex-row">
        <RadioList class="z-1 w-full md:h-full md:w-96 md:min-w-[24rem] hidden md:block bg-glass backdrop-blur-md shadow-lg p-4 dark:bg-glass-purple border border-glass dark:border-glass-purple-border border-l-none border-t-none rounded-br-lg" />

        <div class="flex-1 flex flex-col justify-between items-center gap:20">
          <div
            class="h-10 mt-4 w-full max-w-sm font-blackcraft text-4xl lg:text-5xl text-black dark:text-white text-center flex gap-2 justify-center"
          >
            Amazing <div class="w-20">
              {{ isRadioMode ? 'radio' : 'music' }}
            </div>
          </div>

          <AudioVisualizer v-if="visualization" class="translate-y-1/2" />
          <div class="w-full md:w-max mb-4 min-h-[300px]">
            <MusicPlayer v-show="!isRadioMode" class="h-full mt-auto" />
            <RadioPlayer v-show="isRadioMode" class="h-full mt-auto" />
          </div>
        </div>

        <AudioSettings class="ml-auto mb-auto hidden lg:flex bg-glass backdrop-blur-md border border-glass shadow-lg rounded-bl-lg p-4 dark:bg-glass-purple dark:border-glass-purple-border border-r-none border-t-none" />
      </div>

      <ControlPanel
        @open-audio-settings="handleOpenAudioSettings"
        @open-radio-list="handleOpenRadioList"
      />

      <iLovePwa />

      <HotkeysHint />

      <BaseModal>
        <AudioSettings v-if="currentModal === 'audio-settings'" class="m-auto" />
        <RadioList v-if="currentModal === 'radio-list'" />
      </BaseModal>
    </div>
  </AudioRoot>
</template>

<style>
@import './index.css';
</style>
