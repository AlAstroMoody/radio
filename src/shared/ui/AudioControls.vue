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
  all: 'Повтор очереди',
  off: 'Включить повтор',
  one: 'Повтор одного трека',
} as const
</script>

<template>
  <div class="flex flex-col items-center" :class="showLibraryControls ? 'gap-4' : 'gap-2'">
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
      <div class="relative group">
        <BaseButton
          variant="player"
          class="size-14!"
          :class="{ 'text-red-500 dark:text-red-400': playError }"
          :disabled="pending"
          :label="playError || (pending ? 'Загрузка' : isPlaying ? 'Пауза' : 'Воспроизвести')"
          @click="emit('togglePlayPause')"
        >
          <iSpin v-if="pending" class="mr-0! h-10 w-10" />
          <PlayIcon v-else-if="!isPlaying" class="h-10 w-10" />
          <PauseIcon v-else class="h-10 w-10" />
        </BaseButton>
        <div
          v-if="playError"
          class="pointer-events-none absolute -top-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-sm text-white shadow-lg"
        >
          {{ playError }}
        </div>
      </div>
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
    <div v-if="showLibraryControls" class="flex items-center gap-4">
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
        label="Отменить последнюю перемотку"
        @click="emit('undoLastSeek')"
      >
        <ArrowUturnLeftIcon class="h-5 w-5" />
      </BaseButton>
    </div>

    <div v-else class="flex items-center gap-4">
      <BaseButton
        variant="player"
        label="Похожие треки после текущего"
        :disabled="loadingSimilarTracks"
        @click="emit('loadSimilarTracks')"
      >
        <SparklesIcon class="h-5 w-5" :class="{ 'animate-pulse': loadingSimilarTracks }" />
      </BaseButton>
      <BaseButton
        variant="player"
        :class="{ 'text-purple-500': isFavorites }"
        :disabled="loadingFavorites"
        label="Избранное"
        @click="emit('loadFavorites')"
      >
        <BookmarkIcon class="h-5 w-5" :class="{ 'animate-pulse': loadingFavorites }" />
      </BaseButton>
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
