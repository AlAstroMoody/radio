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
  const splitter = ref<ChannelSplitterNode | null>(null)

  let effectBuilder: AudioEffectBuilder | null = null
  let effectCleanup: (() => void) | null = null

  function applyEffectChain(): void {
    if (!audioContext.value || !sourceNode.value)
      return

    // Отключаем все соединения от sourceNode и splitter
    try {
      sourceNode.value.disconnect()
      splitter.value?.disconnect()
    }
    catch {}

    effectCleanup?.()
    effectCleanup = null

    if (!analyser.value) {
      analyser.value = audioContext.value.createAnalyser()
      analyser.value.fftSize = 2048
      analyser.value.smoothingTimeConstant = 0.8
    }

    // Создаем splitter для разделения сигнала
    if (!splitter.value) {
      splitter.value = audioContext.value.createChannelSplitter(2)
    }

    // Подключаем sourceNode к splitter
    sourceNode.value.connect(splitter.value)

    const builder = effectBuilder

    if (!builder) {
      // Создаем GainNode для прямого прохода (gain = 1, без изменений)
      const gainNode = audioContext.value.createGain()
      gainNode.gain.value = 1

      // Один выход splitter -> gainNode -> destination (чистый звук без обработки)
      splitter.value.connect(gainNode, 0)
      gainNode.connect(audioContext.value.destination)

      // Другой выход splitter -> analyser (только для визуализации)
      splitter.value.connect(analyser.value, 1)

      effectCleanup = () => {
        try {
          gainNode.disconnect()
        }
        catch {}
      }

      return
    }

    // Если эффекты нужны - используем цепочку эффектов
    // Создаем отдельный GainNode для эффектов (не используем analyser в цепочке)
    const effectsGain = audioContext.value.createGain()
    effectsGain.gain.value = 1

    // Один выход splitter -> effectsGain -> эффекты -> destination
    splitter.value.connect(effectsGain, 0)

    // Создаем временный analyser для эффектов (не основной analyser для визуализации)
    const effectsAnalyser = audioContext.value.createAnalyser()
    effectsAnalyser.fftSize = 2048
    effectsAnalyser.smoothingTimeConstant = 0.8

    effectsGain.connect(effectsAnalyser)
    const chain = builder(audioContext.value, effectsAnalyser)

    if (!chain) {
      effectsAnalyser.connect(audioContext.value.destination)
    }
    else {
      effectsAnalyser.connect(chain.output)
      chain.output.connect(audioContext.value.destination)
    }

    // Второй выход splitter -> analyser (только для визуализации, не подключаем к destination)
    splitter.value.connect(analyser.value, 1)

    const finalChain = chain
    effectCleanup = () => {
      try {
        effectsGain.disconnect()
        effectsAnalyser.disconnect()
        if (finalChain) {
          finalChain.output.disconnect()
          finalChain.cleanup?.()
        }
      }
      catch {}
    }
  }

  function setEffectChain(builder: AudioEffectBuilder | null): void {
    effectBuilder = builder

    // Всегда создаем граф для визуализации, даже если эффекты не нужны
    // Но используем прямой вывод когда эффекты отключены
    if (!audioContext.value && audio.value) {
      ensureAudioGraph()
    }

    // Всегда применяем цепочку (даже если эффекты не нужны - для визуализации)
    if (audioContext.value) {
      applyEffectChain()
    }
  }

  function ensureAudioGraph(): void {
    if (!audio.value)
      return

    // Всегда создаем граф для визуализации, даже если эффекты не нужны
    // Но когда эффекты не нужны, используем прямой вывод через splitter
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'playback',
      })
    }

    // Создаем analyser для визуализации (нужен всегда)
    if (!analyser.value) {
      analyser.value = audioContext.value.createAnalyser()
      analyser.value.fftSize = 2048
      analyser.value.smoothingTimeConstant = 0.8
    }

    // sourceNode нужно пересоздать только если его нет или контекст изменился
    // Важно: проверяем, что audio элемент еще не подключен к другому sourceNode
    if (!sourceNode.value || sourceNode.value.context !== audioContext.value) {
      // Полностью очищаем старый sourceNode перед созданием нового
      if (sourceNode.value) {
        try {
          sourceNode.value.disconnect()
        }
        catch {}
        sourceNode.value = null
      }

      // Создаем sourceNode для audio элемента
      sourceNode.value = audioContext.value.createMediaElementSource(audio.value)
    }

    if (audioContext.value && sourceNode.value) {
      applyEffectChain()
    }
  }

  function cleanupGraph(): void {
    effectCleanup?.()
    effectCleanup = null

    try {
      sourceNode.value?.disconnect()
      analyser.value?.disconnect()
      splitter.value?.disconnect()
    }
    catch {}

    sourceNode.value = null
    analyser.value = null
    splitter.value = null

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
