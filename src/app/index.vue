<script setup lang="ts">
import {
  iSidebar,
  iRadioPlayer,
  iMusicPlayer,
  iLovePwa,
  iRadioList,
} from 'features'
import { iButton, iStation, iNote } from 'shared/ui'
import { ref } from 'vue'

const isRadioMode = ref(true)
</script>

<template>
  <div
    class="flex min-h-svh w-full flex-col bg-light-100 text-blue-100 transition-colors dark:bg-dark-100 md:flex-row"
  >
    <iSidebar
      class="z-10 w-full overflow-hidden p-4 md:h-screen md:w-96 md:min-w-[24rem]"
    />
    <div class="z-10 flex h-full w-full md:h-screen md:px-4">
      <iButton
        class="absolute left-20 top-24 ml-auto h-12 w-12 rounded-full md:hidden"
        variant="control"
        @click="isRadioMode = !isRadioMode"
        aria-label="mode"
      >
        <iNote class="ml-[5px]" v-if="isRadioMode" />
        <iStation class="ml-[10px]" v-else />
      </iButton>
      <iRadioPlayer class="m-auto w-max lg:ml-20" v-if="isRadioMode" />

      <iMusicPlayer class="m-auto w-full md:w-max lg:ml-20" v-else />
    </div>
    <iRadioList class="z-20 -mt-52 block p-4 md:hidden" v-if="isRadioMode" />
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
