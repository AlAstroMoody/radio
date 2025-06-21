<script setup lang="ts">
import { AdjustmentsVerticalIcon, ListBulletIcon, MusicalNoteIcon } from '@heroicons/vue/24/solid'
import { useModal } from 'composables/useModal'
import { useTheme } from 'composables/useTheme'
import { AudioSettings, iLovePwa, MusicPlayer, RadioList, RadioPlayer } from 'features'
import { BaseModal, ButtonWithIcon, iLamp, iStation } from 'shared/ui'
import { onMounted, ref } from 'vue'

const { toggleDark } = useTheme()
const { closeModal, isOpen, modalContent, modalProps, openModal } = useModal()

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
      <RadioList class="hidden md:block h-fit" :is-radio-mode />
      <div
        class="flex gap-4 items-center bg-gray-100 dark:bg-menu p-2 fixed bottom-0 left-0 right-0 w-fit rounded-tr-2xl animate-slide-up shadow-card"
      >
        <ButtonWithIcon label="theme" @click="toggleDark()">
          <iLamp />
        </ButtonWithIcon>
        <ButtonWithIcon label="playlist" @click="openModal(RadioList, { isRadioMode })">
          <ListBulletIcon class="size-6" />
        </ButtonWithIcon>
        <ButtonWithIcon :label="`${isRadioMode ? 'audio' : 'radio'} mode`" @click=" isRadioMode = !isRadioMode">
          <MusicalNoteIcon v-if="isRadioMode" class="size-6" />
          <iStation v-else />
        </ButtonWithIcon>
        <ButtonWithIcon label="settings" @click="openModal(AudioSettings)">
          <AdjustmentsVerticalIcon class="size-6" />
        </ButtonWithIcon>
      </div>
    </aside>

    <div class="flex h-[calc(100dvh-144px)] md:h-[calc(100dvh-64px)] w-full z-[1]">
      <RadioPlayer v-if="isRadioMode" class="m-auto w-max mb-5 mt-auto" />
      <MusicPlayer v-else class="m-auto w-full md:w-max mb-3 mt-auto" />
      <AudioSettings class="mb-auto hidden xl:flex" />
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
      <component :is="modalContent" v-bind="modalProps" />
    </BaseModal>
  </div>
</template>

<style>
@import './index.css';
</style>
