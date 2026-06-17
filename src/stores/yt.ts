import type { YtTrack } from 'shared/types/yt'

import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const API_BASE = 'https://' + 'actepukc90' + '.' + 'fvds' + '.' + 'ru' + '/api/yt'

interface YtSearchPage {
  continuation: null | string
  tracks: YtTrack[]
}

function filterTracks(tracks: YtTrack[]): YtTrack[] {
  return tracks.filter(track => !!track.videoId)
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json() as { error?: string }
    if (data.error)
      return data.error
  }
  catch {}

  return `Request failed: ${response.status}`
}

export const useYtStore = defineStore('yt', () => {
  const results = useStorage<YtTrack[]>('yt-search-results', [])
  const activeIndex = useStorage<number>('yt-active-index', 0)
  const lastQuery = useStorage<string>('yt-last-query', '')
  const continuationToken = useStorage<null | string>('yt-search-continuation', null)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const error = ref('')

  const hasMore = computed(() => !!continuationToken.value)

  const activeTrack = computed<undefined | YtTrack>(() => {
    if (!results.value.length)
      return undefined

    const index = Math.min(Math.max(activeIndex.value, 0), results.value.length - 1)
    return results.value[index]
  })

  watch(results, (tracks) => {
    if (!tracks.length) {
      activeIndex.value = 0
      return
    }

    if (activeIndex.value >= tracks.length)
      activeIndex.value = tracks.length - 1
  })

  function getStreamUrl(videoId: string): string {
    return `${API_BASE}/stream?videoId=${encodeURIComponent(videoId)}`
  }

  function changeActiveTrack(index: number): void {
    if (index < 0 || index >= results.value.length)
      return

    activeIndex.value = index
  }

  function findNeighbour(offset: number): void {
    if (!results.value.length)
      return

    const index = results.value.findIndex(
      track => track.videoId === activeTrack.value?.videoId,
    )

    if (index === -1) {
      activeIndex.value = 0
      return
    }

    const nextIndex = index + offset
    if (nextIndex < 0) {
      activeIndex.value = results.value.length - 1
      return
    }

    if (nextIndex >= results.value.length) {
      activeIndex.value = 0
      return
    }

    activeIndex.value = nextIndex
  }

  function nextTrack(): void {
    findNeighbour(1)
  }

  function prevTrack(): void {
    findNeighbour(-1)
  }

  async function search(query: string): Promise<void> {
    const trimmed = query.trim()
    if (!trimmed) {
      error.value = 'Введите поисковый запрос'
      return
    }

    isLoading.value = true
    error.value = ''
    continuationToken.value = null

    try {
      const response = await fetch(
        `${API_BASE}/search?q=${encodeURIComponent(trimmed)}&paginated=1`,
      )
      if (!response.ok)
        throw new Error(await parseApiError(response))

      const data = await response.json() as YtSearchPage
      const tracks = filterTracks(data.tracks)
      const previousVideoId = activeTrack.value?.videoId

      results.value = tracks
      lastQuery.value = trimmed
      continuationToken.value = data.continuation ?? null

      if (previousVideoId) {
        const preservedIndex = tracks.findIndex(track => track.videoId === previousVideoId)
        activeIndex.value = preservedIndex >= 0 ? preservedIndex : 0
      }
      else {
        activeIndex.value = 0
      }
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка поиска'
    }
    finally {
      isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!continuationToken.value || isLoadingMore.value || isLoading.value)
      return

    isLoadingMore.value = true
    error.value = ''

    try {
      const response = await fetch(
        `${API_BASE}/search/continue?continuation=${encodeURIComponent(continuationToken.value)}`,
      )
      if (!response.ok)
        throw new Error(await parseApiError(response))

      const data = await response.json() as YtSearchPage
      const existingIds = new Set(results.value.map(track => track.videoId))
      const newTracks = filterTracks(data.tracks).filter(track => !existingIds.has(track.videoId))

      results.value = [...results.value, ...newTracks]
      continuationToken.value = data.continuation ?? null
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка подгрузки'
    }
    finally {
      isLoadingMore.value = false
    }
  }

  return {
    activeIndex,
    activeTrack,
    changeActiveTrack,
    continuationToken,
    error,
    getStreamUrl,
    hasMore,
    isLoading,
    isLoadingMore,
    lastQuery,
    loadMore,
    nextTrack,
    prevTrack,
    results,
    search,
  }
})
