import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'

interface UseVisualizerReturn {
  startVisualization: () => void
  stopVisualization: () => void
}

export function useVisualizer(
  canvas: Ref<HTMLCanvasElement | null>,
  analyser: Ref<AnalyserNode | null>,
): UseVisualizerReturn {
  const width = ref(400)
  const height = ref(256)
  const bufferLength = ref(1)
  const dataArray = ref<Uint8Array | null>(null)
  const rafId = ref(0)

  onMounted(() => {
    if (canvas.value) {
      width.value = canvas.value.width
      height.value = canvas.value.height
    }
  })

  function startVisualization(): void {
    if (!analyser.value)
      return

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
    cancelAnimationFrame(rafId.value)
  }

  return {
    startVisualization,
    stopVisualization,
  }
}
