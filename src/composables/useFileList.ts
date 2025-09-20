import type { Ref } from 'vue'

import { computed, ref } from 'vue'

interface UseFileListReturn {
  activeFile: Ref<File | null>
  activeIndex: Ref<number>
  changeActiveFile: (index: number) => void
  files: Ref<File[]>
  isRepeat: Ref<boolean>
  isShuffle: Ref<boolean>
  nextFile: () => void
  prevFile: () => void
  reorderFiles: (fromIndex: number, toIndex: number) => void
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
    if (activeIndex.value === files.value.length - 1) {
      if (isRepeat.value) {
        activeIndex.value = 0
      }
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

  const reorderFiles = (fromIndex: number, toIndex: number): void => {
    if (fromIndex === toIndex)
      return

    const fileList = [...files.value]
    const [movedFile] = fileList.splice(fromIndex, 1)
    fileList.splice(toIndex, 0, movedFile)

    files.value = fileList

    // Обновляем originalFiles если не в режиме shuffle
    if (!isShuffle.value) {
      originalFiles.value = [...fileList]
    }

    // Корректируем activeIndex если нужно
    if (activeIndex.value === fromIndex) {
      activeIndex.value = toIndex
    }
    else if (fromIndex < activeIndex.value && toIndex >= activeIndex.value) {
      activeIndex.value--
    }
    else if (fromIndex > activeIndex.value && toIndex <= activeIndex.value) {
      activeIndex.value++
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
    activeIndex,
    changeActiveFile,
    files,
    isRepeat,
    isShuffle,
    nextFile,
    prevFile,
    reorderFiles,
    shuffleFiles,
    toggleRepeat,
    updateFiles,
    updateFilesWithoutReset,
  }
}
