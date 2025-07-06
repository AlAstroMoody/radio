// Кэш градиентов для spectrum анимации
const spectrumGradientCache = new Map<string, CanvasGradient>()

// Функция для очистки кэша при смене темы
export function clearSpectrumGradientCache(): void {
  spectrumGradientCache.clear()
}

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

    // Создаем ключ для кэша градиента
    const hue = Math.round((index / bufferLength) * 360)
    const cacheKey = `${hue}-${isDark}-${width}-${barHeight}`

    let gradient = spectrumGradientCache.get(cacheKey)

    if (!gradient) {
      // Создаем новый градиент только если его нет в кэше
      gradient = ctx.createLinearGradient(0, y, width, y + barHeight)
      gradient.addColorStop(0, isDark ? `hsla(${hue}, 80%, 70%, 0.9)` : `hsla(${hue}, 80%, 50%, 0.9)`)
      gradient.addColorStop(0.5, isDark ? `hsla(${hue}, 80%, 50%, 0.7)` : `hsla(${hue}, 80%, 70%, 0.7)`)
      gradient.addColorStop(1, isDark ? `hsla(${hue}, 80%, 30%, 0.5)` : `hsla(${hue}, 80%, 90%, 0.5)`)

      // Ограничиваем размер кэша
      if (spectrumGradientCache.size > 100) {
        const firstKey = spectrumGradientCache.keys().next().value
        if (firstKey) {
          spectrumGradientCache.delete(firstKey)
        }
      }

      spectrumGradientCache.set(cacheKey, gradient)
    }

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
