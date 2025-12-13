// Получает AudioController из провайдера (inject). Используется для доступа к основному контроллеру аудио
// из любого компонента внутри AudioRoot

import type { AudioController } from 'app/providers/audio'

import { audioControllerKey } from 'app/providers/audio'
import { inject } from 'vue'

export function useAudioController(required = true): AudioController | null {
  const controller = inject(audioControllerKey, null)

  if (!controller && required) {
    throw new Error('AudioController не найден!')
  }

  return controller
}

export function useAudioControllerRequired(): AudioController {
  const controller = inject(audioControllerKey, null)

  if (!controller) {
    throw new Error('AudioController не найден!')
  }

  return controller
}
