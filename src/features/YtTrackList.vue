<script setup lang="ts">
import type { YtTrack } from 'shared/types/yt'

import { useScrollToActive } from 'composables/useScrollToActive'
import { useYt } from 'composables/useYt'
import { formatYtArtists, formatYtTitle, getYtThumbnailUrl } from 'shared/types/yt'
import { BaseButton, iNote } from 'shared/ui'
import { ref, useTemplateRef, watch } from 'vue'

const {
  activeIndex,
  activeTrack,
  changeActiveTrack,
  error,
  hasMore,
  isLoading,
  isLoadingMore,
  lastQuery,
  loadMore,
  results,
  search,
} = useYt()

const query = ref(lastQuery.value)
const failedThumbnailIds = ref(new Set<string>())
const buttonsContainer = useTemplateRef('buttonsContainer')
const scrollContainer = useTemplateRef('scrollContainer')

watch(lastQuery, (value) => {
  query.value = value
})

useScrollToActive({
  activeItem: activeTrack,
  buttonsContainer,
  findActiveIndex: (items: YtTrack[], active: undefined | YtTrack) =>
    items.findIndex(track => track.videoId === active?.videoId),
  items: results,
  scrollContainer,
})

function handleTrackClick(index: number): void {
  changeActiveTrack(index)
}

function trackThumbnail(track: YtTrack): string | undefined {
  return getYtThumbnailUrl(track, 60)
}

function showThumbnail(track: YtTrack): boolean {
  if (!track.videoId)
    return false

  return !!trackThumbnail(track) && !failedThumbnailIds.value.has(track.videoId)
}

function handleThumbnailError(videoId: string | undefined): void {
  if (!videoId || failedThumbnailIds.value.has(videoId))
    return

  failedThumbnailIds.value = new Set([...failedThumbnailIds.value, videoId])
}

async function handleSearch(): Promise<void> {
  await search(query.value)
}

function handleScroll(): void {
  const container = scrollContainer.value
  if (!container || !hasMore.value || isLoadingMore.value || isLoading.value)
    return

  const threshold = 80
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold)
    void loadMore()
}
</script>

<template>
  <div class="font-medium flex h-full min-h-0 max-w-full flex-col overflow-hidden border-gray-200/50 p-4 px-1 shadow-lg shadow-right dark:border-gray-600/50 dark:shadow-xl md:px-5">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center shrink-0">
      youtube search
    </div>

    <div class="mb-3 flex shrink-0 gap-2 px-2">
      <input
        v-model="query"
        type="text"
        class="min-w-0 flex-1 rounded-lg border border-glass-purple-border bg-glass px-3 py-2 text-sm text-black dark:text-white"
        placeholder="Искать в YouTube Music"
        @keydown.enter="handleSearch"
      >
      <button
        class="shrink-0 rounded-lg border border-glass-purple-border bg-glass-purple px-3 py-2 text-sm text-white disabled:opacity-60"
        :disabled="isLoading"
        @click="handleSearch"
      >
        {{ isLoading ? '...' : 'Search' }}
      </button>
    </div>

    <p v-if="error" class="mb-2 shrink-0 px-2 text-center text-xs text-red-500">
      {{ error }}
    </p>
    <div v-else class="mb-2 shrink-0 px-2 text-center text-xs">
      {{ results.length ? 'select a track to play' : 'search for music' }}
    </div>

    <div
      ref="scrollContainer"
      class="min-h-0 flex-1 overflow-auto overscroll-y-contain md:max-h-[600px]"
      @scroll="handleScroll"
    >
      <div ref="buttonsContainer" class="flex flex-col gap-3 py-3 pl-2 pr-2 list-optimized">
        <BaseButton
          v-for="(track, index) in results"
          :key="track.videoId"
          :label="formatYtTitle(track)"
          variant="list"
          class="relative flex max-w-full items-center gap-1"
          :active="index === activeIndex"
          @click="handleTrackClick(index)"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <img
              v-if="showThumbnail(track)"
              :src="trackThumbnail(track)"
              alt=""
              class="size-10 shrink-0 rounded object-cover"
              loading="lazy"
              @error="handleThumbnailError(track.videoId)"
            >
            <span
              v-else
              class="flex size-10 shrink-0 items-center justify-center rounded bg-glass/40 dark:bg-glass-purple/30"
              aria-hidden="true"
            >
              <iNote class="size-6 opacity-80" />
            </span>
            <div class="min-w-0 text-left">
              <div class="truncate">
                {{ formatYtTitle(track) }}
              </div>
              <div class="truncate text-xs opacity-80">
                {{ formatYtArtists(track) }}
                <span v-if="track.duration" class="opacity-70"> · {{ track.duration }}</span>
              </div>
            </div>
          </div>
        </BaseButton>

        <button
          v-if="hasMore"
          type="button"
          class="mx-2 rounded-lg border border-glass-purple-border bg-glass px-3 py-2 text-sm text-black disabled:opacity-60 dark:bg-glass-purple/40 dark:text-white"
          :disabled="isLoadingMore"
          @click="loadMore"
        >
          {{ isLoadingMore ? 'Загрузка...' : 'Загрузить ещё' }}
        </button>
      </div>
    </div>
  </div>
</template>
