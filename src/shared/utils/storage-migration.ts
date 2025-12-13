/**
 * Миграция старых ключей localStorage в новые
 * Выполняется один раз при старте приложения
 */

const MIGRATION_VERSION_KEY = 'storage-migration-version'
const CURRENT_MIGRATION_VERSION = 1

// Старые ключи, которые нужно удалить или мигрировать
const OLD_KEYS_TO_REMOVE = [
  'radioPositions', // Позиции радио больше не сохраняются
  'active-radio', // Заменен на 'active-radio-id' (только ID, не объект)
]

// Ключи для миграции данных (старый -> новый)
const MIGRATION_MAP: Record<string, string> = {
  // 'old-key': 'new-key' - пример, если нужно перенести данные
}

export function runStorageMigration(): void {
  if (typeof window === 'undefined')
    return

  const lastVersion = localStorage.getItem(MIGRATION_VERSION_KEY)
  const lastVersionNum = lastVersion ? Number.parseInt(lastVersion, 10) : 0

  // Если миграция уже выполнена для текущей версии, пропускаем
  if (lastVersionNum >= CURRENT_MIGRATION_VERSION)
    return

  // Удаляем старые ключи
  for (const oldKey of OLD_KEYS_TO_REMOVE) {
    if (localStorage.getItem(oldKey) !== null) {
      localStorage.removeItem(oldKey)
    }
  }

  // Мигрируем данные (если нужно)
  for (const [oldKey, newKey] of Object.entries(MIGRATION_MAP)) {
    const oldValue = localStorage.getItem(oldKey)
    if (oldValue !== null) {
      const newValue = localStorage.getItem(newKey)
      // Мигрируем только если новый ключ еще не существует
      if (newValue === null) {
        localStorage.setItem(newKey, oldValue)
      }
      localStorage.removeItem(oldKey)
    }
  }

  // Сохраняем версию миграции
  localStorage.setItem(MIGRATION_VERSION_KEY, String(CURRENT_MIGRATION_VERSION))
}
