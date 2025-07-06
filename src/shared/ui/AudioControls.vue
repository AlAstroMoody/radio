<script setup lang="ts">
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowsUpDownIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, PauseIcon, PlayIcon } from '@heroicons/vue/24/solid'
import { BaseButton } from 'shared/ui'

defineProps<{
  isPlaying: boolean
  isRepeat: boolean
  isShuffle: boolean
  pending?: boolean
}>()

const emit = defineEmits<{
  nextFile: []
  openFiles: []
  prevFile: []
  seekBackward: []
  seekForward: []
  shuffleFiles: []
  togglePlayPause: []
  toggleRepeat: []
}>()
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <!-- Основные кнопки управления -->
    <div class="flex items-center gap-4">
      <BaseButton
        variant="player"
        @click="emit('seekBackward')"
      >
        <span class="font-bold">-10</span>
      </BaseButton>
      <BaseButton
        variant="player"
        @click="emit('prevFile')"
      >
        <ChevronDoubleLeftIcon class="h-6 w-6" />
      </BaseButton>
      <BaseButton
        variant="player"
        class="!size-14"
        :disabled="pending"
        @click="emit('togglePlayPause')"
      >
        <PlayIcon v-if="!isPlaying" class="h-10 w-10" />
        <PauseIcon v-else class="h-10 w-10" />
      </BaseButton>
      <BaseButton
        variant="player"
        @click="emit('nextFile')"
      >
        <ChevronDoubleRightIcon class="h-6 w-6" />
      </BaseButton>
      <BaseButton
        variant="player"
        @click="emit('seekForward')"
      >
        <span class="font-bold">+10</span>
      </BaseButton>
    </div>

    <!-- Дополнительные кнопки -->
    <div class="flex items-center gap-4">
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': isShuffle }"
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
        @click="emit('openFiles')"
      >
        <ArrowDownTrayIcon class="h-5 w-5" />
      </BaseButton>
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': isRepeat }"
        @click="emit('toggleRepeat')"
      >
        <div class="relative">
          <ArrowPathIcon class="h-5 w-5" />
          <div
            v-if="isRepeat"
            class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"
          />
        </div>
      </BaseButton>
    </div>
  </div>
</template>
