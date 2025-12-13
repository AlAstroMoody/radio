import type { Category, Wave } from 'shared/types/audio'

import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { usePlaybackStore } from './playback'

interface ApiResponse<T> {
  data: T
  success: boolean
}

interface StationDto extends Wave {
  [key: string]: unknown
}

interface StationsResponse {
  categories: Category[]
  stations: StationDto[]
  total: number
}

const API_BASE_URL = 'https://' + 'actepukc90' + '.' + 'fvds' + '.' + 'ru' + '/api'
const STATIONS_CACHE_TTL = 60_000

export const useStationsStore = defineStore('stations', () => {
  const userRadios = useStorage<Wave[]>('user-radios', [])
  const categories = ref<Category[]>([])
  const isStationsLoading = ref(false)
  const stationsError = ref<null | string>(null)
  const lastStationsFetchAt = ref<null | number>(null)

  const activeRadio = ref<undefined | Wave>()

  const playbackStore = usePlaybackStore()

  watch(
    [() => playbackStore.activeRadioId, userRadios],
    () => {
      if (!userRadios.value.length) {
        activeRadio.value = undefined
        return
      }

      const targetId = playbackStore.activeRadioId
      const matched = userRadios.value.find(radio => radio.id === targetId)

      if (matched) {
        if (activeRadio.value?.id !== matched.id)
          activeRadio.value = matched
        return
      }

      if (userRadios.value[0]) {
        activeRadio.value = userRadios.value[0]
        playbackStore.setActiveRadioId(userRadios.value[0].id)
      }
    },
    { immediate: true },
  )

  watch(
    activeRadio,
    (wave, prevWave) => {
      if (wave && wave.id !== prevWave?.id) {
        playbackStore.setActiveRadioId(wave.id)
        return
      }

      if (!wave && userRadios.value.length > 0 && !prevWave) {
        activeRadio.value = userRadios.value[0]
        playbackStore.setActiveRadioId(userRadios.value[0].id)
      }
    },
  )

  function setUserRadios(radios: Wave[]): void {
    if (!haveStationsChanged(userRadios.value, radios))
      return

    userRadios.value = radios
  }

  function getProxyUrl(stationId: number): string {
    return `${API_BASE_URL}/proxy/${stationId}`
  }

  async function fetchStations(options: { force?: boolean } = {}): Promise<void> {
    const { force = false } = options

    if (isStationsLoading.value)
      return

    const now = Date.now()
    const hasCache = userRadios.value.length > 0 && categories.value.length > 0
    const isCacheFresh = lastStationsFetchAt.value !== null && (now - lastStationsFetchAt.value) < STATIONS_CACHE_TTL

    if (!force && hasCache && isCacheFresh)
      return

    isStationsLoading.value = true
    stationsError.value = null

    try {
      const response = await fetch(`${API_BASE_URL}/stations`)
      if (!response.ok)
        throw new Error(`HTTP ${response.status}`)

      const data: ApiResponse<StationsResponse> = await response.json()
      if (!data.success)
        throw new Error('Не удалось получить список станций')

      const normalizedStations = data.data.stations.map(station => normalizeStation(station))
      const orderedStations = mergeWithSavedOrder(userRadios.value, normalizedStations)

      if (haveStationsChanged(userRadios.value, orderedStations))
        userRadios.value = orderedStations

      if (haveCategoriesChanged(categories.value, data.data.categories))
        categories.value = data.data.categories

      lastStationsFetchAt.value = now
    }
    catch (error) {
      stationsError.value = error instanceof Error ? error.message : String(error)
      if (!userRadios.value.length)
        userRadios.value = []
    }
    finally {
      isStationsLoading.value = false
    }
  }

  // Методы навигации по радиостанциям
  function changeActiveRadio(id: number): void {
    const wave = userRadios.value.find(radio => radio.id === id)
    if (wave)
      activeRadio.value = wave
  }

  function findNeighbour(offset: number): void {
    const index = userRadios.value.findIndex(
      radio => radio?.id === activeRadio.value?.id,
    )
    activeRadio.value
      = offset > 0
        ? userRadios.value[index + offset] || userRadios.value[0]
        : userRadios.value[index + offset] || userRadios.value[userRadios.value.length - 1]
  }

  function nextRadio(): void {
    findNeighbour(1)
  }

  function prevRadio(): void {
    findNeighbour(-1)
  }

  function reorderRadios(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex)
      return

    const radios = [...userRadios.value]
    const [movedRadio] = radios.splice(fromIndex, 1)
    radios.splice(toIndex, 0, movedRadio)

    setUserRadios(radios)
  }

  return {
    activeRadio,
    categories,
    changeActiveRadio,
    fetchStations,
    getProxyUrl,
    isStationsLoading,
    lastStationsFetchAt,
    nextRadio,
    prevRadio,
    reorderRadios,
    setUserRadios,
    stationsError,
    userRadios,
  }
})

function haveCategoriesChanged(current: Category[], next: Category[]): boolean {
  if (current === next)
    return false

  if (current.length !== next.length)
    return true

  for (let index = 0; index < current.length; index++) {
    const prev = current[index]
    const incoming = next[index]

    if (
      prev.id !== incoming.id
      || prev.name !== incoming.name
      || prev.description !== incoming.description
    ) {
      return true
    }
  }

  return false
}

function haveStationsChanged(current: Wave[], next: Wave[]): boolean {
  if (current === next)
    return false

  if (current.length !== next.length)
    return true

  for (let index = 0; index < current.length; index++) {
    const prev = current[index]
    const incoming = next[index]

    if (
      prev.id !== incoming.id
      || prev.name !== incoming.name
      || prev.src !== incoming.src
      || prev.category !== incoming.category
      || prev.description !== incoming.description
    ) {
      return true
    }
  }

  return false
}

function mergeWithSavedOrder(saved: Wave[], incoming: Wave[]): Wave[] {
  if (!saved.length)
    return incoming

  const savedOrder = new Map<number, number>()
  saved.forEach((wave, index) => {
    savedOrder.set(wave.id, index)
  })

  return incoming
    .map((wave, index) => {
      const savedIndex = savedOrder.get(wave.id)
      return {
        wave,
        weight: savedIndex ?? savedOrder.size + index,
      }
    })
    .sort((a, b) => a.weight - b.weight)
    .map(entry => entry.wave)
}

function normalizeStation(station: StationDto): Wave {
  return {
    category: station.category,
    description: station.description,
    id: station.id,
    name: station.name,
    src: `${API_BASE_URL}/proxy/${station.id}`,
  }
}
