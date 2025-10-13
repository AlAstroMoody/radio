export function drawRadial(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  centerX: number,
  centerY: number,
  bufferLength: number,
  isDark: boolean,
  visualizationIntensity: number,
): void {
  const radius = 20
  const bars = 360
  const rads = (Math.PI * 2) / bars

  for (let i = 0; i < bars; i++) {
    const barHeight = ((dataArray[i % bufferLength] || 0) * 0.4) * visualizationIntensity
    const x = centerX + Math.cos(rads * i) * radius
    const y = centerY + Math.sin(rads * i) * radius
    const xEnd = centerX + Math.cos(rads * i) * (radius + barHeight)
    const yEnd = centerY + Math.sin(rads * i) * (radius + barHeight)

    // Создаем градиент на основе интенсивности и позиции
    const intensity = Math.min(barHeight / 30, 1) // нормализуем интенсивность, ограничиваем до 1
    const hue = isDark ? 25 + intensity * 20 : 30 + intensity * 30 // в темной теме ближе к оранжевому молний
    const saturation = isDark ? 75 + intensity * 15 : 60 + intensity * 10 // больше насыщенности в темной теме
    const lightness = isDark ? 45 + intensity * 25 : 25 + intensity * 15 // ярче в темной теме

    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(xEnd, yEnd)
    ctx.stroke()
  }
}
