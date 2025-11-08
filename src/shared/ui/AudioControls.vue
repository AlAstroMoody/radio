<script setup lang="ts">
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowsUpDownIcon, ArrowUturnLeftIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, PauseIcon, PlayIcon } from '@heroicons/vue/24/solid'
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
  undoLastSeek: []
}>()
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <!-- Основные кнопки управления -->
    <div class="flex items-center gap-4">
      <BaseButton
        variant="player"
        label="Перемотать назад на 10 секунд"
        @click="emit('seekBackward')"
      >
        <span class="font-bold font-blackcraft">-10</span>
      </BaseButton>
      <BaseButton
        variant="player"
        label="Предыдущий трек"
        @click="emit('prevFile')"
      >
        <ChevronDoubleLeftIcon class="h-6 w-6" />
      </BaseButton>
      <BaseButton
        variant="player"
        class="!size-14"
        :disabled="pending"
        :label="isPlaying ? 'Пауза' : 'Воспроизвести'"
        @click="emit('togglePlayPause')"
      >
        <PlayIcon v-if="!isPlaying" class="h-10 w-10" />
        <PauseIcon v-else class="h-10 w-10" />
      </BaseButton>
      <BaseButton
        variant="player"
        label="Следующий трек"
        @click="emit('nextFile')"
      >
        <ChevronDoubleRightIcon class="h-6 w-6" />
      </BaseButton>
      <BaseButton
        variant="player"
        label="Перемотать вперёд на 10 секунд"
        @click="emit('seekForward')"
      >
        <span class="font-bold font-blackcraft">+10</span>
      </BaseButton>
    </div>

    <!-- Дополнительные кнопки -->
    <div class="flex items-center gap-4">
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': isShuffle }"
        :label="isShuffle ? 'Отключить случайный порядок' : 'Включить случайный порядок'"
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
        label="Открыть файлы"
        @click="emit('openFiles')"
      >
        <ArrowDownTrayIcon class="h-5 w-5" />
      </BaseButton>
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': isRepeat }"
        :label="isRepeat ? 'Отключить повтор' : 'Включить повтор'"
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
      <BaseButton
        variant="player"
        label="Отменить последнюю перемотку"
        @click="emit('undoLastSeek')"
      >
        <ArrowUturnLeftIcon class="h-5 w-5" />
      </BaseButton>
    </div>
  </div>
</template>
