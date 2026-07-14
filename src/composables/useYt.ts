import type { YtTrack } from 'shared/types/yt'
import type { ComputedRef, Ref } from 'vue'

import { storeToRefs } from 'pinia'
import { useYtStore } from 'stores'

interface UseYtReturn {
  activeIndex: Ref<number>
  activeTrack: ComputedRef<undefined | YtTrack>
  changeActiveTrack: (index: number) => void
  clearSuggestions: () => void
  ensureDefaultSearch: () => Promise<void>
  error: Ref<string>
  fetchSuggestions: (query: string) => Promise<void>
  hasMore: ComputedRef<boolean>
  isLoading: Ref<boolean>
  isLoadingMore: Ref<boolean>
  isLoadingRadio: Ref<boolean>
  isLoadingSuggestions: Ref<boolean>
  lastQuery: Ref<string>
  loadLiked: () => Promise<void>
  loadMore: () => Promise<void>
  loadSimilarTracks: () => Promise<boolean>
  nextTrack: () => Promise<void>
  prevTrack: () => void
  results: Ref<YtTrack[]>
  search: (query: string) => Promise<void>
  suggestions: Ref<string[]>
}

export function useYt(): UseYtReturn {
  const ytStore = useYtStore()
  const {
    activeIndex,
    activeTrack,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    isLoadingRadio,
    isLoadingSuggestions,
    lastQuery,
    results,
    suggestions,
  } = storeToRefs(ytStore)

  return {
    activeIndex,
    activeTrack,
    changeActiveTrack: ytStore.changeActiveTrack,
    clearSuggestions: ytStore.clearSuggestions,
    ensureDefaultSearch: ytStore.ensureDefaultSearch,
    error,
    fetchSuggestions: ytStore.fetchSuggestions,
    hasMore,
    isLoading,
    isLoadingMore,
    isLoadingRadio,
    isLoadingSuggestions,
    lastQuery,
    loadLiked: ytStore.loadLiked,
    loadMore: ytStore.loadMore,
    loadSimilarTracks: ytStore.loadSimilarTracks,
    nextTrack: ytStore.nextTrack,
    prevTrack: ytStore.prevTrack,
    results,
    search: ytStore.search,
    suggestions,
  }
}
