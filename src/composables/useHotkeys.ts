import { onMounted, onUnmounted } from 'vue'

export interface HotkeyConfig {
  alt?: boolean
  callback: () => void
  ctrl?: boolean
  key: string
  preventDefault?: boolean
  shift?: boolean
}

export function useHotkeys(configs: HotkeyConfig[]): void {
  function handleKeydown(event: KeyboardEvent): void {
    for (const config of configs) {
      const keyMatches = event.key.toLowerCase() === config.key.toLowerCase()
      const ctrlMatches = !!config.ctrl === event.ctrlKey
      const shiftMatches = !!config.shift === event.shiftKey
      const altMatches = !!config.alt === event.altKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        if (config.preventDefault) {
          event.preventDefault()
        }
        config.callback()
        break
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}
