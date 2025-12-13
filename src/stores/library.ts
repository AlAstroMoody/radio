import type { IDBPDatabase } from 'idb'

import { openDB } from 'idb'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const DB_NAME = 'radio-files-db'
const DB_STORE_FILES = 'files'
const DB_STORE_STATE = 'state'
const DB_VERSION = 2

export const useLibraryStore = defineStore('library', () => {
  const files = ref<File[]>([])
  const originalFiles = ref<File[]>([])
  const activeIndex = ref(0)
  const isShuffle = ref(false)
  const isRepeat = ref(false)

  const activeFile = computed(() => files.value[activeIndex.value] || null)

  function updateFiles(newFiles: File[]): void {
    files.value = [...newFiles]
    originalFiles.value = [...newFiles]
    activeIndex.value = 0
    isShuffle.value = false
    isRepeat.value = false
  }

  function updateFilesWithoutReset(newFiles: File[]): void {
    files.value = [...newFiles]
    originalFiles.value = [...newFiles]
    isShuffle.value = false
    isRepeat.value = false
  }

  function changeActiveFile(index: number): void {
    if (index >= 0 && index < files.value.length)
      activeIndex.value = index
  }

  function nextFile(): void {
    if (!files.value.length)
      return

    if (activeIndex.value === files.value.length - 1) {
      if (isRepeat.value)
        activeIndex.value = 0
    }
    else {
      activeIndex.value = (activeIndex.value + 1) % files.value.length
    }
  }

  function prevFile(): void {
    if (!files.value.length)
      return

    activeIndex.value = (activeIndex.value - 1 + files.value.length) % files.value.length
  }

  function reorderFiles(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex)
      return

    const fileList = [...files.value]
    const [movedFile] = fileList.splice(fromIndex, 1)
    fileList.splice(toIndex, 0, movedFile)

    files.value = fileList

    if (!isShuffle.value)
      originalFiles.value = [...fileList]

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

  function shuffleFiles(): void {
    if (!files.value.length)
      return

    if (!isShuffle.value) {
      originalFiles.value = [...files.value]
      files.value = [...files.value].sort(() => Math.random() - 0.5)
      activeIndex.value = 0
      isShuffle.value = true
    }
    else {
      files.value = [...originalFiles.value]
      activeIndex.value = Math.min(activeIndex.value, files.value.length - 1)
      isShuffle.value = false
    }
  }

  function toggleRepeat(): void {
    isRepeat.value = !isRepeat.value
  }

  async function getDb(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DB_STORE_FILES))
          db.createObjectStore(DB_STORE_FILES, { keyPath: 'name' })
        if (!db.objectStoreNames.contains(DB_STORE_STATE))
          db.createObjectStore(DB_STORE_STATE, { keyPath: 'id' })
      },
    })
  }

  async function saveFilesToIndexedDB(filesToSave: File[] = files.value): Promise<void> {
    const db = await getDb()
    const fileDatas = await Promise.all(
      filesToSave.map(async file => ({
        data: await file.arrayBuffer(),
        lastModified: file.lastModified,
        name: file.name,
        type: file.type,
      })),
    )
    const tx = db.transaction(DB_STORE_FILES, 'readwrite')
    for (const fileData of fileDatas)
      await tx.store.put(fileData)
    await tx.done
  }

  async function loadFilesFromIndexedDB(): Promise<File[]> {
    const db = await getDb()
    const all = await db.getAll(DB_STORE_FILES)
    return all.map((item: any) => new File([item.data], item.name, { lastModified: item.lastModified, type: item.type }))
  }

  async function clearFilesFromIndexedDB(): Promise<void> {
    const db = await getDb()
    await db.clear(DB_STORE_FILES)
    try {
      await db.clear(DB_STORE_STATE)
    }
    catch { }
  }

  async function saveActiveFileIndex(index: number): Promise<void> {
    try {
      const db = await getDb()
      await db.put(DB_STORE_STATE, { id: 'activeFileIndex', index })
    }
    catch { }
  }

  async function loadActiveFileIndex(): Promise<number> {
    try {
      const db = await getDb()
      const state = await db.get(DB_STORE_STATE, 'activeFileIndex')
      return state?.index ?? 0
    }
    catch {
      return 0
    }
  }

  return {
    activeFile,
    activeIndex,
    changeActiveFile,
    clearFilesFromIndexedDB,
    files,
    isRepeat,
    isShuffle,
    loadActiveFileIndex,
    loadFilesFromIndexedDB,
    nextFile,
    prevFile,
    reorderFiles,
    saveActiveFileIndex,
    saveFilesToIndexedDB,
    shuffleFiles,
    toggleRepeat,
    updateFiles,
    updateFilesWithoutReset,
  }
})
