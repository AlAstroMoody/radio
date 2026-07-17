<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { useYt } from 'composables/useYt'
import { YT_CURATED_PLAYLISTS } from 'shared/types/yt'
import { computed, ref, useTemplateRef, watch } from 'vue'

const {
  activePlaylistId,
  clearSuggestions,
  fetchSuggestions,
  isLoading,
  isLoadingPlaylist,
  lastQuery,
  loadPlaylist,
  search,
  suggestions,
} = useYt()

const curatedTitles = new Set(YT_CURATED_PLAYLISTS.map(playlist => playlist.title))

const query = ref(
  lastQuery.value === 'Liked' || curatedTitles.has(lastQuery.value)
    ? ''
    : lastQuery.value,
)
const showSuggestions = ref(false)
const searchInput = useTemplateRef('searchInput')

const isBusy = computed(() => isLoading.value || isLoadingPlaylist.value)

const debouncedFetchSuggestions = useDebounceFn((value: string) => {
  void fetchSuggestions(value)
}, 250)

watch(lastQuery, (value) => {
  if (value === 'Liked' || curatedTitles.has(value) || activePlaylistId.value)
    return

  query.value = value
})

watch(query, (value) => {
  if (!showSuggestions.value)
    return

  void debouncedFetchSuggestions(value)
})

async function handlePlaylist(playlistId: string, title: string): Promise<void> {
  showSuggestions.value = false
  clearSuggestions()
  await loadPlaylist(playlistId, title)
}

async function handleSearch(): Promise<void> {
  showSuggestions.value = false
  clearSuggestions()
  await search(query.value)
}

function handleSearchBlur(): void {
  window.setTimeout(() => {
    showSuggestions.value = false
    clearSuggestions()
  }, 150)
}

function handleSearchFocus(): void {
  showSuggestions.value = true
  void debouncedFetchSuggestions(query.value)
}

function handleSearchKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    showSuggestions.value = false
    clearSuggestions()
    searchInput.value?.blur()
  }
}

async function handleSuggestionClick(suggestion: string): Promise<void> {
  query.value = suggestion
  showSuggestions.value = false
  clearSuggestions()
  await search(suggestion)
}
</script>

<template>
  <div class="relative shrink-0 px-2">
    <div class="flex gap-2">
      <input
        ref="searchInput"
        v-model="query"
        type="text"
        class="min-w-0 flex-1 rounded-lg border border-glass-purple-border bg-glass px-3 py-2 text-sm text-black dark:text-white"
        placeholder="Search YouTube Music"
        autocomplete="off"
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
        @keydown.enter="handleSearch"
        @keydown="handleSearchKeydown"
      >
      <button
        class="shrink-0 rounded-lg border border-glass-purple-border bg-glass-purple px-3 py-2 text-sm text-white disabled:opacity-60"
        :disabled="isBusy"
        @click="handleSearch"
      >
        {{ isBusy ? '...' : 'Search' }}
      </button>
    </div>

    <div class="mt-2 flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="playlist in YT_CURATED_PLAYLISTS"
        :key="playlist.id"
        type="button"
        class="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-60"
        :class="activePlaylistId === playlist.id
          ? 'border-purple-400 bg-purple-500/30 text-black dark:text-white'
          : 'border-glass-purple-border bg-glass text-black dark:bg-glass-purple/40 dark:text-white'"
        :disabled="isBusy"
        @click="handlePlaylist(playlist.id, playlist.title)"
      >
        {{ playlist.title }}
      </button>
    </div>

    <ul
      v-if="showSuggestions && suggestions.length"
      class="absolute left-2 right-2 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-light-100 bg-white shadow-lg dark:border-purple-500/50 dark:bg-dark-200"
    >
      <li
        v-for="suggestion in suggestions"
        :key="suggestion"
      >
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm text-dark-100 transition-colors hover:bg-light-100 dark:text-white dark:hover:bg-purple-500/20"
          @mousedown.prevent="handleSuggestionClick(suggestion)"
        >
          {{ suggestion }}
        </button>
      </li>
    </ul>
  </div>
</template>
