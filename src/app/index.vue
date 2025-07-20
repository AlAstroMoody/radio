<script setup lang="ts">
import { useFileList } from 'composables/useFileList'
import { useIndexedDB } from 'composables/useIndexedDB'
import { useRadio } from 'composables/useRadio'
import { AudioSettings, ControlPanel, iLovePwa, MusicPlayer, RadioList, RadioPlayer } from 'features'
import { BaseModal } from 'shared/ui'
import { onMounted } from 'vue'

const { isRadioMode } = useRadio()
const { updateFiles } = useFileList()
const { clearFilesFromIndexedDB, saveActiveFileIndex, saveFilesToIndexedDB } = useIndexedDB()

onMounted(() => {
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
        catch (error) {
          console.error('Error processing launchQueue files:', error)
        }
      }
    })
  }
})
</script>

<template>
  <div
    class="flex min-h-svh w-full flex-col md:flex-row gap-4 relative"
  >
    <aside
      class="flex flex-col z-1 w-full overflow-hidden md:h-screen md:w-96 md:min-w-[24rem]"
    >
      <div
        class="h-10 my-4 w-full max-w-sm font-blackcraft text-4xl lg:text-5xl text-black dark:text-white text-center flex gap-2 justify-center"
      >
        Amazing <div class="w-20">
          {{ isRadioMode ? 'radio' : 'music' }}
        </div>
      </div>
      <RadioList class="hidden md:block h-fit bg-glass backdrop-blur-md border border-glass shadow-lg rounded-r-lg p-4 dark:bg-glass-purple dark:border-glass-purple-border" :is-radio-mode="isRadioMode" />
      <ControlPanel class="fixed bottom-0" />
    </aside>

    <div class="flex h-[calc(100dvh-144px)] md:h-[calc(100dvh-64px)] w-full z-[1]">
      <MusicPlayer v-if="!isRadioMode" class="m-auto w-full md:w-max mb-3 mt-auto" />
      <RadioPlayer v-else class="m-auto w-full md:w-max mb-3 mt-auto" />
      <AudioSettings class="mb-auto hidden xl:flex bg-glass backdrop-blur-md border border-glass shadow-lg rounded-bl-lg p-4 dark:bg-glass-purple dark:border-glass-purple-border border-r-none border-t-none" />
    </div>

    <iLovePwa />

    <BaseModal />
  </div>
</template>

<style>
@import './index.css';
</style>
