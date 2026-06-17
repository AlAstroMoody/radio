<script setup lang="ts">
import { AdjustmentsVerticalIcon, ListBulletIcon, MusicalNoteIcon, RadioIcon } from '@heroicons/vue/24/solid'
import { useRadio } from 'composables/useRadio'
import { useTheme } from 'composables/useTheme'
import { usePlaybackStore } from 'stores'
import { ButtonWithIcon, iLamp, iStation } from 'shared/ui'

const emit = defineEmits<{
  openAudioSettings: []
  openPlaylist: []
}>()
const { isRadioMode, toggleMode } = useRadio()
const { toggleDark } = useTheme()
const playbackStore = usePlaybackStore()
</script>

<template>
  <div class="w-fit overflow-visible z-50 pb-safe mb-safe">
    <div class="flex flex-wrap gap-4 items-center p-1 rounded-br-2xl md:rounded-br-none md:rounded-tr-2xl border-l-0 md:border-b-0 bg-glass backdrop-blur-xl border border-glass shadow-lg shadow-top transition-all duration-300 dark:bg-glass-purple dark:border-glass-purple-border">
      <ButtonWithIcon label="theme" @click="toggleDark()">
        <iLamp />
      </ButtonWithIcon>
      <ButtonWithIcon label="playlist" @click="emit('openPlaylist')">
        <ListBulletIcon class="size-6" />
      </ButtonWithIcon>
      <ButtonWithIcon :label="`${isRadioMode ? 'audio' : 'radio'} mode`" @click="toggleMode">
        <MusicalNoteIcon v-if="isRadioMode" class="size-6" />
        <iStation v-else />
      </ButtonWithIcon>
      <ButtonWithIcon label="yt mode" @click="playbackStore.setMode('yt')">
        <RadioIcon class="size-6" />
      </ButtonWithIcon>
      <ButtonWithIcon label="settings" @click="emit('openAudioSettings')">
        <AdjustmentsVerticalIcon class="size-6" />
      </ButtonWithIcon>
    </div>
  </div>
</template>
