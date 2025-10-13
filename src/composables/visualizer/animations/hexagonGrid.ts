// Кэш градиентов для hexagonGrid анимации
const hexagonGradientCache = new Map<string, CanvasGradient>()

// Функция для очистки кэша при смене темы
export function clearHexagonGradientCache(): void {
  hexagonGradientCache.clear()
}

export function drawHexagonGrid(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array<ArrayBuffer>,
  width: number,
  height: number,
  bufferLength: number,
  isDark: boolean,
  visualizationIntensity: number,
): void {
  ctx.clearRect(0, 0, width, height)

  // Разделяем частоты на группы
  const lowFreqData = dataArray.slice(0, Math.floor(bufferLength * 0.3))
  const midFreqData = dataArray.slice(Math.floor(bufferLength * 0.3), Math.floor(bufferLength * 0.7))
  const highFreqData = dataArray.slice(Math.floor(bufferLength * 0.7), bufferLength)

  const lowIntensity = (lowFreqData.reduce((sum, val) => sum + val, 0) / lowFreqData.length) / 255 * visualizationIntensity
  const midIntensity = (midFreqData.reduce((sum, val) => sum + val, 0) / midFreqData.length) / 255 * visualizationIntensity
  const highIntensity = (highFreqData.reduce((sum, val) => sum + val, 0) / highFreqData.length) / 255 * visualizationIntensity

  // Параметры сетки - делаем шестиугольники меньше для более плотной сетки
  const hexSize = 18
  const hexWidth = hexSize * Math.sqrt(3)
  const hexHeight = hexSize * 2

  const cols = Math.ceil(width / (hexWidth * 0.75)) + 3
  const rows = Math.ceil(height / (hexHeight * 0.5)) + 3

  // Создаем массив для хранения интенсивности каждого шестиугольника
  const hexIntensities: number[][] = []
  const hexColors: string[][] = []

  // Сначала вычисляем интенсивность для каждого шестиугольника
  for (let row = 0; row < rows; row++) {
    hexIntensities[row] = []
    hexColors[row] = []
    for (let col = 0; col < cols; col++) {
      const offsetX = (row % 2) * (hexWidth * 0.375)
      const x = col * hexWidth * 0.75 + offsetX
      const y = row * hexHeight * 0.5

      const distanceFromCenter = Math.sqrt(
        (x - width / 2) ** 2 + (y - height / 2) ** 2,
      )
      const maxDistance = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
      const normalizedDistance = distanceFromCenter / maxDistance

      // Плавный градиент от центра к краям
      let intensity = 0

      if (normalizedDistance < 0.3) {
        const centerWeight = 1 - (normalizedDistance / 0.3)
        const midWeight = normalizedDistance / 0.3
        intensity = lowIntensity * centerWeight + midIntensity * midWeight * 0.3
      }
      else if (normalizedDistance < 0.7) {
        const midWeight = 1 - ((normalizedDistance - 0.3) / 0.4)
        const lowWeight = Math.max(0, 1 - (normalizedDistance - 0.2) / 0.2) * 0.3
        const highWeight = Math.max(0, (normalizedDistance - 0.5) / 0.2) * 0.3
        intensity = midIntensity * midWeight + lowIntensity * lowWeight + highIntensity * highWeight
      }
      else {
        const highWeight = 1 - ((normalizedDistance - 0.7) / 0.3)
        const midWeight = (normalizedDistance - 0.7) / 0.3
        intensity = highIntensity * highWeight + midIntensity * midWeight * 0.3
      }

      hexIntensities[row][col] = intensity

      // Вычисляем цвет для этого шестиугольника
      const redWeight = Math.max(0, 1 - normalizedDistance * 2)
      const greenWeight = Math.max(0, 1 - Math.abs(normalizedDistance - 0.5) * 2)
      const blueWeight = Math.max(0, (normalizedDistance - 0.5) * 2)

      const totalWeight = redWeight + greenWeight + blueWeight
      const normalizedRed = redWeight / totalWeight
      const normalizedGreen = greenWeight / totalWeight
      const normalizedBlue = blueWeight / totalWeight

      const r = Math.round(255 * normalizedRed + 100 * normalizedGreen + 100 * normalizedBlue)
      const g = Math.round(100 * normalizedRed + 255 * normalizedGreen + 100 * normalizedBlue)
      const b = Math.round(100 * normalizedRed + 100 * normalizedGreen + 255 * normalizedBlue)

      hexColors[row][col] = isDark
        ? `rgb(${r}, ${g}, ${b})`
        : `rgb(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)})`
    }
  }

  // Рисуем полноценную сетку шестиугольников
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (row % 2) * (hexWidth * 0.375)
      const x = col * hexWidth * 0.75 + offsetX
      const y = row * hexHeight * 0.5

      // Проверяем, находится ли шестиугольник в пределах canvas
      if (x < -hexSize || x > width + hexSize || y < -hexSize || y > height + hexSize) {
        continue
      }

      const intensity = hexIntensities[row][col]
      const color = hexColors[row][col]

      // Рисуем шестиугольник только если есть интенсивность
      if (intensity > 0.05) {
        drawHexagonInGrid(ctx, x, y, hexSize, intensity, color, isDark)
      }
    }
  }

  // Рисуем границы сетки между активными шестиугольниками
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (row % 2) * (hexWidth * 0.375)
      const x = col * hexWidth * 0.75 + offsetX
      const y = row * hexHeight * 0.5

      if (x < -hexSize || x > width + hexSize || y < -hexSize || y > height + hexSize) {
        continue
      }

      const intensity = hexIntensities[row][col]
      if (intensity <= 0.05)
        continue

      // Определяем соседей для гексагональной сетки
      const neighbors = [
        { col: col + 1, dx: hexWidth * 0.75, dy: 0, row }, // правый
        { col: col + (row % 2), dx: hexWidth * 0.375, dy: hexHeight * 0.5, row: row + 1 }, // правый нижний
        { col: col - 1 + (row % 2), dx: -hexWidth * 0.375, dy: hexHeight * 0.5, row: row + 1 }, // левый нижний
      ]

      for (const neighbor of neighbors) {
        const neighborRow = neighbor.row
        const neighborCol = neighbor.col

        // Проверяем, что сосед существует и активен
        if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
          const neighborIntensity = hexIntensities[neighborRow][neighborCol]

          if (neighborIntensity > 0.05) {
            const neighborX = x + neighbor.dx
            const neighborY = y + neighbor.dy

            // Рисуем границу между шестиугольниками
            const lineAlpha = Math.min((intensity + neighborIntensity) * 0.4, 0.6)
            const lineColor = isDark
              ? `rgba(255, 255, 255, ${lineAlpha})`
              : `rgba(0, 0, 0, ${lineAlpha})`

            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(neighborX, neighborY)
            ctx.strokeStyle = lineColor
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
    }
  }
}

