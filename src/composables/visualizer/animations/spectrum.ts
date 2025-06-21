export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  bufferLength: number,
  isDark: boolean,
  visualizationIntensity: number,
): void {
  const barWidth = width / bufferLength
  let x = 0

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, isDark ? 'rgb(255, 100, 100)' : 'rgb(150, 0, 0)')
  gradient.addColorStop(1, isDark ? 'rgb(100, 255, 100)' : 'rgb(0, 150, 0)')

  dataArray.forEach((value) => {
    const barHeight = (value / 255) * (height / 2) * visualizationIntensity
    ctx.fillStyle = gradient
    ctx.fillRect(
      x,
      (height - barHeight),
      barWidth,
      barHeight,
    )
    ctx.shadowBlur = 10
    ctx.shadowColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
    x += barWidth
  })
}
