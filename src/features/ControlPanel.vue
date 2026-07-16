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
  <!--
    Mobile: horizontal dock at bottom.
    bottom + safe-area — выше жестов/навигации Android & iOS home indicator.
  -->
  <div
    class="z-50 flex w-fit items-center gap-1 rounded-xl border border-glass bg-glass p-1 shadow-lg shadow-top backdrop-blur-xl dark:border-glass-purple-border dark:bg-glass-purple max-md:fixed max-md:bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-md:left-1/2 max-md:-translate-x-1/2"
  >
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
</template>
