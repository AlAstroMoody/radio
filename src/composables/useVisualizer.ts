import type { Ref } from 'vue'

import { useAudioSettings } from 'composables/useAudioSettings'
import { useTheme } from 'composables/useTheme'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import type { Particle } from './visualizer/animations'

import {
  drawBars,
  drawCircleWave,
  drawParticle,
  drawRadial,
  drawSpectrum,
  drawWaveform,

} from './visualizer/animations'

const { visualization, visualizationIntensity } = useAudioSettings()

enum VisualizationType {
  Bars = 'bars',
  CircleWave = 'circlewave',
  Particle = 'particle',
  Radial = 'radial',
  Spectrum = 'spectrum',
  Waveform = 'waveform',
}

interface UseVisualizerReturn {
  drawText: (text: string) => void
  startVisualization: () => void
  stopVisualization: () => void
}

export function useVisualizer(
  canvas: Ref<HTMLCanvasElement | null>,
  analyser: Ref<AnalyserNode | null>,
): UseVisualizerReturn {
  const { isDark } = useTheme()
  const text = ref('')
  const rafId = ref(0)
  const isAnimating = ref(false)
  const width = ref(360)
  const height = ref(200)
  const bufferLength = ref(0)
  const dataArray = ref<null | Uint8Array>(null)
  const centerX = computed(() => width.value / 2)
  const centerY = computed(() => height.value / 2)
  const particles = ref<Particle[]>([])

  const gradientCache = ref<{
    dark: CanvasGradient | null
    light: CanvasGradient | null
  }>({ dark: null, light: null })

  function getContext(): CanvasRenderingContext2D | null {
    if (!canvas.value)
      return null
    const ctx = canvas.value.getContext('2d')
    if (!ctx)
      return null

    return ctx
  }

  function initAnalyser(): void {
    if (!analyser.value)
      return
    bufferLength.value = analyser.value.frequencyBinCount
    dataArray.value = new Uint8Array(bufferLength.value)
  }

  function clearContext(ctx: CanvasRenderingContext2D): void {
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
    ctx.lineWidth = 1
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'black'
  }

  function draw(): void {
    if (!isAnimating.value)
      return
    const ctx = getContext()
    if (!ctx || !dataArray.value || !analyser.value) {
      stopVisualization()
      return
    }

    analyser.value.getByteFrequencyData(dataArray.value)
    ctx.clearRect(0, 0, width.value, height.value)

    switch (visualization.value) {
      case VisualizationType.Bars:
        drawBars(ctx, dataArray.value, width.value, height.value, bufferLength.value, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.CircleWave:
        drawCircleWave(ctx, dataArray.value, centerX.value, centerY.value, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.Particle:
        drawParticle(ctx, dataArray.value, bufferLength.value, centerX.value, centerY.value, isDark.value, visualizationIntensity.value, particles.value)
        break
      case VisualizationType.Radial:
        drawRadial(ctx, dataArray.value, centerX.value, centerY.value, bufferLength.value, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.Spectrum:
        drawSpectrum(ctx, dataArray.value, width.value, height.value, bufferLength.value, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.Waveform:
        analyser.value.getByteTimeDomainData(dataArray.value)
        drawWaveform(ctx, dataArray.value, width.value, height.value, bufferLength.value, isDark.value, visualizationIntensity.value)
        break
      default:
        stopVisualization()
        ctx.clearRect(0, 0, width.value, height.value)
        break
    }

    clearContext(ctx)

    rafId.value = requestAnimationFrame(draw)
  }

  function startVisualization(): void {
    if (isAnimating.value || !analyser.value || !canvas.value)
      return
    isAnimating.value = true
    initAnalyser()
    draw()
  }

  function stopVisualization(): void {
    if (!isAnimating.value)
      return
    isAnimating.value = false
    if (rafId.value) {
      cancelAnimationFrame(rafId.value)
      rafId.value = 0
    }
    particles.value = []
    gradientCache.value = { dark: null, light: null }
  }

  function drawText(value?: string): void {
    if (value)
      text.value = value
    const ctx = getContext()
    if (!ctx)
      return

    stopVisualization()
    ctx.clearRect(0, 0, width.value, height.value)
    ctx.fillStyle = isDark.value ? 'white' : 'black'
    ctx.font = '20px Cyberpunk'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.value, width.value / (2), height.value / (2))
  }

  onMounted(() => {
    nextTick(() => {
      initAnalyser()
    })
  })

  watch(visualization, (newVal) => {
    if (newVal && newVal !== '') {
      startVisualization()
    }
    else {
      stopVisualization()
    }
  })

  watch(isDark, () => {
    gradientCache.value = { dark: null, light: null }
    if (text.value)
      drawText()
  })

  onUnmounted(() => {
    stopVisualization()
    particles.value = []
    gradientCache.value = { dark: null, light: null }
    dataArray.value = null
  })

  return {
    drawText,
    startVisualization,
    stopVisualization,
  }
}
