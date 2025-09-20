<script setup lang="ts">
import { AdjustmentsVerticalIcon, ListBulletIcon, MusicalNoteIcon } from '@heroicons/vue/24/solid'
import { useModal } from 'composables/useModal'
import { useRadio } from 'composables/useRadio'
import { useTheme } from 'composables/useTheme'
import { AudioSettings, RadioList } from 'features'
import { ButtonWithIcon, iLamp, iStation } from 'shared/ui'

const { isRadioMode, toggleMode } = useRadio()

const { toggleDark } = useTheme()
const { openModal } = useModal()
</script>

<template>
  <div class="w-fit overflow-visible z-50 pb-safe mb-safe">
    <div class="flex gap-4 items-center p-1 rounded-tr-2xl border-r-0 border-b-0 bg-glass backdrop-blur-xl border border-glass shadow-lg shadow-top transition-all duration-300 dark:bg-glass-purple dark:border-glass-purple-border">
      <ButtonWithIcon label="theme" @click="toggleDark()">
        <iLamp />
      </ButtonWithIcon>
      <ButtonWithIcon label="playlist" @click="openModal(RadioList, { isRadioMode })">
        <ListBulletIcon class="size-6" />
      </ButtonWithIcon>
      <ButtonWithIcon :label="`${isRadioMode ? 'audio' : 'radio'} mode`" @click="toggleMode">
        <MusicalNoteIcon v-if="isRadioMode" class="size-6" />
        <iStation v-else />
      </ButtonWithIcon>
      <ButtonWithIcon label="settings" @click="openModal(AudioSettings)">
        <AdjustmentsVerticalIcon class="size-6" />
      </ButtonWithIcon>
    </div>
  </div>
</template>
