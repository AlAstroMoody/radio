import { parseBlob } from 'music-metadata'

const coverCache = new Map<string, string>()

export function clearAudioCoverCache(): void {
  for (const url of coverCache.values())
    URL.revokeObjectURL(url)
  coverCache.clear()
}

/**
 * Extracts embedded cover art from an audio file as a blob: URL.
 * Results are cached per file identity; call revokeAudioCoverUrl when discarding.
 */
export async function extractAudioCoverUrl(file: File): Promise<string | undefined> {
  const key = cacheKey(file)
  const cached = coverCache.get(key)
  if (cached)
    return cached

  try {
    const { common } = await parseBlob(file, { duration: false })
    const picture = common.picture?.[0]
    if (!picture?.data)
      return undefined

    const bytes = picture.data instanceof Uint8Array
      ? picture.data
      : new Uint8Array(picture.data as ArrayBuffer)

    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    const blob = new Blob([copy], { type: picture.format || 'image/jpeg' })
    const url = URL.createObjectURL(blob)
    coverCache.set(key, url)
    return url
  }
  catch {
    return undefined
  }
}

export function revokeAudioCoverUrl(file: File): void {
  const key = cacheKey(file)
  const url = coverCache.get(key)
  if (!url)
    return

  URL.revokeObjectURL(url)
  coverCache.delete(key)
}

function cacheKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}
