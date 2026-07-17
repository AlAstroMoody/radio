<script setup lang="ts">
import type { YtTrack } from 'shared/types/yt'

import { useScrollToActive } from 'composables/useScrollToActive'
import { useYt } from 'composables/useYt'
import { formatYtArtists, formatYtTitle, getYtThumbnailUrl } from 'shared/types/yt'
import { BaseButton, iNote, ListSkeleton } from 'shared/ui'
import { ref, useTemplateRef } from 'vue'

import YtSearchInput from './YtSearchInput.vue'

const {
  activeIndex,
  activeTrack,
  changeActiveTrack,
  error,
  hasMore,
  isLoading,
  isLoadingMore,
  loadMore,
  results,
} = useYt()

const failedThumbnailIds = ref(new Set<string>())
const buttonsContainer = useTemplateRef('buttonsContainer')
const scrollContainer = useTemplateRef('scrollContainer')

useScrollToActive({
  activeItem: activeTrack,
  buttonsContainer,
  findActiveIndex: (items: YtTrack[], active: undefined | YtTrack) =>
    items.findIndex(track => track.videoId === active?.videoId),
  items: results,
  scrollContainer,
})

function handleScroll(): void {
  const container = scrollContainer.value
  if (!container || !hasMore.value || isLoadingMore.value || isLoading.value)
    return

  const threshold = 80
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold)
    void loadMore()
}

function handleThumbnailError(videoId: string | undefined): void {
  if (!videoId || failedThumbnailIds.value.has(videoId))
    return

  failedThumbnailIds.value = new Set([videoId, ...failedThumbnailIds.value])
}

function handleTrackClick(index: number): void {
  changeActiveTrack(index)
}

function showThumbnail(track: YtTrack): boolean {
  if (!track.videoId)
    return false

  return !!trackThumbnail(track) && !failedThumbnailIds.value.has(track.videoId)
}

function trackThumbnail(track: YtTrack): string | undefined {
  return getYtThumbnailUrl(track, 60)
}
</script>

<template>
  <div class="font-medium flex h-full min-h-0 max-w-full flex-col overflow-hidden border-gray-200/50 p-4 dark:border-gray-600/50">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center shrink-0">
      youtube search
    </div>

    <YtSearchInput class="mb-3" />

    <p v-if="error" class="mb-2 shrink-0 px-2 text-center text-xs text-red-500">
      {{ error }}
    </p>
    <div v-else class="mb-2 shrink-0 px-2 text-center text-xs dark:text-white">
      {{ results.length ? 'select a track to play' : 'search, Liked or a playlist' }}
    </div>

    <div
      ref="scrollContainer"
      class="min-h-0 flex-1 overflow-auto overscroll-y-contain md:max-h-[600px]"
      @scroll="handleScroll"
    >
      <ListSkeleton v-if="isLoading && !results.length" with-thumb />
      <div
        v-else
        ref="buttonsContainer"
        class="flex flex-col gap-3 py-3 pl-2 pr-2 list-optimized"
      >
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

        <p
          v-if="!results.length && !isLoading && !error"
          class="px-4 py-8 text-center text-sm opacity-70 dark:text-white"
        >
          No tracks yet. Search, open Liked, or pick a playlist.
        </p>

        <button
          v-if="hasMore"
          type="button"
          class="mx-2 rounded-lg border border-glass-purple-border bg-glass px-3 py-2 text-sm text-black disabled:opacity-60 dark:bg-glass-purple/40 dark:text-white"
          :disabled="isLoadingMore"
          @click="loadMore"
        >
          {{ isLoadingMore ? 'Loading...' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>
