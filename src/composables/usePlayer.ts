import type { Wave } from 'music'
import type { Ref } from 'vue'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useVisualizer } from 'composables/useVisualizer'
import { computed, onUnmounted, ref } from 'vue'

export interface UsePlayerReturn {
  volume: Ref<number>
  audio: Ref<HTMLAudioElement | null>
  pending: Ref<boolean>
  isPlaying: Ref<boolean>
  play: () => Promise<void>
  pause: () => void
  buildAudioGraph: () => void
}

export function usePlayer(canvas: Ref<HTMLCanvasElement | null>, activeRadio: Ref<Wave>): UsePlayerReturn {
  const audio = ref<HTMLAudioElement | null>(null)
  const audioConstructor = ref<HTMLAudioElement | null>(null)
  const audioContext = ref<AudioContext | null>(null)
  const analyser = ref<AnalyserNode | null>(null)

  const { startVisualization, drawText } = useVisualizer(canvas, analyser)
  const { volume } = useAudioSettings([audio, audioConstructor])

  const pending = ref<boolean>(false)
  const isPlaying = ref<boolean>(false)
  const audioError = ref(true)

  const repeatableAudio = computed(
    () => audioConstructor.value?.src === activeRadio.value?.src,
  )

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
  }

  function setFlags(): void {
    pending.value = false
    isPlaying.value = true
    audioError.value = false
  }

  async function handleAudioPlay(): Promise<void> {
    await audio.value?.play()
    if (audio.value?.readyState === HTMLMediaElement.HAVE_FUTURE_DATA) {
      setFlags()
    }

    if (!audioContext.value) {
      audioContext.value = new window.AudioContext()
      audioContext.value.resume()
      buildAudioGraph()
    }
    startVisualization()
  }

  async function handleAudioError(): Promise<void> {
    if (!repeatableAudio.value) {
      audioConstructor.value = new Audio(activeRadio.value.src)
    }
    await audioConstructor.value?.play()
    setFlags()
    drawText('no metadata')
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
    volume,
    audio,
    pending,
    isPlaying,
    play,
    pause,
    buildAudioGraph,
  }
}
