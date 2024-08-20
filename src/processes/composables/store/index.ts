import { ref } from 'vue'
import { radioWaves, Wave } from 'processes'

const isRadioMode = ref(true)
const activeRadio = ref<Wave>(radioWaves[0])
const isActivePlaylist = ref(false)

export const useGlobalState = () => {
  const findNeighbour = (number: number) => {
    const index = radioWaves.findIndex(
      (radio) => radio?.id === activeRadio.value.id
    )
    activeRadio.value =
      number > 0
        ? radioWaves[index + number] || radioWaves[0]
        : radioWaves[index + number] || radioWaves[radioWaves.length - 1]
  }

  const nextRadio = () => findNeighbour(1)
  const prevRadio = () => findNeighbour(-1)
  function changeActiveRadio(id: number) {
    const wave = radioWaves.find((radio) => radio.id === id)
    if (wave) activeRadio.value = wave
  }

  function changeMode() {
    isRadioMode.value = !isRadioMode.value
  }

  function togglePlaylist() {
    isActivePlaylist.value = !isActivePlaylist.value
  }

  return {
    activeRadio,
    changeActiveRadio,
    nextRadio,
    prevRadio,
    isRadioMode,
    changeMode,
    isActivePlaylist,
    togglePlaylist,
  }
}
