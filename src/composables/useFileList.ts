import type { Ref } from 'vue'

import { computed, ref } from 'vue'

interface UseFileListReturn {
  activeFile: Ref<Blob | MediaSource>
  changeActiveFile: (index: number) => void
  files: Ref<File[]>
  nextFile: () => void
  prevFile: () => void
}

const files = ref<File[]>([])
const activeIndex = ref(0)
export function useFileList(): UseFileListReturn {
  const activeFile = computed(() => files.value[activeIndex.value] || null)

  const findNeighbour = (number: number): void => {
    activeIndex.value = (activeIndex.value + number + files.value.length) % files.value.length
  }

  const nextFile = (): void => findNeighbour(1)
  const prevFile = (): void => findNeighbour(-1)

  const changeActiveFile = (index: number): void => {
    if (index >= 0 && index < files.value.length) {
      activeIndex.value = index
    }
  }

  return {
    activeFile,
    changeActiveFile,
    files,
    nextFile,
    prevFile,
  }
}
