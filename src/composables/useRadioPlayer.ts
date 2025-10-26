import type { Wave } from 'shared/types/audio'
import type { Ref } from 'vue'

import { onUnmounted, ref, watch } from 'vue'

export interface UseRadioPlayerReturn {
  analyser: Ref<AnalyserNode | null>
  audio: Ref<HTMLAudioElement | null>
  isPlaying: Ref<boolean>
  pause: () => void
  pending: Ref<boolean>
  play: () => Promise<void>
}

export function useRadioPlayer(activeRadio: Ref<undefined | Wave>): UseRadioPlayerReturn {
  const audio = ref<HTMLAudioElement | null>(null)
  const audioContext = ref<AudioContext | null>(null)
  const analyser = ref<AnalyserNode | null>(null)

  const pending = ref<boolean>(false)
  const isPlaying = ref<boolean>(false)

  // Сбрасываем состояние визуализации при смене станции
  watch(() => activeRadio.value, () => {
    isPlaying.value = false
    pending.value = false
  })

  async function play(): Promise<void> {
    if (!activeRadio.value || !audio.value)
      return

    pending.value = true

    audio.value.onloadedmetadata = async () => {
      handleAudioPlay()
    }

    audio.value.oncanplay = async () => {
      handleAudioPlay()
    }

    audio.value.oncanplaythrough = async () => {
      handleAudioPlay()
    }

    audio.value.onerror = () => {
      pending.value = false
    }

    if (audio.value.readyState >= 2) {
      await handleAudioPlay()
    }
  }

  function setFlags(): void {
    isPlaying.value = true
    if (!audio.value)
      return
    if ([3, 4].includes(audio.value.readyState)) {
      pending.value = false
    }
  }

  async function handleAudioPlay(): Promise<void> {
    if (!audio.value)
      return

    audio.value.playbackRate = 1
    await audio.value.play()
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

  function pause(): void {
    audio.value?.pause()
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
