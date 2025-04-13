<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { useModal } from 'composables/useModal'
import { AudioSettings, iLovePwa, MusicPlayer, RadioList, RadioPlayer } from 'features'
import { BaseModal, ButtonWithIcon, iLamp, iNote, iPlaylist, iSettings, iStation } from 'shared/ui'
import { ref } from 'vue'

const isDarkTheme = useDark()
const toggleDark = useToggle(isDarkTheme)
const { isOpen, modalContent, openModal, closeModal } = useModal()

const isRadioMode = ref(true)
</script>

<template>
  <div
    class="flex min-h-svh w-full flex-col bg-light-100 text-blue-100 transition-colors dark:bg-dark-100 md:flex-row"
  >
    <aside
      class="flex flex-col z-10 w-full overflow-hidden px-4 md:h-screen md:w-96 md:min-w-[24rem]"
    >
      <div
        class="mb-4 w-full max-w-sm font-cyberpunk text-4xl text-black dark:text-white text-center"
      >
        Amazing radio
      </div>

      <RadioList v-if="isRadioMode" class="hidden md:block h-fit" />
      <div
        class="flex gap-4 items-center bg-menu p-2 fixed bottom-0 left-0 right-0"
      >
        <ButtonWithIcon label="theme" @click="toggleDark()">
          <iLamp />
        </ButtonWithIcon>
        <ButtonWithIcon label="playlist" @click="openModal(RadioList)">
          <iPlaylist />
        </ButtonWithIcon>
        <ButtonWithIcon :label="`${isRadioMode ? 'audio' : 'radio'} mode`" @click="isRadioMode = !isRadioMode">
          <iNote v-if="isRadioMode" />
          <iStation v-else />
        </ButtonWithIcon>
        <ButtonWithIcon label="settings" @click="openModal(AudioSettings)">
          <iSettings />
        </ButtonWithIcon>
      </div>
    </aside>

    <div class="flex z-10 h-full w-full md:h-screen md:px-4">
      <RadioPlayer v-if="isRadioMode" class="m-auto w-max lg:ml-20" />
      <MusicPlayer v-else class="m-auto w-full md:w-max lg:ml-20" />
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

    <BaseModal :is-open="!!isOpen" @close="closeModal">
      <component :is="modalContent" />
    </BaseModal>
  </div>
</template>

<style>
@import './index.css';
</style>
