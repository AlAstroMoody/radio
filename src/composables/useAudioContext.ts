// Управляет Web Audio API: создает AudioContext, AnalyserNode для визуализации,
// подключает цепочку эффектов (эквалайзер) и обеспечивает правильное подключение аудио графа

import type { AudioEffectBuilder } from 'app/providers/audio'
import type { Ref } from 'vue'

import { ref } from 'vue'

interface UseAudioContextReturn {
  analyser: Ref<AnalyserNode | null>
  audioContext: Ref<AudioContext | null>
  cleanupGraph: () => void
  ensureAudioGraph: () => void
  setEffectChain: (builder: AudioEffectBuilder | null) => void
}

export function useAudioContext(audio: Ref<HTMLAudioElement | null>): UseAudioContextReturn {
  const audioContext = ref<AudioContext | null>(null)
  const analyser = ref<AnalyserNode | null>(null)
  const sourceNode = ref<MediaElementAudioSourceNode | null>(null)

  let effectBuilder: AudioEffectBuilder | null = null
  let effectCleanup: (() => void) | null = null

  function applyEffectChain(): void {
    if (!audioContext.value || !analyser.value)
      return

    try {
      analyser.value.disconnect()
    }
    catch {}

    effectCleanup?.()
    effectCleanup = null

    const builder = effectBuilder
    if (!builder) {
      analyser.value.connect(audioContext.value.destination)
      return
    }

    const chain = builder(audioContext.value, analyser.value)

    if (!chain) {
      analyser.value.connect(audioContext.value.destination)
      return
    }

    analyser.value.connect(chain.output)
    chain.output.connect(audioContext.value.destination)

    effectCleanup = () => {
      try {
        chain.output.disconnect()
      }
      catch {}
      chain.cleanup?.()
    }
  }

  function setEffectChain(builder: AudioEffectBuilder | null): void {
    effectBuilder = builder
    applyEffectChain()
  }

  function ensureAudioGraph(): void {
    if (!audio.value)
      return

    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'playback',
        sampleRate: 48000,
      })
    }

    if (!analyser.value) {
      analyser.value = audioContext.value.createAnalyser()
      analyser.value.fftSize = 2048
      analyser.value.smoothingTimeConstant = 0.8
    }

    if (!sourceNode.value) {
      sourceNode.value = audioContext.value.createMediaElementSource(audio.value)
    }

    if (sourceNode.value && analyser.value) {
      try {
        sourceNode.value.disconnect()
      }
      catch {}
      sourceNode.value.connect(analyser.value)
    }

    applyEffectChain()
  }

  function cleanupGraph(): void {
    effectCleanup?.()
    effectCleanup = null

    try {
      sourceNode.value?.disconnect()
      analyser.value?.disconnect()
    }
    catch {}

    sourceNode.value = null
    analyser.value = null

    if (audioContext.value) {
      audioContext.value.close().catch(() => {})
      audioContext.value = null
    }
  }

  return {
    analyser,
    audioContext,
    cleanupGraph,
    ensureAudioGraph,
    setEffectChain,
  }
}
