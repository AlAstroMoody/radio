import type { IDBPDatabase } from 'idb'

import { openDB } from 'idb'

const DB_NAME = 'radio-files-db'
const DB_STORE = 'files'
const DB_STORE_STATE = 'state'

export function useIndexedDB(): {
  clearFilesFromIndexedDB: () => Promise<void>
  loadActiveFileIndex: () => Promise<number>
  loadFilesFromIndexedDB: () => Promise<File[]>
  saveActiveFileIndex: (index: number) => Promise<void>
  saveFilesToIndexedDB: (files: File[]) => Promise<void>
} {
  async function getDb(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'name' })
        }
        if (!db.objectStoreNames.contains(DB_STORE_STATE)) {
          db.createObjectStore(DB_STORE_STATE, { keyPath: 'id' })
        }
      },
    })
  }

  async function saveFilesToIndexedDB(files: File[]): Promise<void> {
    const db = await getDb()
    // Сначала читаем все arrayBuffer'ы
    const fileDatas = await Promise.all(
      files.map(async file => ({
        data: await file.arrayBuffer(),
        lastModified: file.lastModified,
        name: file.name,
        type: file.type,
      })),
    )
    // Теперь одной транзакцией кладём всё в базу
    const tx = db.transaction(DB_STORE, 'readwrite')
    for (const fileData of fileDatas) {
      await tx.store.put(fileData)
    }
    await tx.done
  }

  async function loadFilesFromIndexedDB(): Promise<File[]> {
    const db = await getDb()
    const all = await db.getAll(DB_STORE)
    return all.map((item: any) => new File([item.data], item.name, { lastModified: item.lastModified, type: item.type }))
  }

  async function clearFilesFromIndexedDB(): Promise<void> {
    const db = await getDb()
    await db.clear(DB_STORE)
    try {
      await db.clear(DB_STORE_STATE)
    }
    catch (error) {
      // Если хранилище state не существует, игнорируем ошибку
      console.warn('Could not clear state store:', error)
    }
  }

  async function saveActiveFileIndex(index: number): Promise<void> {
    try {
      const db = await getDb()
      await db.put(DB_STORE_STATE, { id: 'activeFileIndex', index })
    }
    catch (error) {
      // Если хранилище state не существует, игнорируем ошибку
      console.warn('Could not save active file index:', error)
    }
  }

  async function loadActiveFileIndex(): Promise<number> {
    try {
      const db = await getDb()
      const state = await db.get(DB_STORE_STATE, 'activeFileIndex')
      return state?.index ?? 0
    }
    catch (error) {
      // Если хранилище state не существует, возвращаем 0
      console.warn('State store not found, using default index 0:', error)
      return 0
    }
  }

  return {
    clearFilesFromIndexedDB,
    loadActiveFileIndex,
    loadFilesFromIndexedDB,
    saveActiveFileIndex,
    saveFilesToIndexedDB,
  }
}
