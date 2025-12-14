<script setup lang="ts">
import { useDragDrop } from 'composables/useDragDrop'
import { useScrollToActive } from 'composables/useScrollToActive'
import { storeToRefs } from 'pinia'
import { BaseButton } from 'shared'
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
    touchThreshold: 40,
  },
)
const currentFileName = computed(() => activeFile.value?.name || '')

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

// Загружаем метаданные для видимых файлов
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

// Загружаем метаданные при изменении списка файлов
watch(files, loadVisibleDurations, { immediate: true })
</script>

<template>
  <div class="font-medium px-1 md:px-5 max-w-full p-4 flex flex-col max-h-[70dvh] overflow-hidden">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center shrink-0">
      Audio files
    </div>
    <div class="text-xs  text-center mb-2 shrink-0">
      drag to reorder
    </div>
    <div ref="scrollContainer" class="overflow-auto max-h-[calc(100dvh-190px)] md:h-[600px]">
      <div ref="buttonsContainer" class="pl-2 pr-2 flex flex-col gap-3 py-3 max-w-2xl list-optimized">
        <BaseButton
          v-for="(file, index) in files"
          :key="file.name"
          :label="file.name"
          variant="list"
          class="w-full max-w-80 justify-between cursor-move relative"
          :class="[
            dragDrop.createHandlers(index, file).draggable.class,
            dragDrop.state.dragOverIndex === index && dragDrop.state.insertPosition === 'before' && dragDrop.state.draggedIndex !== index && 'outline-2 outline-purple-500 dark:outline-purple-400 outline-offset-[-6px]',
          ]"
          :style="dragDrop.state.dragOverIndex === index && dragDrop.state.insertPosition === 'before' && dragDrop.state.draggedIndex !== index ? { boxShadow: '0 0 8px rgba(168, 85, 247, 0.8), 0 0 4px rgba(168, 85, 247, 0.6)' } : undefined"
          :active="file.name === currentFileName"
          v-bind="{
            ...dragDrop.createHandlers(index, file).draggable,
            ...dragDrop.createHandlers(index, file).dropTarget,
          }"
          @click="handleFileClick(index)"
        >
          <span class="truncate flex-1 min-w-0 mr-2 text-left">{{ file.name }}</span>
          <span class="text-sm shrink-0 whitespace-nowrap">
            {{ fileDurations[file.name] || '...' }}
          </span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
