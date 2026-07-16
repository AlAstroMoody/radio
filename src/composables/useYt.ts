import type { YtTrack } from 'shared/types/yt'
import type { ComputedRef, Ref } from 'vue'

import { storeToRefs } from 'pinia'
import { useYtStore } from 'stores'

interface UseYtReturn {
  activeIndex: Ref<number>
  activePlaylistId: Ref<null | string>
  activeTrack: ComputedRef<undefined | YtTrack>
  changeActiveTrack: (index: number) => void
  clearSuggestions: () => void
  ensureDefaultSearch: () => Promise<void>
  error: Ref<string>
  fetchSuggestions: (query: string) => Promise<void>
  hasMore: ComputedRef<boolean>
  isLoading: Ref<boolean>
  isLoadingLiked: Ref<boolean>
  isLoadingMore: Ref<boolean>
  isLoadingPlaylist: Ref<boolean>
  isLoadingRadio: Ref<boolean>
  isLoadingSuggestions: Ref<boolean>
  isRepeat: Ref<boolean>
  isShuffle: Ref<boolean>
  lastQuery: Ref<string>
  loadLiked: () => Promise<void>
  loadMore: () => Promise<void>
  loadPlaylist: (playlistId: string, title?: string) => Promise<void>
  loadSimilarTracks: () => Promise<boolean>
  nextTrack: () => Promise<void>
  prevTrack: () => void
  results: Ref<YtTrack[]>
  search: (query: string) => Promise<void>
  shuffleTracks: () => void
  suggestions: Ref<string[]>
  toggleRepeat: () => void
}

export function useYt(): UseYtReturn {
  const ytStore = useYtStore()
  const {
    activeIndex,
    activePlaylistId,
    activeTrack,
    error,
    hasMore,
    isLoading,
    isLoadingLiked,
    isLoadingMore,
    isLoadingPlaylist,
    isLoadingRadio,
    isLoadingSuggestions,
    isRepeat,
    isShuffle,
    lastQuery,
    results,
    suggestions,
  } = storeToRefs(ytStore)

  return {
    activeIndex,
    activePlaylistId,
    activeTrack,
    changeActiveTrack: ytStore.changeActiveTrack,
    clearSuggestions: ytStore.clearSuggestions,
    ensureDefaultSearch: ytStore.ensureDefaultSearch,
    error,
    fetchSuggestions: ytStore.fetchSuggestions,
    hasMore,
    isLoading,
    isLoadingLiked,
    isLoadingMore,
    isLoadingPlaylist,
    isLoadingRadio,
    isLoadingSuggestions,
    isRepeat,
    isShuffle,
    lastQuery,
    loadLiked: ytStore.loadLiked,
    loadMore: ytStore.loadMore,
    loadPlaylist: ytStore.loadPlaylist,
    loadSimilarTracks: ytStore.loadSimilarTracks,
    nextTrack: ytStore.nextTrack,
    prevTrack: ytStore.prevTrack,
    results,
    search: ytStore.search,
    shuffleTracks: ytStore.shuffleTracks,
    suggestions,
    toggleRepeat: ytStore.toggleRepeat,
  }
}
