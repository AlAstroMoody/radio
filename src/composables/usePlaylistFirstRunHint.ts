import type { ComputedRef } from 'vue'

import { useStorage, useWindowSize } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

const MOBILE_MAX = 768
const HINT_DELAY_MS = 1200

export function usePlaylistFirstRunHint(): {
  dismissHint: () => void
  showHint: ComputedRef<boolean>
} {
  const seen = useStorage('radio-playlist-hint-seen', false)
  const { width } = useWindowSize()
  const ready = ref(false)

  const isMobile = computed(() => width.value < MOBILE_MAX)

  const showHint = computed(() => ready.value && isMobile.value && !seen.value)

  function dismissHint(): void {
    seen.value = true
  }

  onMounted(() => {
    if (seen.value)
      return

    window.setTimeout(() => {
      ready.value = true
    }, HINT_DELAY_MS)
  })

  return {
    dismissHint,
    showHint,
  }
}
