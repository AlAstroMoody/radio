import type { Ref } from 'vue'
import { useDark } from '@vueuse/core'
import { onMounted, onUnmounted, ref, watch } from 'vue'

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

  const isAnimating = ref(false)

  function startVisualization(): void {
    if (isAnimating.value) {
      return
    }

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

      const barWidth = width.value / bufferLength.value
      let x = 0

      dataArray.value.forEach((value, i) => {
        ctx.fillStyle = `rgb(${value + i - 50},${i},${value + i})`
        ctx.fillRect(x, height.value - value / 2, 1, value / 2)
        x += barWidth + 1
      })
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
