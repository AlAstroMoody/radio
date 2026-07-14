import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type PlaybackMode = 'music' | 'radio' | 'yt'

export const usePlaybackStore = defineStore('playback', () => {
  const mode = useStorage<PlaybackMode>('radio-mode', 'radio')
  const activeRadioId = useStorage<number>('active-radio-id', 1)
  const currentSourceId = ref<null | string>(null)
  const shouldResumeOnModeEnter = ref(false)

  const isRadioMode = computed<boolean>({
    get: () => mode.value === 'radio',
    set: (value) => {
      mode.value = value ? 'radio' : 'music'
    },
  })

  const isMusicMode = computed<boolean>(() => mode.value === 'music')
  const isYtMode = computed<boolean>(() => mode.value === 'yt')

  function consumeModeEnterResume(): boolean {
    const shouldResume = shouldResumeOnModeEnter.value
    shouldResumeOnModeEnter.value = false
    return shouldResume
  }

  function setMode(next: PlaybackMode): void {
    mode.value = next
  }

  function setShouldResumeOnModeEnter(value: boolean): void {
    shouldResumeOnModeEnter.value = value
  }

  function toggleMode(): void {
    mode.value = mode.value === 'radio' ? 'music' : 'radio'
  }

  function setActiveRadioId(id: number): void {
    activeRadioId.value = id
  }

  function setCurrentSourceId(id: null | string): void {
    currentSourceId.value = id
  }

  return {
    activeRadioId,
    consumeModeEnterResume,
    currentSourceId,
    isMusicMode,
    isRadioMode,
    isYtMode,
    mode,
    setActiveRadioId,
    setCurrentSourceId,
    setMode,
    setShouldResumeOnModeEnter,
    shouldResumeOnModeEnter,
    toggleMode,
  }
})
