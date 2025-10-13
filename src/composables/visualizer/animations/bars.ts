export function drawBars(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  bufferLength: number,
  isDark: boolean,
  visualizationIntensity: number,
): void {
  const barWidth = width * 1.1 / bufferLength
  let x = 0

  ctx.fillStyle = isDark ? 'rgb(221, 132, 72)' : 'rgb(180, 100, 50)'
  dataArray.forEach((value) => {
    const barHeight = (value / 255) * (height / 2) * visualizationIntensity
    ctx.fillRect(
      x,
      (height - barHeight),
      barWidth,
      barHeight,
    )
    x += barWidth
  })
}
