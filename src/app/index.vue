<script setup lang="ts">
import { iLovePwa, iMusicPlayer, iRadioList, iRadioPlayer } from 'features'

import { iModeButton, iPlaylistButton, iThemeButton } from 'shared/ui'
import { ref } from 'vue'

const isRadioMode = ref(true)
const isActivePlaylist = ref(false)

function showPlaylist() {
  isActivePlaylist.value = !isActivePlaylist.value
  isRadioMode.value = true
}
</script>

<template>
  <div
    class="flex min-h-svh w-full flex-col bg-light-100 text-blue-100 transition-colors dark:bg-dark-100 md:flex-row"
  >
    <aside
      class="flex flex-col z-10 w-full overflow-hidden px-4 md:h-screen md:w-96 md:min-w-[24rem]"
    >
      <div
        class="mb-4 w-full max-w-sm font-cyberpunk text-6xl text-black dark:text-white"
      >
        <div class="text-left">
          Amazing
        </div>
        <div class="text-right delay-100">
          Radio
        </div>
      </div>

      <iRadioList v-if="isRadioMode" class="hidden md:block h-fit" />
      <div class="mt-auto ml-2 hidden md:flex gap-2">
        <iThemeButton />
        <iModeButton v-model="isRadioMode" @click="isRadioMode = !isRadioMode" />
      </div>

      <div
        class="flex gap-4 items-center bg-menu p-2 fixed bottom-0 left-0 right-0 md:hidden"
      >
        <iPlaylistButton @click="showPlaylist" />
        <iThemeButton />
        <iModeButton v-model="isRadioMode" @click="isRadioMode = !isRadioMode" />
      </div>
    </aside>

    <div class="flex z-10 h-full w-full md:h-screen md:px-4">
      <iRadioPlayer v-if="isRadioMode" class="m-auto w-max lg:ml-20" />
      <iMusicPlayer v-else class="m-auto w-full md:w-max lg:ml-20" />
    </div>
    <iRadioList
      v-if="isRadioMode && isActivePlaylist"
      class="z-20 block p-4 md:hidden fixed top-0 bottom-0 h-[calc(100dvh-64px)] bg-menu backdrop-blur-2xl"
    />
    <iLovePwa />

    <picture class="pointer-events-none fixed bottom-0 right-0 z-0">
      <source srcset="/images/flame-right.webp" media="(min-width: 768px)">
      <img src="/images/flame-right-mobile.webp" alt="flame">
    </picture>

    <picture class="pointer-events-none fixed left-0 top-0 z-0 h-full md:h-fit">
      <source srcset="/images/flame-left.webp" media="(min-width: 768px)">
      <img src="/images/flame-left-mobile.webp" alt="flame">
    </picture>
  </div>
</template>

<style>
@import './index.css';
</style>
