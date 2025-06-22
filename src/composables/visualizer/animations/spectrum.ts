export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  bufferLength: number,
  isDark: boolean,
  visualizationIntensity: number,
): void {
  const barHeight = height / bufferLength
  let y = 0

  dataArray.forEach((value, index) => {
    const barWidth = (value / 255) * (width / 2) * visualizationIntensity

    // Создаем радужный градиент для каждой полоски
    const gradient = ctx.createLinearGradient(0, y, width, y + barHeight)
    const hue = (index / bufferLength) * 360
    gradient.addColorStop(0, isDark ? `hsla(${hue}, 80%, 70%, 0.9)` : `hsla(${hue}, 80%, 50%, 0.9)`)
    gradient.addColorStop(0.5, isDark ? `hsla(${hue}, 80%, 50%, 0.7)` : `hsla(${hue}, 80%, 70%, 0.7)`)
    gradient.addColorStop(1, isDark ? `hsla(${hue}, 80%, 30%, 0.5)` : `hsla(${hue}, 80%, 90%, 0.5)`)

    ctx.fillStyle = gradient
    ctx.fillRect(
      (width / 2) - barWidth,
      y,
      barWidth * 2,
      barHeight - 1,
    )
    ctx.shadowBlur = 8
    ctx.shadowColor = isDark ? `hsla(${hue}, 80%, 90%, 0.6)` : `hsla(${hue}, 80%, 30%, 0.6)`
    y += barHeight
  })
}
