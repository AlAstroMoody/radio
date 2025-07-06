import type { Ref } from 'vue'

import { computed, ref } from 'vue'

interface UseFileListReturn {
  activeFile: Ref<Blob | MediaSource>
  changeActiveFile: (index: number) => void
  files: Ref<File[]>
  isRepeat: Ref<boolean>
  isShuffle: Ref<boolean>
  nextFile: () => void
  prevFile: () => void
  shuffleFiles: () => void
  toggleRepeat: () => void
  updateFiles: (newFiles: File[]) => void
  updateFilesWithoutReset: (newFiles: File[]) => void
}

const files = ref<File[]>([])
const originalFiles = ref<File[]>([])
const activeIndex = ref(0)
const isShuffle = ref(false)
const isRepeat = ref(false)

export function useFileList(): UseFileListReturn {
  const activeFile = computed(() => files.value[activeIndex.value] || null)

  const findNeighbour = (number: number): void => {
    activeIndex.value = (activeIndex.value + number + files.value.length) % files.value.length
  }

  const nextFile = (): void => {
    if (activeIndex.value === files.value.length - 1 && isRepeat.value) {
      activeIndex.value = 0
    }
    else {
      findNeighbour(1)
    }
  }

  const prevFile = (): void => findNeighbour(-1)

  const changeActiveFile = (index: number): void => {
    if (index >= 0 && index < files.value.length) {
      activeIndex.value = index
    }
  }

  const updateFiles = (newFiles: File[]): void => {
    files.value = newFiles
    originalFiles.value = [...newFiles]
    activeIndex.value = 0
    isShuffle.value = false
    isRepeat.value = false
  }

  const updateFilesWithoutReset = (newFiles: File[]): void => {
    files.value = newFiles
    originalFiles.value = [...newFiles]
    // Не сбрасываем activeIndex, чтобы сохранить восстановленный индекс
    isShuffle.value = false
    isRepeat.value = false
  }

  const shuffleFiles = (): void => {
    if (!isShuffle.value) {
      originalFiles.value = [...files.value]
      files.value.sort(() => Math.random() - 0.5)
      isShuffle.value = true
    }
    else {
      files.value = [...originalFiles.value]
      isShuffle.value = false
    }
  }

  const toggleRepeat = (): void => {
    isRepeat.value = !isRepeat.value
  }

  return {
    activeFile,
    changeActiveFile,
    files,
    isRepeat,
    isShuffle,
    nextFile,
    prevFile,
    shuffleFiles,
    toggleRepeat,
    updateFiles,
    updateFilesWithoutReset,
  }
}
