import type { Ref } from 'vue'
import { useDark } from '@vueuse/core'
import { useAudioSettings } from 'composables/useAudioSettings'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const { visualization } = useAudioSettings()

export enum VisualizationType {
  Bars = 'bars',
  Radial = 'radial',
}
interface UseVisualizerReturn {
  startVisualization: () => void
  stopVisualization: () => void
  drawText: (text: string) => void
}

const isDarkTheme = useDark()
const text = ref('')
const rafId = ref(0)

export function useVisualizer(
  canvas: Ref<HTMLCanvasElement | null>,
  analyser: Ref<AnalyserNode | null>,
): UseVisualizerReturn {
  const width = ref(400)
  const height = ref(256)
  const bufferLength = ref(1)
  const dataArray = ref<Uint8Array | null>(null)
  const centerX = computed(() => width.value / 2)
  const centerY = computed(() => height.value / 2)
  const bars = 360
  const barWidth = ref(1)

  const isAnimating = ref(false)

  function drawBars(): void {
    if (!canvas.value || !dataArray.value)
      return

    const ctx = canvas.value.getContext('2d')
    if (!ctx)
      return

    const barWidth = width.value / bufferLength.value
    let x = 0

    dataArray.value.forEach((value, i) => {
      ctx.fillStyle = `rgb(${value + i - 50},${i},${value + i})`
      ctx.fillRect(x, height.value - value / 2, 1, value / 2)
      x += barWidth + 1
    })
  }

  function drawRadial(): void {
    if (!canvas.value || !dataArray.value)
      return

    const ctx = canvas.value.getContext('2d')
    if (!ctx)
      return

    const radius = 20
    const rads = (Math.PI * 2) / bars

    for (let i = 0; i < bars; i++) {
      const barHeight = dataArray.value[i] * 0.4
      const x = centerX.value + Math.cos(rads * i) * radius
      const y = centerY.value + Math.sin(rads * i) * radius
      const xEnd = centerX.value + Math.cos(rads * i) * (radius + barHeight)
      const yEnd = centerY.value + Math.sin(rads * i) * (radius + barHeight)

      const lineColor = `rgb(${dataArray.value[i]}, ${dataArray.value[i]}, 205)`
      ctx.strokeStyle = lineColor
      ctx.lineWidth = barWidth.value
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(xEnd, yEnd)
      ctx.stroke()
    }
  }

  function startVisualization(): void {
    if (isAnimating.value)
      return
    if (!analyser.value)
      return

    isAnimating.value = true
    bufferLength.value = analyser.value.frequencyBinCount
    dataArray.value = new Uint8Array(bufferLength.value)

    const draw = (): void => {
      if (!canvas.value || !dataArray.value)
        return

      const ctx = canvas.value.getContext('2d')
      if (!ctx)
        return

      analyser.value!.getByteFrequencyData(dataArray.value)
      ctx.clearRect(0, 0, width.value, height.value)

      switch (visualization.value) {
        case VisualizationType.Bars:
          drawBars()
          break
        case VisualizationType.Radial:
          drawRadial()
          break
        default:
          break
      }

      rafId.value = requestAnimationFrame(draw)
    }

    rafId.value = requestAnimationFrame(draw)
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
    if (!canvas.value)
      return

    const ctx = canvas.value.getContext('2d')
    if (!ctx)
      return

    stopVisualization()

    ctx.clearRect(0, 0, width.value, height.value)
    ctx.fillStyle = isDarkTheme.value ? 'white' : 'black'
    ctx.font = '20px Cyberpunk'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.value, width.value / 2, height.value / 2)
  }

  onMounted(() => {
    if (canvas.value) {
      width.value = canvas.value.width
      height.value = canvas.value.height
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
    startVisualization,
    stopVisualization,
    drawText,
  }
}
