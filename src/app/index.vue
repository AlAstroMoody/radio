<script setup lang="ts">
import { iRadioPlayer, iMusicPlayer, iLovePwa, iRadioList } from 'features'
import { iThemeButton, iModeButton, iPlaylistButton } from 'shared/ui'

import { useGlobalState } from 'processes'
const { isRadioMode, isActivePlaylist } = useGlobalState()

const title = [
  { char: 'r', class: 'delay-0' },
  { char: 'a', class: 'delay-75' },
  { char: 'd', class: 'delay-150' },
  { char: 'i', class: 'delay-225' },
  { char: 'o', class: 'delay-300' },
]
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
        <div class="text-left">Amazing</div>
        <div class="text-right delay-100">
          <span v-for="(el, index) in title" :class="el.class" :key="index">
            {{ el.char }}
          </span>
        </div>
      </div>

      <iRadioList class="hidden md:block h-fit" />
      <div class="mt-auto ml-2 hidden md:flex gap-2">
        <iThemeButton /> <iModeButton />
      </div>

      <div
        class="flex gap-4 items-center bg-menu p-2 fixed bottom-0 left-0 right-0 md:hidden"
      >
        <iPlaylistButton />
        <iThemeButton />
        <iModeButton />
      </div>
    </aside>

    <div class="flex z-10 h-full w-full md:h-screen md:px-4">
      <iRadioPlayer class="m-auto w-max lg:ml-20" v-if="isRadioMode" />
      <iMusicPlayer class="m-auto w-full md:w-max lg:ml-20" v-else />
    </div>
    <iRadioList
      class="z-20 block p-4 md:hidden fixed top-0 bottom-0 h-[calc(100dvh-64px)] bg-menu backdrop-blur-2xl"
      v-if="isRadioMode && isActivePlaylist"
    />
    <iLovePwa />

    <picture class="pointer-events-none fixed bottom-0 right-0 z-0">
      <source srcset="/images/flame-right.webp" media="(min-width: 768px)" />
      <img src="/images/flame-right-mobile.webp" alt="flame" loading="lazy" />
    </picture>

    <picture class="pointer-events-none fixed left-0 top-0 z-0 h-full md:h-fit">
      <source srcset="/images/flame-left.webp" media="(min-width: 768px)" />
      <img src="/images/flame-left-mobile.webp" alt="flame" loading="lazy" />
    </picture>
  </div>
</template>

<style>
@import './index.css';
</style>
