import type { Ref } from 'vue'

import { useStorage } from '@vueuse/core'
import { ref } from 'vue'

interface AudioPosition {
  name: string
  position: number
  timestamp: number
}

const MAX_POSITIONS = 10
const positions = useStorage<AudioPosition[]>('audioPositions', [])

export function useAudioPosition(audio: Ref<HTMLAudioElement | undefined>, fileName: Ref<string>): {
  clearPosition: () => void
  restorePosition: () => void
  savePosition: () => void
  setTrackName: (name: string) => void
} {
  const currentTrackName = ref(fileName.value)

  function savePosition(): void {
    if (!audio.value || !currentTrackName.value)
      return

    const existingIndex = positions.value.findIndex(p => p.name === currentTrackName.value)
    const newPosition = {
      name: currentTrackName.value,
      position: audio.value.currentTime,
      timestamp: Date.now(),
    }

    if (existingIndex !== -1) {
      positions.value[existingIndex] = newPosition
    }
    else {
      if (positions.value.length >= MAX_POSITIONS) {
        const oldest = positions.value.reduce((prev, curr) =>
          curr.timestamp < prev.timestamp ? curr : prev,
        )
        positions.value = positions.value.filter(p => p.name !== oldest.name)
      }
      positions.value.push(newPosition)
    }
  }

  function restorePosition(): void {
    if (!audio.value) {
      return
    }

    if (!currentTrackName.value) {
      audio.value.currentTime = 0
      return
    }

    audio.value.currentTime = positions.value.find(p => p.name === currentTrackName.value)?.position || 0
  }

  function clearPosition(): void {
    if (!currentTrackName.value)
      return

    positions.value = positions.value.filter(p => p.name !== currentTrackName.value)
  }

  function setTrackName(name: string): void {
    currentTrackName.value = name
  }

  return {
    clearPosition,
    restorePosition,
    savePosition,
    setTrackName,
  }
}
