import type { YtTrack } from 'shared/types/yt'
import type { ComputedRef, Ref } from 'vue'

import { storeToRefs } from 'pinia'
import { useYtStore } from 'stores'

interface UseYtReturn {
  activeIndex: Ref<number>
  activeTrack: ComputedRef<undefined | YtTrack>
  changeActiveTrack: (index: number) => void
  error: Ref<string>
  hasMore: ComputedRef<boolean>
  isLoading: Ref<boolean>
  isLoadingMore: Ref<boolean>
  lastQuery: Ref<string>
  loadMore: () => Promise<void>
  nextTrack: () => void
  prevTrack: () => void
  results: Ref<YtTrack[]>
  search: (query: string) => Promise<void>
}

let ytInstance: null | UseYtReturn = null

export function useYt(): UseYtReturn {
  if (ytInstance)
    return ytInstance

  const ytStore = useYtStore()
  const {
    activeIndex,
    activeTrack,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    lastQuery,
    results,
  } = storeToRefs(ytStore)

  ytInstance = {
    activeIndex,
    activeTrack,
    changeActiveTrack: ytStore.changeActiveTrack,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    lastQuery,
    loadMore: ytStore.loadMore,
    nextTrack: ytStore.nextTrack,
    prevTrack: ytStore.prevTrack,
    results,
    search: ytStore.search,
  }

  return ytInstance
}
