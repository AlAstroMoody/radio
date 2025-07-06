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

    ctx.strokeStyle = isDark ? `rgb(150, ${150 + barHeight}, 255)` : `rgb(50, ${50 + barHeight}, 150)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(xEnd, yEnd)
    ctx.stroke()
  }
}
