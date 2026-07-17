import type { MaybeRefOrGetter, Ref } from 'vue'

import { extractAudioCoverUrl } from 'shared/utils/audio-cover'
import { computed, ref, toValue, watch } from 'vue'

export function useMusicCover(
  file: MaybeRefOrGetter<File | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
): {
  coverTitle: Ref<string>
  coverUrl: Ref<string | undefined>
  hasCover: Ref<boolean>
} {
  const coverUrl = ref<string>()
  let requestId = 0

  const coverTitle = computed(() => {
    const current = toValue(file)
    if (!current)
      return 'Cover art'
    return current.name.replace(/\.[^/.]+$/, '') || current.name
  })

  const hasCover = computed(() => !!coverUrl.value)

  watch(
    [() => toValue(file), () => toValue(enabled)],
    async ([current, isEnabled]) => {
      const token = ++requestId
      coverUrl.value = undefined

      if (!isEnabled || !current)
        return

      const url = await extractAudioCoverUrl(current)
      if (token !== requestId)
        return

      coverUrl.value = url
    },
    { flush: 'post', immediate: true },
  )

  return {
    coverTitle,
    coverUrl,
    hasCover,
  }
}
