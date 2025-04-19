import type { Ref } from 'vue'
import { useStorage } from '@vueuse/core'

interface AudioPosition {
  name: string
  position: number
  timestamp: number
}

const MAX_POSITIONS = 10
const positions = useStorage<AudioPosition[]>('audioPositions', [])

export function useAudioPosition(audio: Ref<HTMLAudioElement | undefined>, fileName: Ref<string>): {
  savePosition: () => void
  restorePosition: () => void
  clearPosition: () => void
} {
  function savePosition(): void {
    if (!audio.value || !fileName.value)
      return

    const existingIndex = positions.value.findIndex(p => p.name === fileName.value)
    const newPosition = {
      name: fileName.value,
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
    if (!audio.value)
      return

    audio.value.currentTime = positions.value.find(p => p.name === fileName.value)?.position || 0
  }

  function clearPosition(): void {
    positions.value = positions.value.filter(p => p.name !== fileName.value)
  }

  return {
    savePosition,
    restorePosition,
    clearPosition,
  }
}
