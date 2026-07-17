<script setup lang="ts">
import type { PlaybackMode } from 'stores/playback'

import { AdjustmentsVerticalIcon, ListBulletIcon, MusicalNoteIcon, RadioIcon } from '@heroicons/vue/24/solid'
import { usePlaylistFirstRunHint } from 'composables/usePlaylistFirstRunHint'
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
const { dismissHint, showHint } = usePlaylistFirstRunHint()

function openPlaylist(): void {
  dismissHint()
  emit('openPlaylist')
}

function setMode(next: PlaybackMode): void {
  playbackStore.setMode(next)
}
</script>

<template>
  <div
    class="z-50 flex w-fit items-center gap-2 rounded-xl border border-glass bg-glass p-1 shadow-lg shadow-top backdrop-blur-xl dark:border-glass-purple-border dark:bg-glass-purple max-md:fixed max-md:bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-md:left-1/2 max-md:-translate-x-1/2"
  >
    <ButtonWithIcon label="theme" @click="toggleDark()">
      <iLamp />
    </ButtonWithIcon>

    <div class="relative">
      <ButtonWithIcon label="playlist" @click="openPlaylist">
        <ListBulletIcon class="size-6" />
      </ButtonWithIcon>

      <Transition name="playlist-hint">
        <button
          v-if="showHint"
          type="button"
          class="absolute bottom-[calc(100%+0.6rem)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-glass bg-black px-3 py-2 text-left text-xs text-white shadow-lg dark:border-glass-purple-border md:hidden"
          aria-label="Open playlist. Tap to dismiss"
          @click.stop="openPlaylist"
        >
          Open playlist
          <span
            class="absolute left-1/2 top-full -translate-x-1/2"
            aria-hidden="true"
            style="border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #000;"
          />
        </button>
      </Transition>
    </div>

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

<style>
.playlist-hint-enter-active,
.playlist-hint-leave-active {
  transition: opacity 0.25s ease;
}

.playlist-hint-enter-from,
.playlist-hint-leave-to {
  opacity: 0;
}
</style>
