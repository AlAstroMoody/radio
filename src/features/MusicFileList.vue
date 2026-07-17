<script setup lang="ts">
import { useDragDrop } from 'composables/useDragDrop'
import { useScrollToActive } from 'composables/useScrollToActive'
import { storeToRefs } from 'pinia'
import { BaseButton, ListDragHandle } from 'shared'
import { formatTime, getAudioDuration, getCachedDuration } from 'shared/utils/time'
import { useLibraryStore } from 'stores'
import { computed, ref, useTemplateRef, watch } from 'vue'

const libraryStore = useLibraryStore()
const { activeFile, files } = storeToRefs(libraryStore)
const { changeActiveFile, reorderFiles } = libraryStore

const buttonsContainer = useTemplateRef('buttonsContainer')
const scrollContainer = useTemplateRef('scrollContainer')

const dragDrop = useDragDrop(
  {
    onReorder: (fromIndex, toIndex) => {
      reorderFiles(fromIndex, toIndex)
    },
  },
  {
    enableMouse: true,
    enableTouch: true,
    touchThreshold: 12,
  },
)
const currentFileName = computed(() => activeFile.value?.name || '')

const listHint = computed(() =>
  files.value.length ? 'use ⋮⋮ handle to reorder' : 'No files selected',
)

useScrollToActive({
  activeItem: activeFile,
  buttonsContainer,
  findActiveIndex: (items: File[], active: File | undefined) =>
    items.findIndex((file: File) => file.name === active?.name),
  items: files,
  scrollContainer,
})

function handleFileClick(index: number): void {
  changeActiveFile(index)
}

function isDropBefore(index: number): boolean {
  return dragDrop.state.dragOverIndex === index
    && dragDrop.state.insertPosition === 'before'
    && dragDrop.state.draggedIndex !== index
}

const fileDurations = ref<Record<string, string>>({})

async function loadFileDuration(file: File): Promise<void> {
  const fileName = file.name
  if (!fileDurations.value[fileName]) {
    try {
      const duration = await getAudioDuration(file)
      fileDurations.value[fileName] = formatTime(duration)
    }
    catch {
      fileDurations.value[fileName] = '0:00'
    }
  }
}

function loadVisibleDurations(): void {
  files.value.forEach((file: File) => {
    const cached = getCachedDuration(file.name)
    if (cached !== undefined) {
      fileDurations.value[file.name] = formatTime(cached)
    }
    else {
      loadFileDuration(file)
    }
  })
}

watch(files, loadVisibleDurations, { immediate: true })
</script>

<template>
  <div class="font-medium flex h-full min-h-0 max-w-full flex-col overflow-hidden p-4 px-1">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center shrink-0">
      Audio files
    </div>
    <div class="text-xs text-center mb-2 shrink-0 dark:text-white">
      {{ listHint }}
    </div>
    <div ref="scrollContainer" class="min-h-0 flex-1 overflow-auto overscroll-y-contain md:max-h-[600px]">
      <div ref="buttonsContainer" class="pl-2 pr-2 flex flex-col gap-3 py-3 max-w-2xl list-optimized items-center">
        <p
          v-if="!files.length"
          class="px-4 py-8 text-center text-sm opacity-70 dark:text-white"
        >
          No files yet. Drop audio on the player or press Open.
        </p>
        <BaseButton
          v-for="(file, index) in files"
          :key="file.name"
          :label="file.name"
          variant="list"
          class="relative flex w-full max-w-80 items-center gap-1"
          :class="[
            dragDrop.createHandlers(index, file).row.class,
            isDropBefore(index) && 'outline-2 outline-purple-500 dark:outline-purple-400 outline-offset-[-6px]',
          ]"
          :style="isDropBefore(index) ? { boxShadow: '0 0 8px rgba(168, 85, 247, 0.8), 0 0 4px rgba(168, 85, 247, 0.6)' } : undefined"
          :active="file.name === currentFileName"
          v-bind="{
            ...dragDrop.createHandlers(index, file).row,
            ...dragDrop.createHandlers(index, file).dropTarget,
          }"
          @click="handleFileClick(index)"
        >
          <ListDragHandle v-bind="dragDrop.createHandlers(index, file).dragHandle" />
          <span class="truncate flex-1 min-w-0 mr-2 text-left">{{ file.name }}</span>
          <span class="text-sm shrink-0 whitespace-nowrap">
            {{ fileDurations[file.name] || '...' }}
          </span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
