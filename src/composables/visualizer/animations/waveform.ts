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
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const sliceWidth = width / bufferLength
  let x = 0

  // Создаем массив точек для сглаживания
  const points: { x: number, y: number }[] = []

  for (let i = 0; i < bufferLength; i++) {
    const v = (dataArray[i] / 128.0) * visualizationIntensity
    const y = (v * height) / 2
    points.push({ x, y })
    x += sliceWidth
  }

  // Рисуем сглаженную кривую
  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]

      // Вычисляем контрольные точки для кривой Безье
      const cp1x = current.x + (next.x - points[i - 1].x) * 0.25
      const cp1y = current.y + (next.y - points[i - 1].y) * 0.25

      ctx.quadraticCurveTo(cp1x, cp1y, next.x, next.y)
    }
  }

  ctx.stroke()
}
