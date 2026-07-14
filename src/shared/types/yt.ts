export interface YtArtist {
  id?: string
  name?: string
}

export interface YtLikedPlaylist {
  author?: YtArtist
  id?: string
  trackCount?: number
  tracks: YtTrack[]
}

export interface YtRadioResponse {
  playlistId?: string
  tracks: YtTrack[]
  videoId: string
}

export interface YtSearchPage {
  continuation: null | string
  tracks: YtTrack[]
}

export interface YtSuggestResponse {
  suggestions: string[]
}

export interface YtThumbnail {
  height?: number
  url?: string
  width?: number
}

export interface YtTrack {
  album?: null | string
  artists?: YtArtist[]
  duration?: string
  duration_seconds?: number
  thumbnails?: YtThumbnail[]
  title?: string
  videoId?: string
}

export function formatYtArtists(track: undefined | YtTrack): string {
  return track?.artists?.map(artist => artist.name).filter(Boolean).join(', ') || 'Unknown artist'
}

export function formatYtTitle(track: undefined | YtTrack): string {
  return track?.title || 'Unknown title'
}

export function getYtThumbnailArtwork(track: undefined | YtTrack): MediaImage[] | undefined {
  const thumbnails = track?.thumbnails?.filter(thumbnail => thumbnail.url)
  if (!thumbnails?.length)
    return undefined

  return thumbnails.map((thumbnail) => {
    const image: MediaImage = { src: thumbnail.url! }

    if (thumbnail.width && thumbnail.height)
      image.sizes = `${thumbnail.width}x${thumbnail.height}`

    return image
  })
}

export function getYtThumbnailUrl(track: undefined | YtTrack, minSize = 0): string | undefined {
  const thumbnails = track?.thumbnails?.filter(thumbnail => thumbnail.url)
  if (!thumbnails?.length)
    return undefined

  const sorted = [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))

  if (minSize > 0) {
    const match = sorted.find(thumbnail => (thumbnail.width ?? 0) >= minSize)
    return match?.url ?? sorted[0]?.url
  }

  return sorted[0]?.url
}
