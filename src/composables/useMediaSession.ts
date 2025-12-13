// Интеграция с Media Session API: показывает информацию о треке в уведомлениях и на заблокированном экране,
// обрабатывает действия из уведомлений (play, pause, next, prev, seek)

import { ref } from 'vue'

export interface MediaMetadata {
  album?: string
  artist?: string
  artwork?: MediaImage[]
  title: string
}

export function useMediaSession(): {
  clearActionHandlers: () => void
  isSupported: import('vue').Ref<boolean>
  setActionHandlers: (handlers: {
    nexttrack?: () => void
    pause?: () => void
    play?: () => void
    previoustrack?: () => void
    seekbackward?: (details: MediaSessionActionDetails) => void
    seekforward?: (details: MediaSessionActionDetails) => void
  }) => void
  setMetadata: (metadata: MediaMetadata) => void
  setPlaybackState: (state: 'none' | 'paused' | 'playing') => void
  setPositionState: (positionState?: {
    duration?: number
    playbackRate?: number
    position?: number
  }) => void
} {
  const isSupported = ref(false)

  if ('mediaSession' in navigator) {
    isSupported.value = true
  }

  function setMetadata(metadata: MediaMetadata): void {
    if (!isSupported.value)
      return

    const mediaMetadata: any = {
      title: metadata.title,
    }

    if (metadata.artist) {
      mediaMetadata.artist = metadata.artist
    }
    if (metadata.album) {
      mediaMetadata.album = metadata.album
    }
    if (metadata.artwork) {
      mediaMetadata.artwork = metadata.artwork
    }
    else {
      mediaMetadata.artwork = [
        { sizes: '192x192', src: '/radio/favicon/android-chrome-192x192.png', type: 'image/png' },
        { sizes: '512x512', src: '/radio/favicon/android-chrome-512x512.png', type: 'image/png' },
      ]
    }

    navigator.mediaSession.metadata = new MediaMetadata(mediaMetadata)
  }

  function setPlaybackState(state: 'none' | 'paused' | 'playing'): void {
    if (!isSupported.value)
      return

    navigator.mediaSession.playbackState = state
  }

  function setPositionState(positionState?: {
    duration?: number
    playbackRate?: number
    position?: number
  }): void {
    if (!isSupported.value || !positionState)
      return

    navigator.mediaSession.setPositionState(positionState)
  }

  function setActionHandlers(handlers: {
    nexttrack?: () => void
    pause?: () => void
    play?: () => void
    previoustrack?: () => void
    seekbackward?: (details: MediaSessionActionDetails) => void
    seekforward?: (details: MediaSessionActionDetails) => void
    seekto?: (details: MediaSessionActionDetails) => void
  }): void {
    if (!isSupported.value)
      return

    if (handlers.nexttrack) {
      navigator.mediaSession.setActionHandler('nexttrack', handlers.nexttrack)
    }
    if (handlers.pause) {
      navigator.mediaSession.setActionHandler('pause', handlers.pause)
    }
    if (handlers.play) {
      navigator.mediaSession.setActionHandler('play', handlers.play)
    }
    if (handlers.previoustrack) {
      navigator.mediaSession.setActionHandler('previoustrack', handlers.previoustrack)
    }
    if (handlers.seekbackward) {
      navigator.mediaSession.setActionHandler('seekbackward', handlers.seekbackward)
    }
    if (handlers.seekforward) {
      navigator.mediaSession.setActionHandler('seekforward', handlers.seekforward)
    }
  }

  function clearActionHandlers(): void {
    if (!isSupported.value)
      return

    const actions: MediaSessionAction[] = [
      'play',
      'pause',
      'previoustrack',
      'nexttrack',
      'seekbackward',
      'seekforward',
    ]

    actions.forEach((action) => {
      navigator.mediaSession.setActionHandler(action, null)
    })
  }

  return {
    clearActionHandlers,
    isSupported,
    setActionHandlers,
    setMetadata,
    setPlaybackState,
    setPositionState,
  }
}
