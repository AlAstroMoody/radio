// Singleton для работы с радиостанциями: переключение станций, навигация (next/prev),
// переупорядочивание, переключение режима радио/музыка. Все методы проксируются из stores

import type { Wave } from 'shared/types/audio'
import type { Ref } from 'vue'

import { storeToRefs } from 'pinia'
import { usePlaybackStore, useStationsStore } from 'stores'

interface UseRadioReturn {
  activeRadio: Ref<undefined | Wave>
  changeActiveRadio: (id: number) => void
  isRadioMode: Ref<boolean>
  nextRadio: () => void
  prevRadio: () => void
  reorderRadios: (fromIndex: number, toIndex: number) => void
  toggleMode: () => void
}

let radioInstance: null | UseRadioReturn = null

export function useRadio(): UseRadioReturn {
  if (radioInstance)
    return radioInstance

  const playbackStore = usePlaybackStore()
  const stationsStore = useStationsStore()

  const { activeRadio } = storeToRefs(stationsStore)
  const { isRadioMode } = storeToRefs(playbackStore)

  radioInstance = {
    activeRadio,
    changeActiveRadio: stationsStore.changeActiveRadio,
    isRadioMode,
    nextRadio: stationsStore.nextRadio,
    prevRadio: stationsStore.prevRadio,
    reorderRadios: stationsStore.reorderRadios,
    toggleMode: playbackStore.toggleMode,
  }

  return radioInstance
}
