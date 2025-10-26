import type { Category, Wave } from 'shared/types/audio'
import type { Ref } from 'vue'

import { useStorage } from '@vueuse/core'
import { ref } from 'vue'

interface ApiResponse<T> {
  data: T
  success: boolean
}

interface StationsResponse {
  categories: Category[]
  stations: Wave[]
  total: number
}

const API_BASE_URL = 'https://' + 'actepukc90' + '.' + 'fvds' + '.' + 'ru' + '/api'

const userRadios = useStorage<Wave[]>('user-radios', [])
const categories = ref<Category[]>([])

export function getProxyUrl(stationId: number): string {
  return `${API_BASE_URL}/proxy/${stationId}`
}

export async function loadStations(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/stations`)
    const data: ApiResponse<StationsResponse> = await response.json()

    if (data.success) {
      const waves: Wave[] = data.data.stations.map(station => ({
        category: station.category,
        description: station.description,
        id: station.id,
        name: station.name,
        src: `${API_BASE_URL}/proxy/${station.id}`,
      }))

      if (userRadios.value.length > 0) {
        const savedOrder = userRadios.value.map(radio => radio.id)
        const sortedWaves = waves.sort((a, b) => {
          const indexA = savedOrder.indexOf(a.id)
          const indexB = savedOrder.indexOf(b.id)
          if (indexA !== -1 && indexB !== -1)
            return indexA - indexB
          if (indexA !== -1)
            return -1
          if (indexB !== -1)
            return 1
          return 0
        })
        userRadios.value = sortedWaves
      }
      else {
        userRadios.value = waves
      }

      categories.value = data.data.categories
    }
  }
  catch {
    userRadios.value = []
  }
}

export function useMusicStore(): {
  categories: Ref<Category[]>
  getProxyUrl: (stationId: number) => string
  loadStations: () => Promise<void>
  userRadios: Ref<Wave[]>
} {
  return {
    categories,
    getProxyUrl,
    loadStations,
    userRadios,
  }
}
