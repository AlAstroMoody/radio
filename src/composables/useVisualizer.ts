import type { Ref } from 'vue'

import { useDark } from '@vueuse/core'
import { useAudioSettings } from 'composables/useAudioSettings'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const { visualization, visualizationIntensity } = useAudioSettings()

enum VisualizationType {
  Bars = 'bars',
  Particle = 'particle',
  Radial = 'radial',
  Spectrum = 'spectrum',
  Waveform = 'waveform',
}

interface Particle {
  life: number
  size: number
  vx: number
  vy: number
  x: number
  y: number
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
  const isDarkTheme = useDark()
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

  function drawBars(ctx: CanvasRenderingContext2D): void {
    if (!dataArray.value)
      return
    const barWidth = width.value * 1.1 / bufferLength.value
    let x = 0

    ctx.fillStyle = isDarkTheme.value ? 'rgb(100, 200, 255)' : 'rgb(50, 100, 150)'
    dataArray.value.forEach((value) => {
      const barHeight = (value / 255) * (height.value / 2) * visualizationIntensity.value
      ctx.fillRect(
        x,
        (height.value - barHeight),
        barWidth,
        barHeight,
      )
      x += barWidth
    })
  }

  function drawRadial(ctx: CanvasRenderingContext2D): void {
    if (!dataArray.value)
      return
    const radius = 20
    const bars = 360
    const rads = (Math.PI * 2) / bars

    for (let i = 0; i < bars; i++) {
      const barHeight = ((dataArray.value[i % bufferLength.value] || 0) * 0.4) * visualizationIntensity.value
      const x = centerX.value + Math.cos(rads * i) * radius
      const y = centerY.value + Math.sin(rads * i) * radius
      const xEnd = centerX.value + Math.cos(rads * i) * (radius + barHeight)
      const yEnd = centerY.value + Math.sin(rads * i) * (radius + barHeight)

      ctx.strokeStyle = isDarkTheme.value ? `rgb(150, ${150 + barHeight}, 255)` : `rgb(50, ${50 + barHeight}, 150)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(xEnd, yEnd)
      ctx.stroke()
    }
  }

  function drawWaveform(ctx: CanvasRenderingContext2D): void {
    if (!dataArray.value || !analyser.value)
      return
    analyser.value.getByteTimeDomainData(dataArray.value)

    ctx.beginPath()
    ctx.strokeStyle = isDarkTheme.value ? 'rgb(200, 200, 255)' : 'rgb(0, 0, 100)'
    ctx.lineWidth = 2

    const sliceWidth = width.value / bufferLength.value
    let x = 0

    for (let i = 0; i < bufferLength.value; i++) {
      const v = (dataArray.value[i] / 128.0) * visualizationIntensity.value
      const y = (v * height.value) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      }
      else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.stroke()
  }

  function drawParticle(ctx: CanvasRenderingContext2D): void {
    if (!dataArray.value)
      return

    const intensity = (dataArray.value.reduce((sum, val) => sum + val, 0) / bufferLength.value) * visualizationIntensity.value
    if (Math.random() < intensity / 255) {
      particles.value.push({
        life: 1,
        size: Math.random() * 3 + 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        x: centerX.value,
        y: centerY.value,
      })
    }

    particles.value = particles.value.filter(p => p.life > 0)
    ctx.fillStyle = isDarkTheme.value ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
    particles.value.forEach((p) => {
      p.x += p.vx * 2
      p.y += p.vy
      p.life -= 0.02
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  function drawSpectrum(ctx: CanvasRenderingContext2D): void {
    if (!dataArray.value)
      return
    const barWidth = width.value / bufferLength.value
    let x = 0

    const gradient = ctx.createLinearGradient(0, 0, 0, height.value)
    gradient.addColorStop(0, isDarkTheme.value ? 'rgb(255, 100, 100)' : 'rgb(150, 0, 0)')
    gradient.addColorStop(1, isDarkTheme.value ? 'rgb(100, 255, 100)' : 'rgb(0, 150, 0)')

    dataArray.value.forEach((value) => {
      const barHeight = (value / 255) * (height.value / 2) * visualizationIntensity.value
      ctx.fillStyle = gradient
      ctx.fillRect(
        x,
        (height.value - barHeight),
        barWidth,
        barHeight,
      )
      ctx.shadowBlur = 10
      ctx.shadowColor = isDarkTheme.value ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
      x += barWidth
    })
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
        drawBars(ctx)
        break
      case VisualizationType.Particle:
        drawParticle(ctx)
        break
      case VisualizationType.Radial:
        drawRadial(ctx)
        break
      case VisualizationType.Spectrum:
        drawSpectrum(ctx)
        break
      case VisualizationType.Waveform:
        drawWaveform(ctx)
        break
      default:
        stopVisualization()
        ctx.clearRect(0, 0, width.value, height.value)
        break
    }

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
  }

  function drawText(value?: string): void {
    if (value)
      text.value = value
    const ctx = getContext()
    if (!ctx)
      return

    stopVisualization()
    ctx.clearRect(0, 0, width.value, height.value)
    ctx.fillStyle = isDarkTheme.value ? 'white' : 'black'
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

  watch(isDarkTheme, () => {
    if (text.value)
      drawText()
  })

  onUnmounted(() => {
    stopVisualization()
  })

  return {
    drawText,
    startVisualization,
    stopVisualization,
  }
}
