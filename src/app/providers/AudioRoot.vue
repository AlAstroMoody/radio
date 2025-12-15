<script setup lang="ts">
import { useAudioContext } from 'composables/useAudioContext'
import { useAudioEffects } from 'composables/useAudioEffects'
import { useAudioElement } from 'composables/useAudioElement'
import { useAudioSettings } from 'composables/useAudioSettings'
import { nextTick, onBeforeUnmount, provide, reactive, ref, watch } from 'vue'

import type { AudioController, AudioPlaybackState, AudioSourceDescriptor } from './audio'

import { audioControllerKey } from './audio'

const state = reactive<AudioPlaybackState>({
  buffered: null,
  currentSrc: '',
  currentTime: 0,
  duration: 0,
  ended: false,
  error: null,
  isPlaying: false,
  isReady: false,
  muted: false,
  volume: 1,
})

const currentSource = ref<AudioSourceDescriptor | null>(null)
let objectUrl: null | string = null

const { audio } = useAudioElement(state)
const {
  analyser,
  audioContext,
  cleanupGraph,
  ensureAudioGraph,
  setEffectChain,
} = useAudioContext(audio)

// Централизованное управление эффектами для всех источников (музыка и радио)
const { effectBuilder, hasActiveEffects } = useAudioEffects()
const { filterSettings } = useAudioSettings()

let lastHasActiveEffects = hasActiveEffects()

watch(filterSettings, () => {
  const currentHasActiveEffects = hasActiveEffects()
  if (currentHasActiveEffects !== lastHasActiveEffects) {
    if (currentHasActiveEffects) {
      setEffectChain(effectBuilder)
    }
    else {
      setEffectChain(null)
    }
    lastHasActiveEffects = currentHasActiveEffects
  }
}, { deep: true })

// Применяем эффекты при загрузке нового источника
watch(currentSource, () => {
  const currentHasActiveEffects = hasActiveEffects()
  if (currentHasActiveEffects) {
    setEffectChain(effectBuilder)
  }
  else {
    setEffectChain(null)
  }
  lastHasActiveEffects = currentHasActiveEffects
})

function detachObjectUrl(): void {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
}

async function load(descriptor: AudioSourceDescriptor): Promise<void> {
  await waitForAudioElement()

  await nextTick()

  detachObjectUrl()

  resetState()
  currentSource.value = descriptor

  ensureAudioGraph()

  if (descriptor.file) {
    objectUrl = URL.createObjectURL(descriptor.file)
    audio.value!.src = objectUrl
    state.currentSrc = objectUrl
  }
  else if (descriptor.src) {
    audio.value!.src = descriptor.src
    state.currentSrc = descriptor.src
  }

  audio.value!.load()

  if (descriptor.autoplay) {
    try {
      await play()
    }
    catch (error) {
      state.error = error instanceof Error ? error.message : String(error)
    }
  }
}

function pause(): void {
  if (audio.value) {
    audio.value.pause()
  }
}

async function play(): Promise<void> {
  if (!audio.value)
    return

  if (audioContext.value?.state === 'suspended') {
    try {
      await audioContext.value.resume()
    }
    catch { }
  }
  try {
    await audio.value.play()
  }
  catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw error
    }
  }
}

function resetState(): void {
  state.currentTime = 0
  state.duration = 0
  state.buffered = null
  state.ended = false
  state.isReady = false
  state.error = null
}

function seek(seconds: number): void {
  if (!audio.value)
    return
  const duration = Number.isFinite(audio.value.duration) ? audio.value.duration : 0
  const target = Math.max(0, duration ? Math.min(seconds, duration) : seconds)
  audio.value.currentTime = target
}

function setMuted(muted: boolean): void {
  if (!audio.value)
    return
  audio.value.muted = muted
  state.muted = audio.value.muted
}

function setVolume(value: number): void {
  if (!audio.value)
    return
  audio.value.volume = Math.max(0, Math.min(value, 1))
  state.volume = audio.value.volume
}

function stop(): void {
  pause()
  if (audio.value) {
    audio.value.currentTime = 0
  }
  state.isPlaying = false
}

async function waitForAudioElement(): Promise<void> {
  if (audio.value)
    return

  await new Promise<void>((resolve) => {
    const stop = watch(audio, (element) => {
      if (element) {
        stop()
        resolve()
      }
    })
  })
}

onBeforeUnmount(() => {
  if (audio.value) {
    audio.value.pause()
    audio.value.src = ''
  }

  detachObjectUrl()
  cleanupGraph()
})

const controller: AudioController = {
  analyser,
  audio,
  audioContext,
  currentSource,
  load,
  pause,
  play,
  seek,
  setEffectChain,
  setMuted,
  setVolume,
  state,
  stop,
}

provide(audioControllerKey, controller)
</script>

<template>
  <slot />
</template>
