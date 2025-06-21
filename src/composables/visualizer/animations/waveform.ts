export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  bufferLength: number,
  isDark: boolean,
  visualizationIntensity: number,
): void {
  ctx.beginPath()
  ctx.strokeStyle = isDark ? 'rgb(200, 200, 255)' : 'rgb(0, 0, 100)'
  ctx.lineWidth = 2

  const sliceWidth = width / bufferLength
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const v = (dataArray[i] / 128.0) * visualizationIntensity
    const y = (v * height) / 2

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
