<script setup lang="ts">
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowsUpDownIcon, ArrowUturnLeftIcon, BookmarkIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, PauseIcon, PlayIcon, SparklesIcon } from '@heroicons/vue/24/solid'
import { BaseButton, iSpin } from 'shared/ui'

export type RepeatMode = 'all' | 'off' | 'one'

const {
  isFavorites = false,
  isPlaying,
  isShuffle = false,
  loadingFavorites = false,
  loadingSimilarTracks = false,
  pending = false,
  playError = '',
  repeatMode = 'off',
  showLibraryControls = true,
} = defineProps<{
  isFavorites?: boolean
  isPlaying: boolean
  isShuffle?: boolean
  loadingFavorites?: boolean
  loadingSimilarTracks?: boolean
  pending?: boolean
  playError?: string
  repeatMode?: RepeatMode
  showLibraryControls?: boolean
}>()

const emit = defineEmits<{
  loadFavorites: []
  loadSimilarTracks: []
  nextFile: []
  openFiles: []
  prevFile: []
  seekBackward: []
  seekForward: []
  shuffleFiles: []
  togglePlayPause: []
  toggleRepeat: []
  undoLastSeek: []
}>()

const repeatLabel = {
  all: 'Repeat queue',
  off: 'Enable repeat',
  one: 'Repeat one track',
} as const
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div class="flex items-center gap-4">
      <BaseButton
        variant="player"
        label="Seek back 10 seconds"
        @click="emit('seekBackward')"
      >
        <span class="font-bold font-blackcraft">-10</span>
      </BaseButton>
      <BaseButton
        variant="player"
        label="Previous track"
        @click="emit('prevFile')"
      >
        <ChevronDoubleLeftIcon class="h-6 w-6" />
      </BaseButton>
      <BaseButton
        variant="player"
        class="size-14!"
        :class="{ 'text-red-500 dark:text-red-400': playError }"
        :disabled="pending"
        :label="playError || (pending ? 'Loading' : isPlaying ? 'Pause' : 'Play')"
        @click="emit('togglePlayPause')"
      >
        <iSpin v-if="pending" class="mr-0! h-10 w-10" />
        <PlayIcon v-else-if="!isPlaying" class="h-10 w-10" />
        <PauseIcon v-else class="h-10 w-10" />
      </BaseButton>
      <BaseButton
        variant="player"
        label="Next track"
        @click="emit('nextFile')"
      >
        <ChevronDoubleRightIcon class="h-6 w-6" />
      </BaseButton>
      <BaseButton
        variant="player"
        label="Seek forward 10 seconds"
        @click="emit('seekForward')"
      >
        <span class="font-bold font-blackcraft">+10</span>
      </BaseButton>
    </div>

    <div v-if="showLibraryControls" class="flex items-center gap-4">
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': isShuffle }"
        :label="isShuffle ? 'Disable shuffle' : 'Enable shuffle'"
        @click="emit('shuffleFiles')"
      >
        <div class="relative">
          <ArrowsUpDownIcon class="h-5 w-5" />
          <div
            v-if="isShuffle"
            class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"
          />
        </div>
      </BaseButton>
      <BaseButton
        variant="player"
        label="Open files"
        @click="emit('openFiles')"
      >
        <ArrowDownTrayIcon class="h-5 w-5" />
      </BaseButton>
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': repeatMode !== 'off' }"
        :label="repeatLabel[repeatMode]"
        @click="emit('toggleRepeat')"
      >
        <div class="relative">
          <ArrowPathIcon class="h-5 w-5" />
          <span
            v-if="repeatMode === 'one'"
            class="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-500 text-[9px] font-bold leading-none text-white"
          >
            1
          </span>
          <div
            v-else-if="repeatMode === 'all'"
            class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"
          />
        </div>
      </BaseButton>
      <BaseButton
        variant="player"
        label="Undo last seek"
        @click="emit('undoLastSeek')"
      >
        <ArrowUturnLeftIcon class="h-5 w-5" />
      </BaseButton>
    </div>

    <div v-else class="flex items-center gap-4">
      <BaseButton
        variant="player"
        label="Similar tracks after current"
        :disabled="loadingSimilarTracks"
        @click="emit('loadSimilarTracks')"
      >
        <SparklesIcon class="h-5 w-5" :class="{ 'animate-pulse': loadingSimilarTracks }" />
      </BaseButton>
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': isFavorites }"
        :disabled="loadingFavorites"
        label="Favorites"
        @click="emit('loadFavorites')"
      >
        <BookmarkIcon class="h-5 w-5" :class="{ 'animate-pulse': loadingFavorites }" />
      </BaseButton>
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': isShuffle }"
        :label="isShuffle ? 'Disable shuffle' : 'Enable shuffle'"
        @click="emit('shuffleFiles')"
      >
        <div class="relative">
          <ArrowsUpDownIcon class="h-5 w-5" />
          <div
            v-if="isShuffle"
            class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"
          />
        </div>
      </BaseButton>
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': repeatMode !== 'off' }"
        :label="repeatLabel[repeatMode]"
        @click="emit('toggleRepeat')"
      >
        <div class="relative">
          <ArrowPathIcon class="h-5 w-5" />
          <span
            v-if="repeatMode === 'one'"
            class="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-500 text-[9px] font-bold leading-none text-white"
          >
            1
          </span>
          <div
            v-else-if="repeatMode === 'all'"
            class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"
          />
        </div>
      </BaseButton>
    </div>
  </div>
</template>
