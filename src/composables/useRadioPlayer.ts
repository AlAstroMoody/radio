import type { Wave } from 'music'
import type { Ref } from 'vue'

import { computed, onUnmounted, ref, watch } from 'vue'

export interface UseRadioPlayerReturn {
  analyser: Ref<AnalyserNode | null>
  audio: Ref<HTMLAudioElement | null>
  isPlaying: Ref<boolean>
  pause: () => void
  pending: Ref<boolean>
  play: () => Promise<void>
}

export function useRadioPlayer(activeRadio: Ref<Wave>): UseRadioPlayerReturn {
  const audio = ref<HTMLAudioElement | null>(null)
  const audioConstructor = ref<HTMLAudioElement | null>(null)
  const audioContext = ref<AudioContext | null>(null)
  const analyser = ref<AnalyserNode | null>(null)

  const pending = ref<boolean>(false)
  const isPlaying = ref<boolean>(false)
  const audioError = ref(true)

  const repeatableAudio = computed(
    () => audioConstructor.value?.src === activeRadio.value?.src,
  )

  // Сбрасываем состояние визуализации при смене станции
  watch(() => activeRadio.value, () => {
    isPlaying.value = false
    pending.value = false
    audioError.value = false
  })

  async function play(): Promise<void> {
    if (!activeRadio.value || !audio.value)
      return

    pending.value = true
    audio.value.onerror = null
    audio.value.onloadedmetadata = null

    if (audio.value?.error && audioError.value) {
      handleAudioError()
    }
    else if (audio.value.readyState) {
      handleAudioPlay()
    }
    else if (audio.value?.error && !audioError.value) {
      if (repeatableAudio.value) {
        await audioConstructor.value?.play()
        setFlags()
      }
      else {
        if (!audio.value.HAVE_METADATA) {
          handleAudioError()
        }
        else {
          audioConstructor.value = null
        }
      }
    }

    audio.value.onerror = () => {
      handleAudioError()
    }

    audio.value.onloadedmetadata = async () => {
      handleAudioPlay()
    }

    audio.value.oncanplay = async () => {
      handleAudioPlay()
    }

    audio.value.oncanplaythrough = async () => {
      handleAudioPlay()
    }
  }

  function setFlags(): void {
    isPlaying.value = true
    audioError.value = false
    if (!audio.value)
      return
    if ([3, 4].includes(audio.value.readyState)) {
      pending.value = false
    }
  }

  async function handleAudioPlay(): Promise<void> {
    if (audio.value) {
      audio.value.playbackRate = 1
    }
    await audio.value?.play()
    setFlags()

    if (!audioContext.value) {
      audioContext.value = new window.AudioContext()
      audioContext.value.resume()
    }

    // Строим аудио граф если его еще нет
    if (!analyser.value) {
      buildAudioGraph()
    }
  }

  async function handleAudioError(): Promise<void> {
    if (!repeatableAudio.value) {
      audioConstructor.value = new Audio(activeRadio.value.src)
    }
    if (audioConstructor.value) {
      audioConstructor.value.playbackRate = 1
    }
    await audioConstructor.value?.play()
    setFlags()
  }

  function pause(): void {
    audio.value?.pause()
    audioConstructor.value?.pause()
    isPlaying.value = false
    pending.value = false
  }

  function buildAudioGraph(): void {
    if (audioContext.value && audio.value) {
      const sourceNode = audioContext.value.createMediaElementSource(audio.value)
      analyser.value = audioContext.value.createAnalyser()
      analyser.value.fftSize = 1024
      sourceNode.connect(analyser.value)
      analyser.value.connect(audioContext.value.destination)
    }
  }

  onUnmounted(() => {
    if (!audioContext.value)
      return
    audioContext.value.close()
  })

  return {
    analyser,
    audio,
    isPlaying,
    pause,
    pending,
    play,
  }
}
