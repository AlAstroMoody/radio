<script setup lang="ts">
import { AudioSettings, ControlPanel, iLovePwa, MusicPlayer, RadioList, RadioPlayer } from 'features'
import { BaseModal } from 'shared/ui'
import { onMounted, ref } from 'vue'

const isRadioMode = ref(true)

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const action = urlParams.get('action')
  if (action === 'open-audio-file') {
    isRadioMode.value = false
  }
})
</script>

<template>
  <div
    class="flex min-h-svh w-full flex-col md:flex-row gap-4"
  >
    <aside
      class="flex flex-col z-1 w-full overflow-hidden md:h-screen md:w-96 md:min-w-[24rem]"
    >
      <div
        class="my-4 w-full max-w-sm font-blackcraft text-4xl lg:text-5xl text-black dark:text-white text-center flex gap-2 justify-center"
      >
        Amazing <div class="w-20">
          {{ isRadioMode ? 'radio' : 'music' }}
        </div>
      </div>
      <RadioList class="hidden md:block h-fit bg-glass backdrop-blur-md border border-glass shadow-lg rounded-r-lg p-4 dark:bg-glass-purple dark:border-glass-purple-border" :is-radio-mode />
      <ControlPanel v-model:is-radio-mode="isRadioMode" class="fixed bottom-0" />
    </aside>

    <div class="flex h-[calc(100dvh-144px)] md:h-[calc(100dvh-64px)] w-full z-[1]">
      <RadioPlayer v-if="isRadioMode" class="m-auto w-max mb-5 mt-auto" />
      <MusicPlayer v-else class="m-auto w-full md:w-max mb-3 mt-auto" />
      <AudioSettings class="mb-auto hidden xl:flex bg-glass backdrop-blur-md border border-glass shadow-lg rounded-bl-lg p-4 dark:bg-glass-purple dark:border-glass-purple-border" />
    </div>

    <iLovePwa />

    <picture class="pointer-events-none fixed bottom-0 right-0 z-0">
      <source srcset="/images/flame-right.webp" media="(min-width: 768px)">
      <img src="/images/flame-right-mobile.webp" alt="flame">
    </picture>

    <picture class="pointer-events-none fixed left-0 top-0 z-0 h-full md:h-fit">
      <source srcset="/images/flame-left.webp" media="(min-width: 768px)">
      <img src="/images/flame-left-mobile.webp" alt="flame">
    </picture>

    <BaseModal />
  </div>
</template>

<style>
@import './index.css';
</style>
