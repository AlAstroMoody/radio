import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { radioList } from 'processes'

export const useGlobalState = createGlobalState(() => {
  const activeRadio = ref<number | undefined>(radioList[0].id)

  const changeActiveRadio = (id: number): void => {
    activeRadio.value = radioList.find(radio => radio.id === id)?.id
  }

  const findNeighbour = (number: number) => {
    const index = radioList.findIndex(
      radio => radio?.id === activeRadio.value,
    )
    activeRadio.value
      = number > 0
        ? radioList[index + number]?.id || radioList[0]?.id
        : radioList[index + number]?.id || radioList[radioList.length - 1]?.id
  }

  const nextRadio = () => findNeighbour(1)
  const prevRadio = () => findNeighbour(-1)

  return { activeRadio, changeActiveRadio, nextRadio, prevRadio }
})
