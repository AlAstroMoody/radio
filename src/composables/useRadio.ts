import type { Wave } from 'music'
import type { Ref } from 'vue'

import { useStorage } from '@vueuse/core'
import { radioWaves } from 'music'
import { ref } from 'vue'

interface UseRadioReturn {
  activeRadio: Ref<Wave>
  changeActiveRadio: (id: number) => void
  isRadioMode: Ref<boolean>
  nextRadio: () => void
  prevRadio: () => void
  reorderRadios: (fromIndex: number, toIndex: number) => void
  toggleMode: () => void
  userRadios: Ref<Wave[]>
}

const activeRadio = ref<Wave>(radioWaves[0])
const isRadioMode = useStorage('radio-mode', true)
const userRadios = useStorage<Wave[]>('user-radios', radioWaves)

export function useRadio(): UseRadioReturn {
  const findNeighbour = (number: number): void => {
    const index = userRadios.value.findIndex(
      radio => radio?.id === activeRadio.value.id,
    )
    activeRadio.value
      = number > 0
        ? userRadios.value[index + number] || userRadios.value[0]
        : userRadios.value[index + number] || userRadios.value[userRadios.value.length - 1]
  }

  const nextRadio = (): void => findNeighbour(1)
  const prevRadio = (): void => findNeighbour(-1)

  const changeActiveRadio = (id: number): void => {
    const wave = userRadios.value.find(radio => radio.id === id)
    if (wave)
      activeRadio.value = wave
  }

  const reorderRadios = (fromIndex: number, toIndex: number): void => {
    if (fromIndex === toIndex)
      return

    const radios = [...userRadios.value]
    const [movedRadio] = radios.splice(fromIndex, 1)
    radios.splice(toIndex, 0, movedRadio)

    userRadios.value = radios
  }

  const toggleMode = (): void => {
    isRadioMode.value = !isRadioMode.value
  }

  return {
    activeRadio,
    changeActiveRadio,
    isRadioMode,
    nextRadio,
    prevRadio,
    reorderRadios,
    toggleMode,
    userRadios,
  }
}