// Функция для рисования шестиугольника в полноценной сетке
function drawHexagonInGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  intensity: number,
  color: string,
  isDark: boolean,
): void {
  const hexSize = size * (0.3 + intensity * 0.7)

  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const hexX = x + Math.cos(angle) * hexSize
    const hexY = y + Math.sin(angle) * hexSize

    if (i === 0) {
      ctx.moveTo(hexX, hexY)
    }
    else {
      ctx.lineTo(hexX, hexY)
    }
  }
  ctx.closePath()

  // Создаем градиент для шестиугольника
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize)
  const alpha = 0.2 + intensity * 0.8

  // Используем переданный цвет с прозрачностью
  const baseColor = color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
  const midColor = color.replace('rgb', 'rgba').replace(')', `, ${alpha * 0.7})`)
  const edgeColor = color.replace('rgb', 'rgba').replace(')', `, ${alpha * 0.3})`)

  gradient.addColorStop(0, baseColor)
  gradient.addColorStop(0.5, midColor)
  gradient.addColorStop(1, edgeColor)

  ctx.fillStyle = gradient
  ctx.fill()

  // Добавляем обводку
  ctx.strokeStyle = isDark
    ? `rgba(255, 255, 255, ${0.1 + intensity * 0.2})`
    : `rgba(0, 0, 0, ${0.1 + intensity * 0.2})`
  ctx.lineWidth = 1
  ctx.stroke()
}
