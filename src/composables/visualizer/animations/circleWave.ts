// Кэш градиентов для circleWave анимации
const circleWaveGradientCache = new Map<string, CanvasGradient>()

// Функция для очистки кэша при смене темы
export function clearCircleWaveGradientCache(): void {
  circleWaveGradientCache.clear()
}

export function drawCircleWave(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  centerX: number,
  centerY: number,
  isDark: boolean,
  visualizationIntensity: number,
): void {
  const lowFreqData = dataArray.slice(0, 10)
  const midFreqData = dataArray.slice(10, 30)
  const highFreqData = dataArray.slice(30, 50)

  const lowIntensity = (lowFreqData.reduce((sum, val) => sum + val, 0) / lowFreqData.length) * visualizationIntensity
  const midIntensity = (midFreqData.reduce((sum, val) => sum + val, 0) / midFreqData.length) * visualizationIntensity
  const highIntensity = (highFreqData.reduce((sum, val) => sum + val, 0) / highFreqData.length) * visualizationIntensity

  const baseRadius = 40
  const time = Date.now() * 0.001

  // Основной круг с пульсацией
  const mainRadius = baseRadius + lowIntensity / 8 + Math.sin(time * 2) * 5
  ctx.beginPath()
  ctx.arc(centerX, centerY, mainRadius, 0, Math.PI * 2)

  // Кэшируем градиент для основного круга
  const radiusKey = Math.round(mainRadius)
  const cacheKey = `${radiusKey}-${isDark}-${centerX}-${centerY}`

  let mainGradient = circleWaveGradientCache.get(cacheKey)

  if (!mainGradient) {
    mainGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      mainRadius,
    )
    mainGradient.addColorStop(0, isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')
    mainGradient.addColorStop(0.7, isDark ? 'rgba(100, 150, 255, 0.4)' : 'rgba(50, 100, 150, 0.4)')
    mainGradient.addColorStop(1, 'transparent')

    // Ограничиваем размер кэша
    if (circleWaveGradientCache.size > 50) {
      const firstKey = circleWaveGradientCache.keys().next().value
      if (firstKey) {
        circleWaveGradientCache.delete(firstKey)
      }
    }

    circleWaveGradientCache.set(cacheKey, mainGradient)
  }

  ctx.fillStyle = mainGradient
  ctx.fill()

  // Внешний круг с эффектом волны
  const waveRadius = mainRadius + 20 + midIntensity / 6
  ctx.beginPath()
  ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2)
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Волнистый круг с высокими частотами
  const waveCount = 8
  ctx.beginPath()
  for (let i = 0; i <= waveCount; i++) {
    const angle = (i / waveCount) * Math.PI * 2
    const waveOffset = Math.sin(angle * 3 + time * 3) * (highIntensity / 10)
    const radius = waveRadius + 15 + waveOffset
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    if (i === 0) {
      ctx.moveTo(x, y)
    }
    else {
      ctx.lineTo(x, y)
    }
  }

  ctx.closePath()
  ctx.strokeStyle = isDark ? 'rgba(255, 100, 255, 0.6)' : 'rgba(150, 50, 150, 0.6)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Точки вокруг круга
  const dotCount = 12
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 + time
    const dotRadius = waveRadius + 25 + Math.sin(angle * 2 + time * 4) * 8
    const x = centerX + Math.cos(angle) * dotRadius
    const y = centerY + Math.sin(angle) * dotRadius
    const dotSize = 2 + Math.sin(angle * 3 + time * 2) * 2

    ctx.beginPath()
    ctx.arc(x, y, dotSize, 0, Math.PI * 2)
    ctx.fillStyle = isDark
      ? `rgba(255, ${100 + Math.sin(angle) * 155}, 255, ${0.3 + Math.sin(time) * 0.3})`
      : `rgba(100, ${50 + Math.sin(angle) * 100}, 150, ${0.3 + Math.sin(time) * 0.3})`
    ctx.fill()
  }

  // Внутренние кольца с пульсацией
  for (let ring = 1; ring <= 3; ring++) {
    const ringRadius = baseRadius * 0.3 * ring + Math.sin(time * 3 + ring) * 3
    ctx.beginPath()
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
    ctx.strokeStyle = isDark
      ? `rgba(255, 255, 255, ${0.1 + Math.sin(time + ring) * 0.1})`
      : `rgba(0, 0, 0, ${0.1 + Math.sin(time + ring) * 0.1})`
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // Центральная точка с пульсацией
  const centerPulse = 3 + Math.sin(time * 4) * 2 + lowIntensity / 20
  ctx.beginPath()
  ctx.arc(centerX, centerY, centerPulse, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
  ctx.fill()

  // Дополнительные лучи от центра
  const rayCount = 6
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + time * 0.5
    const rayLength = 15 + Math.sin(angle * 2 + time * 2) * 5 + midIntensity / 15
    const endX = centerX + Math.cos(angle) * rayLength
    const endY = centerY + Math.sin(angle) * rayLength

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(endX, endY)
    ctx.strokeStyle = isDark
      ? `rgba(255, 200, 255, ${0.3 + Math.sin(time + i) * 0.2})`
      : `rgba(100, 50, 100, ${0.3 + Math.sin(time + i) * 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
}
