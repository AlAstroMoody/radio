import type { Ref } from 'vue'

import { useEventListener } from '@vueuse/core'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useTheme } from 'composables/useTheme'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import type { Particle } from './visualizer/animations'

import {
  clearCircleWaveGradientCache,
  clearHexagonGradientCache,
  clearSpectrumGradientCache,
  drawBars,
  drawCircleWave,
  drawHexagonGrid,
  drawParticle,
  drawRadial,
  drawSpectrum,
  drawWaveform,
} from './visualizer/animations'

const { visualization, visualizationFPS, visualizationIntensity } = useAudioSettings()

enum VisualizationType {
  Bars = 'bars',
  CircleWave = 'circlewave',
  HexagonGrid = 'hexagongrid',
  Particle = 'particle',
  Radial = 'radial',
  Spectrum = 'spectrum',
  Waveform = 'waveform',
}

interface UseVisualizerReturn {
  drawText: (text: string) => void
  resetVisualization: () => void
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
  const isPageVisible = ref(!document.hidden)
  const width = ref(360)
  const height = ref(200)

  // FPS контроль
  const lastFrameTime = ref(0)
  const frameInterval = computed(() => 1000 / visualizationFPS.value)

  const bufferLength = ref(0)
  const dataArray = ref<null | Uint8Array<ArrayBuffer>>(null)
  const centerX = computed(() => width.value / 2)
  const centerY = computed(() => height.value / 2)
  const particles = ref<Particle[]>([])

  // Для автоматической остановки при затухании
  const lowSignalFrameCount = ref(0)
  const LOW_SIGNAL_THRESHOLD = 5 // Порог для определения низкого сигнала
  const MAX_LOW_SIGNAL_FRAMES = 120 // Максимальное количество кадров с низким сигналом (2 секунды при 60 FPS)

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

  function checkSignalLevel(dataArray: Uint8Array): boolean {
    // Проверяем средний уровень сигнала
    const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
    return average > LOW_SIGNAL_THRESHOLD
  }

  function drawVisualization(ctx: CanvasRenderingContext2D, dataArray: Uint8Array<ArrayBuffer>, bufferLength: number): void {
    switch (visualization.value) {
      case VisualizationType.Bars:
        drawBars(ctx, dataArray, width.value, height.value, bufferLength, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.CircleWave:
        drawCircleWave(ctx, dataArray, centerX.value, centerY.value, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.HexagonGrid:
        drawHexagonGrid(ctx, dataArray, width.value, height.value, bufferLength, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.Particle:
        drawParticle(ctx, dataArray, bufferLength, centerX.value, centerY.value, isDark.value, visualizationIntensity.value, particles.value)
        break
      case VisualizationType.Radial:
        drawRadial(ctx, dataArray, centerX.value, centerY.value, bufferLength, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.Spectrum:
        drawSpectrum(ctx, dataArray, width.value, height.value, bufferLength, isDark.value, visualizationIntensity.value)
        break
      case VisualizationType.Waveform:
        if (analyser.value) {
          analyser.value.getByteTimeDomainData(dataArray)
        }
        drawWaveform(ctx, dataArray, width.value, height.value, bufferLength, isDark.value, visualizationIntensity.value)
        break
      default:
        ctx.clearRect(0, 0, width.value, height.value)
        break
    }

    clearContext(ctx)
  }

  function draw(): void {
    if (!isAnimating.value || !visualization.value || !isPageVisible.value) {
      rafId.value = 0
      return
    }

    const currentTime = performance.now()
    const timeSinceLastFrame = currentTime - lastFrameTime.value

    // Пропускаем кадр, если не прошло достаточно времени
    if (timeSinceLastFrame < frameInterval.value) {
      rafId.value = requestAnimationFrame(draw)
      return
    }

    lastFrameTime.value = currentTime

    const ctx = getContext()
    if (!ctx || !dataArray.value || !analyser.value) {
      stopVisualization()
      return
    }

    try {
      analyser.value.getByteFrequencyData(dataArray.value)
      ctx.clearRect(0, 0, width.value, height.value)
    }
    catch {
      stopVisualization()
      return
    }

    // Проверяем уровень сигнала для автоматической остановки
    const hasSignal = checkSignalLevel(dataArray.value)

    if (hasSignal) {
      lowSignalFrameCount.value = 0
    }
    else {
      lowSignalFrameCount.value++

      // Если сигнал слишком долго низкий, останавливаем анимацию
      if (lowSignalFrameCount.value > MAX_LOW_SIGNAL_FRAMES) {
        stopVisualization()
        return
      }
    }

    drawVisualization(ctx, dataArray.value, bufferLength.value)

    rafId.value = requestAnimationFrame(draw)
  }

  function startVisualization(): void {
    if (isAnimating.value || !analyser.value || !canvas.value || !visualization.value || !isPageVisible.value)
      return
    isAnimating.value = true
    lowSignalFrameCount.value = 0 // Сбрасываем счетчик при запуске
    initAnalyser()
    draw()
  }

  function stopVisualization(): void {
    isAnimating.value = false
    if (rafId.value) {
      cancelAnimationFrame(rafId.value)
      rafId.value = 0
    }
    particles.value = []
    gradientCache.value = { dark: null, light: null }
    lowSignalFrameCount.value = 0 // Сбрасываем счетчик при остановке
  }

  function resetVisualization(): void {
    isAnimating.value = false
    if (rafId.value) {
      cancelAnimationFrame(rafId.value)
      rafId.value = 0
    }
    // Полный сброс для случаев, когда нужно очистить все
    particles.value = []
    gradientCache.value = { dark: null, light: null }
    lowSignalFrameCount.value = 0
    if (dataArray.value) {
      dataArray.value.fill(0)
    }
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
    ctx.font = '20px Blackcraft'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.value, width.value / (2), height.value / (2))
  }

  onMounted(() => {
    nextTick(() => {
      initAnalyser()
    })

    useEventListener(document, 'visibilitychange', () => {
      isPageVisible.value = !document.hidden
      if (!isPageVisible.value && isAnimating.value) {
        stopVisualization()
      }
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

  watch(isPageVisible, (isVisible) => {
    if (isVisible && visualization.value && !isAnimating.value) {
      startVisualization()
    }
  })

  watch(isDark, () => {
    gradientCache.value = { dark: null, light: null }
    clearSpectrumGradientCache()
    clearCircleWaveGradientCache()
    clearHexagonGradientCache()
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
    resetVisualization,
    startVisualization,
    stopVisualization,
  }
}
