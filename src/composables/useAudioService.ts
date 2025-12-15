// Основной сервис для воспроизведения аудио файлов: загрузка файлов, управление воспроизведением,
// перемотка, сохранение позиции, применение эффектов. Используется в MusicPlayer

import type { Ref } from 'vue'

import { useAudioController } from 'composables/useAudioController'
import { useAudioPosition } from 'composables/useAudioPosition'
import { useAudioSettings } from 'composables/useAudioSettings'
import { usePlaybackStore } from 'stores'
import { computed, onBeforeUnmount, readonly, ref, watch } from 'vue'

const SEEK_STEP = 10
const POSITION_SAVE_INTERVAL = 1000

export function useAudioService(
  fileName: Ref<string>,
): {
  cleanup: () => void
  currentTime: Ref<number>
  duration: Ref<number>
  getAnalyser: () => AnalyserNode | null
  handleProgressSeek: (percent: number) => void
  initializeAudio: (file: File) => Promise<void>
  initializeAudioService: () => void
  isMetadataLoading: Ref<boolean>
  isPlaying: Ref<boolean>
  pause: () => void
  play: () => Promise<void>
  progress: Ref<number>
  seekBackward: () => void
  seekForward: () => void
  togglePlayPause: () => void
  undoLastSeek: () => void
} {
  const controller = useAudioController()!
  const playbackStore = usePlaybackStore()

  const audioElement = computed(() => controller.audio.value)

  const state = ref({
    currentTime: 0,
    duration: 0,
    isMetadataLoading: false,
    isPlaying: false,
    progress: 0,
  })

  const currentDescriptorId = ref<null | string>(null)
  const isCurrentSource = computed(() => controller.currentSource.value?.id === currentDescriptorId.value)

  const lastSeekPosition = ref<null | number>(null)

  const { autoplay, loop, playbackRate, volume } = useAudioSettings()
  const { clearPosition, restorePosition, savePosition, setTrackName } = useAudioPosition(
    audioElement,
    fileName,
  )

  let lastPositionSavedAt = 0
  let watchers: Array<() => void> = []
  let suppressPositionPersistence = false

  function updateProgress(): void {
    const duration = controller.state.duration
    const current = controller.state.currentTime
    state.value.progress = duration ? Math.trunc((current / duration) * 100) : 0
  }

  function shouldSkipPositionPersistence(): boolean {
    if (!isCurrentSource.value) {
      return true
    }

    if (suppressPositionPersistence)
      return true

    return false
  }

  function savePositionThrottled(): void {
    if (shouldSkipPositionPersistence())
      return

    const now = Date.now()
    if (now - lastPositionSavedAt < POSITION_SAVE_INTERVAL)
      return

    savePosition()
    lastPositionSavedAt = now
  }

  function flushPositionSave(): void {
    if (shouldSkipPositionPersistence())
      return

    savePosition()
    lastPositionSavedAt = Date.now()
  }

  function clearStoredPosition(): void {
    if (shouldSkipPositionPersistence())
      return

    clearPosition()
    lastPositionSavedAt = 0
  }

  function setupWatchers(): void {
    teardownWatchers()

    watchers = [
      watch(
        () => controller.state.currentTime,
        (current) => {
          if (!isCurrentSource.value)
            return

          state.value.currentTime = current
          updateProgress()
          savePositionThrottled()
        },
      ),
      watch(
        () => controller.state.duration,
        (duration) => {
          if (!isCurrentSource.value)
            return

          state.value.duration = duration
          updateProgress()
        },
      ),
      watch(
        () => controller.state.isPlaying,
        (playing) => {
          if (!isCurrentSource.value)
            return

          state.value.isPlaying = playing
          if (!playing) {
            flushPositionSave()
          }
        },
      ),
      watch(
        () => controller.state.isReady,
        (ready) => {
          if (!isCurrentSource.value)
            return

          if (ready) {
            state.value.isMetadataLoading = false
            state.value.duration = controller.state.duration
            updateProgress()
          }
        },
      ),
      watch(
        () => controller.state.ended,
        (ended) => {
          if (!isCurrentSource.value)
            return

          if (ended) {
            clearStoredPosition()
          }
        },
      ),
      watch(
        () => controller.state.error,
        (error) => {
          if (!isCurrentSource.value)
            return

          if (error) {
            state.value.isPlaying = false
          }
        },
      ),
    ]
  }

  function teardownWatchers(): void {
    watchers.forEach(stop => stop())
    watchers = []
  }

  async function waitForReady(): Promise<void> {
    if (controller.state.isReady)
      return

    await new Promise<void>((resolve) => {
      const stop = watch(
        () => controller.state.isReady,
        (ready) => {
          if (ready) {
            stop()
            resolve()
          }
        },
      )
    })
  }

  function descriptorIdForFile(file: File): string {
    return `file-${file.name}-${file.lastModified}-${file.size}`
  }

  function initializeAudioService(): void {
    setupWatchers()
  }

  async function initializeAudio(file: File): Promise<void> {
    state.value.isMetadataLoading = true
    lastSeekPosition.value = null
    lastPositionSavedAt = 0

    suppressPositionPersistence = true
    setTrackName(file.name)

    const descriptorId = descriptorIdForFile(file)
    currentDescriptorId.value = descriptorId

    await controller.load({
      autoplay: false,
      file,
      id: descriptorId,
      label: file.name,
      type: 'file',
    })
    playbackStore.setCurrentSourceId(descriptorId)

    await waitForReady()

    suppressPositionPersistence = false
    restorePosition()
    flushPositionSave()

    state.value.duration = controller.state.duration
  }

  async function play(): Promise<void> {
    try {
      if (currentDescriptorId.value) {
        playbackStore.setCurrentSourceId(currentDescriptorId.value)
      }

      await controller.play()

      const audioElement = controller.audio.value
      if (audioElement && !audioElement.paused) {
        state.value.isPlaying = true
      }
      else {
        state.value.isPlaying = controller.state.isPlaying
      }
    }
    catch (error) {
      state.value.isPlaying = false
      throw error
    }
  }

  function pause(): void {
    controller.pause()
    state.value.isPlaying = false
  }

  function togglePlayPause(): void {
    if (state.value.isPlaying) {
      pause()
    }
    else {
      void play()
    }
  }

  function seekBackward(): void {
    lastSeekPosition.value = controller.state.currentTime
    controller.seek(Math.max(0, controller.state.currentTime - SEEK_STEP))
    flushPositionSave()
  }

  function seekForward(): void {
    lastSeekPosition.value = controller.state.currentTime
    controller.seek(controller.state.currentTime + SEEK_STEP)
    flushPositionSave()
  }

  function undoLastSeek(): void {
    if (lastSeekPosition.value === null)
      return

    controller.seek(lastSeekPosition.value)
    lastSeekPosition.value = null
  }

  function handleProgressSeek(percent: number): void {
    const duration = controller.state.duration
    if (duration <= 0)
      return

    lastSeekPosition.value = controller.state.currentTime
    controller.seek(percent * duration)
    flushPositionSave()
  }

  function getAnalyser(): AnalyserNode | null {
    return controller.analyser.value
  }

  function cleanup(): void {
    teardownWatchers()
    flushPositionSave()
    currentDescriptorId.value = null
    suppressPositionPersistence = false
    playbackStore.setCurrentSourceId(null)
  }

  watch([volume, playbackRate, loop, autoplay], () => {
    const audioRef = controller.audio.value
    if (!audioRef)
      return

    audioRef.volume = volume.value / 100
    audioRef.playbackRate = playbackRate.value
    audioRef.loop = loop.value
    audioRef.autoplay = autoplay.value
  })

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    cleanup,
    currentTime: readonly(computed(() => state.value.currentTime)),
    duration: readonly(computed(() => state.value.duration)),
    getAnalyser,
    handleProgressSeek,
    initializeAudio,
    initializeAudioService,
    isMetadataLoading: readonly(computed(() => state.value.isMetadataLoading)),
    isPlaying: readonly(computed(() => state.value.isPlaying)),
    pause,
    play,
    progress: readonly(computed(() => state.value.progress)),
    seekBackward,
    seekForward,
    togglePlayPause,
    undoLastSeek,
  }
}
