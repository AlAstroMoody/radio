import type { YtLikedPlaylist, YtPlaylistResponse, YtRadioResponse, YtSearchPage, YtSuggestResponse, YtTrack } from 'shared/types/yt'

import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const API_BASE = (import.meta.env.VITE_APP_API_URL as string | undefined)?.replace(/\/$/, '')
  || ('https://' + 'actepukc90' + '.' + 'fvds' + '.' + 'ru' + '/api/yt')
const RADIO_TRACK_LIMIT = 25
const PLAYLIST_TRACK_LIMIT = 100

interface YtPlaybackPosition {
  position: number
  videoId: string
}

function filterTracks(tracks: YtTrack[]): YtTrack[] {
  return tracks.filter(track => !!track.videoId)
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json() as { code?: string, error?: string }
    if (data.error)
      return data.error

    if (data.code === 'expired')
      return 'Stream expired'
    if (data.code === 'unavailable')
      return 'Track unavailable'
    if (data.code === 'geo')
      return 'Not available in region'
    if (data.code === 'upstream')
      return 'Upstream error'
  }
  catch { }

  if (response.status === 503)
    return 'Auth not configured on the backend'

  if (response.status === 500)
    return 'YouTube Music / auth error'

  return `Request failed: ${response.status}`
}

export const useYtStore = defineStore('yt', () => {
  const results = useStorage<YtTrack[]>('yt-search-results', [])
  const activeIndex = useStorage<number>('yt-active-index', 0)
  const lastQuery = useStorage<string>('yt-last-query', '')
  const continuationToken = useStorage<null | string>('yt-search-continuation', null)
  const playbackPosition = useStorage<null | YtPlaybackPosition>('yt-playback-position', null)
  const isLoading = ref(false)
  const isLoadingLiked = ref(false)
  const isLoadingMore = ref(false)
  const isLoadingPlaylist = ref(false)
  const isLoadingRadio = ref(false)
  const isLoadingSuggestions = ref(false)
  const isShuffle = ref(false)
  const isRepeat = ref(false)
  const originalResults = ref<YtTrack[]>([])
  const activePlaylistId = ref<null | string>(null)
  const suggestions = ref<string[]>([])
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

  function replaceResults(tracks: YtTrack[]): void {
    if (isShuffle.value) {
      isShuffle.value = false
      originalResults.value = []
    }

    const previousVideoId = activeTrack.value?.videoId

    results.value = tracks

    if (previousVideoId) {
      const preservedIndex = tracks.findIndex(track => track.videoId === previousVideoId)
      activeIndex.value = preservedIndex >= 0 ? preservedIndex : 0
      return
    }

    activeIndex.value = 0
  }

  function clearActivePlaylist(): void {
    activePlaylistId.value = null
  }
  function getStreamUrl(videoId: string): string {
    return `${API_BASE}/stream?videoId=${encodeURIComponent(videoId)}`
  }

  function changeActiveTrack(index: number): void {
    if (index < 0 || index >= results.value.length)
      return

    activeIndex.value = index
  }

  function clearPlaybackPosition(): void {
    playbackPosition.value = null
  }

  function getPlaybackPosition(videoId: string): number {
    if (playbackPosition.value?.videoId !== videoId)
      return 0

    return playbackPosition.value.position
  }

  function savePlaybackPosition(videoId: string, position: number): void {
    if (!videoId || position < 0)
      return

    playbackPosition.value = { position, videoId }
  }

  function getActiveTrackIndex(): number {
    return results.value.findIndex(track => track.videoId === activeTrack.value?.videoId)
  }

  async function insertSimilarTracksAfterActive(videoId: string): Promise<boolean> {
    if (isLoadingRadio.value)
      return false

    const index = getActiveTrackIndex()
    if (index === -1)
      return false

    isLoadingRadio.value = true

    try {
      const response = await fetch(
        `${API_BASE}/radio?videoId=${encodeURIComponent(videoId)}&limit=${RADIO_TRACK_LIMIT}`,
      )
      if (!response.ok)
        throw new Error(await parseApiError(response))

      const data = await response.json() as YtRadioResponse
      const existingIds = new Set(results.value.map(track => track.videoId))
      const newTracks = filterTracks(data.tracks)
        .filter(track => track.videoId !== videoId && !existingIds.has(track.videoId))

      if (!newTracks.length)
        return false

      const updated = [...results.value]
      updated.splice(index + 1, 0, ...newTracks)
      results.value = updated
      return true
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load radio'
      return false
    }
    finally {
      isLoadingRadio.value = false
    }
  }

  async function nextTrack(): Promise<void> {
    if (!results.value.length)
      return

    const index = getActiveTrackIndex()
    if (index === -1) {
      activeIndex.value = 0
      return
    }

    const nextIndex = index + 1
    if (nextIndex < results.value.length) {
      activeIndex.value = nextIndex
      return
    }

    if (isRepeat.value) {
      activeIndex.value = 0
      return
    }

    if (continuationToken.value) {
      await loadMore()
      if (nextIndex < results.value.length) {
        activeIndex.value = nextIndex
        return
      }
    }

    const seedVideoId = activeTrack.value?.videoId
    if (seedVideoId && await insertSimilarTracksAfterActive(seedVideoId)) {
      activeIndex.value = nextIndex
      return
    }

    activeIndex.value = 0
  }

  function prevTrack(): void {
    if (!results.value.length)
      return

    const index = getActiveTrackIndex()
    if (index === -1) {
      activeIndex.value = 0
      return
    }

    activeIndex.value = index > 0 ? index - 1 : results.value.length - 1
  }

  async function fetchSuggestions(query: string): Promise<void> {
    const trimmed = query.trim()
    if (!trimmed) {
      suggestions.value = []
      return
    }

    isLoadingSuggestions.value = true

    try {
      const response = await fetch(`${API_BASE}/suggest?q=${encodeURIComponent(trimmed)}`)
      if (!response.ok)
        throw new Error(await parseApiError(response))

      const data = await response.json() as YtSuggestResponse
      suggestions.value = data.suggestions ?? []
    }
    catch {
      suggestions.value = []
    }
    finally {
      isLoadingSuggestions.value = false
    }
  }

  function clearSuggestions(): void {
    suggestions.value = []
  }

  async function search(query: string): Promise<void> {
    const trimmed = query.trim()
    if (!trimmed) {
      error.value = 'Enter a search query'
      return
    }

    isLoading.value = true
    error.value = ''
    continuationToken.value = null
    clearActivePlaylist()
    clearSuggestions()

    try {
      const response = await fetch(
        `${API_BASE}/search?q=${encodeURIComponent(trimmed)}&paginated=1`,
      )
      if (!response.ok)
        throw new Error(await parseApiError(response))

      const data = await response.json() as YtSearchPage
      const tracks = filterTracks(data.tracks)

      replaceResults(tracks)
      lastQuery.value = trimmed
      continuationToken.value = data.continuation ?? null
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Search failed'
    }
    finally {
      isLoading.value = false
    }
  }

  function toggleRepeat(): void {
    isRepeat.value = !isRepeat.value
  }

  function shuffleTracks(): void {
    if (!results.value.length)
      return

    if (!isShuffle.value) {
      originalResults.value = [...results.value]
      const currentVideoId = activeTrack.value?.videoId
      const shuffled = [...results.value].sort(() => Math.random() - 0.5)
      results.value = shuffled

      if (currentVideoId) {
        const newIndex = shuffled.findIndex(track => track.videoId === currentVideoId)
        activeIndex.value = newIndex >= 0 ? newIndex : 0
      }
      else {
        activeIndex.value = 0
      }

      isShuffle.value = true
    }
    else {
      const currentVideoId = activeTrack.value?.videoId
      results.value = [...originalResults.value]

      if (currentVideoId) {
        const restoredIndex = results.value.findIndex(track => track.videoId === currentVideoId)
        activeIndex.value = restoredIndex >= 0
          ? restoredIndex
          : Math.min(activeIndex.value, results.value.length - 1)
      }
      else {
        activeIndex.value = Math.min(activeIndex.value, results.value.length - 1)
      }

      isShuffle.value = false
    }
  }

  async function loadPlaylist(playlistId: string, title?: string): Promise<void> {
    const id = playlistId.trim()
    if (!id || isLoadingPlaylist.value)
      return

    isLoadingPlaylist.value = true
    error.value = ''
    continuationToken.value = null
    clearSuggestions()

    try {
      const response = await fetch(
        `${API_BASE}/playlist?id=${encodeURIComponent(id)}&limit=${PLAYLIST_TRACK_LIMIT}`,
      )
      if (!response.ok)
        throw new Error(await parseApiError(response))

      const data = await response.json() as YtPlaylistResponse
      const tracks = filterTracks(data.tracks ?? [])

      if (!tracks.length) {
        error.value = 'Playlist is empty'
        return
      }

      replaceResults(tracks)
      activePlaylistId.value = data.id || id
      lastQuery.value = title?.trim() || data.title || id
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load playlist'
    }
    finally {
      isLoadingPlaylist.value = false
    }
  }

  async function loadLiked(): Promise<void> {
    if (isLoadingLiked.value)
      return

    isLoadingLiked.value = true
    error.value = ''
    continuationToken.value = null
    clearActivePlaylist()
    clearSuggestions()

    try {
      const response = await fetch(`${API_BASE}/liked`)
      if (!response.ok)
        throw new Error(await parseApiError(response))

      const data = await response.json() as YtLikedPlaylist
      const tracks = filterTracks(data.tracks ?? [])

      if (!tracks.length) {
        error.value = 'Liked is empty'
        return
      }

      replaceResults(tracks)
      lastQuery.value = 'Liked'
      shuffleTracks()
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load Liked'
    }
    finally {
      isLoadingLiked.value = false
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
      error.value = e instanceof Error ? e.message : 'Failed to load more'
    }
    finally {
      isLoadingMore.value = false
    }
  }

  async function loadSimilarTracks(): Promise<boolean> {
    const videoId = activeTrack.value?.videoId
    if (!videoId)
      return false

    const added = await insertSimilarTracksAfterActive(videoId)
    if (!added && !error.value)
      error.value = 'No similar tracks found'

    return added
  }

  async function ensureDefaultSearch(): Promise<void> {
    if (lastQuery.value || results.value.length || isLoading.value || isLoadingLiked.value)
      return

    await loadLiked()
  }

  return {
    activeIndex,
    activePlaylistId,
    activeTrack,
    changeActiveTrack,
    clearPlaybackPosition,
    clearSuggestions,
    continuationToken,
    ensureDefaultSearch,
    error,
    fetchSuggestions,
    getPlaybackPosition,
    getStreamUrl,
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
    loadLiked,
    loadMore,
    loadPlaylist,
    loadSimilarTracks,
    nextTrack,
    prevTrack,
    results,
    savePlaybackPosition,
    search,
    shuffleTracks,
    suggestions,
    toggleRepeat,
  }
})
