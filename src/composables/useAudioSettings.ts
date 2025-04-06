import type { Ref } from 'vue'
import { onMounted, ref, watch } from 'vue'

export interface useAudioSettingsReturn {
  volume: Ref<number>
}

const BASE_VOLUME = 50

export function useAudioSettings(audioRefs: Ref<HTMLAudioElement | null>[]): useAudioSettingsReturn {
  const volume = ref<number>(BASE_VOLUME)

  function applyVolumeSettings(): void {
    audioRefs.forEach((audio) => {
      if (audio.value) {
        audio.value.volume = volume.value / 100
      }
    })
  }

  onMounted(() => {
    const storageVolume = localStorage.getItem('volume')
    if (storageVolume) {
      volume.value = +storageVolume
    }
    else {
      volume.value = BASE_VOLUME
      localStorage.setItem('volume', `${BASE_VOLUME}`)
    }
    applyVolumeSettings()
  })

  watch(volume, () => {
    localStorage.setItem('volume', `${volume.value}`)
    applyVolumeSettings()
  })

  return {
    volume,
  }
}
