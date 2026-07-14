<script setup lang="ts">
import type { PlaybackMode } from 'stores/playback'

import { AdjustmentsVerticalIcon, ListBulletIcon, MusicalNoteIcon, RadioIcon } from '@heroicons/vue/24/solid'
import { useTheme } from 'composables/useTheme'
import { storeToRefs } from 'pinia'
import { ButtonWithIcon, iLamp, iNote } from 'shared/ui'
import { usePlaybackStore } from 'stores'

const emit = defineEmits<{
  openAudioSettings: []
  openPlaylist: []
}>()

const { toggleDark } = useTheme()
const playbackStore = usePlaybackStore()
const { mode } = storeToRefs(playbackStore)

function setMode(next: PlaybackMode): void {
  playbackStore.setMode(next)
}
</script>

<template>
  <div class="w-fit overflow-visible z-50 pb-safe mb-safe">
    <div class="flex flex-wrap gap-2 items-center p-1 rounded-br-2xl md:rounded-br-none md:rounded-tr-2xl border-l-0 md:border-b-0 bg-glass backdrop-blur-xl border border-glass shadow-lg shadow-top transition-all duration-300 dark:bg-glass-purple dark:border-glass-purple-border">
      <ButtonWithIcon label="theme" @click="toggleDark()">
        <iLamp />
      </ButtonWithIcon>
      <ButtonWithIcon label="playlist" @click="emit('openPlaylist')">
        <ListBulletIcon class="size-6" />
      </ButtonWithIcon>
      <ButtonWithIcon
        label="music"
        :active="mode === 'music'"
        @click="setMode('music')"
      >
        <MusicalNoteIcon class="size-6" />
      </ButtonWithIcon>
      <ButtonWithIcon
        label="radio"
        :active="mode === 'radio'"
        @click="setMode('radio')"
      >
        <RadioIcon class="size-6" />
      </ButtonWithIcon>
      <ButtonWithIcon
        label="yt"
        :active="mode === 'yt'"
        @click="setMode('yt')"
      >
        <iNote />
      </ButtonWithIcon>
      <ButtonWithIcon label="settings" @click="emit('openAudioSettings')">
        <AdjustmentsVerticalIcon class="size-6" />
      </ButtonWithIcon>
    </div>
  </div>
</template>
