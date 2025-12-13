// Создает цепочку фильтров эквалайзера (басы, средние, высокие частоты) и применяет настройки из useAudioSettings
// Автоматически обновляет фильтры при изменении настроек

import type { AudioEffectBuilder } from 'app/providers/audio'
import type { Ref } from 'vue'

import { useAudioSettings } from 'composables/useAudioSettings'
import { ref, watch } from 'vue'

interface Filters {
  bass: BiquadFilterNode
  mid: BiquadFilterNode
  treble: BiquadFilterNode
}

export function useAudioEffects(): {
  effectBuilder: AudioEffectBuilder
  filters: Ref<Filters | null>
} {
  const { filterSettings } = useAudioSettings()
  const filters = ref<Filters | null>(null)

  function applyFilterSettings(nodes: Filters): void {
    const settings = filterSettings.value

    nodes.bass.gain.value = settings.bass.gain
    nodes.bass.frequency.value = settings.bass.frequency
    nodes.mid.gain.value = settings.mid.gain
    nodes.mid.frequency.value = settings.mid.frequency
    nodes.treble.gain.value = settings.treble.gain
    nodes.treble.frequency.value = settings.treble.frequency
  }

  function createFilterChain(context: AudioContext): Filters {
    const filterNodes = {
      bass: context.createBiquadFilter(),
      mid: context.createBiquadFilter(),
      treble: context.createBiquadFilter(),
    }

    filterNodes.bass.type = 'lowshelf'
    filterNodes.mid.type = 'peaking'
    filterNodes.treble.type = 'highshelf'

    return filterNodes
  }

  const effectBuilder: AudioEffectBuilder = (context, analyser) => {
    const chain = createFilterChain(context)

    try {
      analyser.disconnect()
    }
    catch {}

    analyser.connect(chain.bass)
    chain.bass.connect(chain.mid)
    chain.mid.connect(chain.treble)

    filters.value = chain
    applyFilterSettings(chain)

    return {
      cleanup: () => {
        try {
          analyser.disconnect(chain.bass)
        }
        catch {}

        chain.bass.disconnect()
        chain.mid.disconnect()
        chain.treble.disconnect()
        filters.value = null
      },
      output: chain.treble,
    }
  }

  watch(filterSettings, () => {
    if (filters.value)
      applyFilterSettings(filters.value)
  }, { deep: true })

  return {
    effectBuilder,
    filters,
  }
}
