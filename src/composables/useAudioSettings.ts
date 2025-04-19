import type { Ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { onMounted, watchEffect } from 'vue'

export interface useAudioSettingsReturn {
  volume: Ref<number>
  playbackRate: Ref<number>
  loop: Ref<boolean>
  autoplay: Ref<boolean>
  visualization: Ref<string>
  applySettings: () => void
}

const BASE_VOLUME = 50
const BASE_PLAYBACK_RATE = 1

export function useAudioSettings(): useAudioSettingsReturn {
  const volume = useStorage('volume', BASE_VOLUME)
  const playbackRate = useStorage('playbackRate', BASE_PLAYBACK_RATE)
  const loop = useStorage('loop', false)
  const autoplay = useStorage('autoplay', false)
  const visualization = useStorage('visualization', 'bars')

  function applySettings(): void {
    const audio = document.querySelector('audio') || undefined

    if (!audio)
      return
    if (audio.volume !== volume.value / 100)
      audio.volume = volume.value / 100
    if (audio.playbackRate !== playbackRate.value)
      audio.playbackRate = playbackRate.value
    if (audio.loop !== loop.value)
      audio.loop = loop.value
    if (audio.autoplay !== autoplay.value)
      audio.autoplay = autoplay.value
  }

  onMounted(() => {
    applySettings()
  })

  watchEffect(() => applySettings())

  return {
    volume,
    playbackRate,
    loop,
    autoplay,
    visualization,
    applySettings,
  }
}
