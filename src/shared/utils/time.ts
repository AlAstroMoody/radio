/**
 * Форматирует время в секундах в формат "м:сс"
 * @param seconds - время в секундах
 * @returns отформатированная строка времени
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const truncatedSeconds = Math.trunc(seconds)
  const minutes = Math.floor(truncatedSeconds / 60)
  const remainingSeconds = truncatedSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Кэш для длительности файлов
const durationCache = new Map<string, number>()

/**
 * Получает длительность аудиофайла (с кэшированием)
 * @param file - аудиофайл
 * @returns Promise с длительностью в секундах
 */
export function getAudioDuration(file: File): Promise<number> {
  const fileName = file.name

  // Возвращаем из кэша если есть
  if (durationCache.has(fileName)) {
    return Promise.resolve(durationCache.get(fileName)!)
  }

  return new Promise((resolve) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      const duration = audio.duration || 0
      durationCache.set(fileName, duration)
      resolve(duration)
    })

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      durationCache.set(fileName, 0)
      resolve(0)
    })

    audio.src = url
  })
}

/**
 * Получает длительность из кэша (синхронно)
 * @param fileName - имя файла
 * @returns длительность в секундах или undefined если не загружена
 */
export function getCachedDuration(fileName: string): number | undefined {
  return durationCache.get(fileName)
}
