import type { Wave } from 'music'
import type { Ref } from 'vue'
import { radioWaves } from 'music'
import { ref } from 'vue'

interface UseRadioReturn {
  activeRadio: Ref<Wave>
  changeActiveRadio: (id: number) => void
  nextRadio: () => void
  prevRadio: () => void
}

const activeRadio = ref<Wave>(radioWaves[0])
export function useRadio(): UseRadioReturn {
  const findNeighbour = (number: number): void => {
    const index = radioWaves.findIndex(
      radio => radio?.id === activeRadio.value.id,
    )
    activeRadio.value
      = number > 0
        ? radioWaves[index + number] || radioWaves[0]
        : radioWaves[index + number] || radioWaves[radioWaves.length - 1]
  }

  const nextRadio = (): void => findNeighbour(1)
  const prevRadio = (): void => findNeighbour(-1)

  const changeActiveRadio = (id: number): void => {
    const wave = radioWaves.find(radio => radio.id === id)
    if (wave)
      activeRadio.value = wave
  }

  return {
    activeRadio,
    changeActiveRadio,
    nextRadio,
    prevRadio,
  }
}
