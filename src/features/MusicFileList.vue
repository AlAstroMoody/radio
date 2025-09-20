<script setup lang="ts">
import { useDragDrop } from 'composables/useDragDrop'
import { useFileList } from 'composables/useFileList'
import { BaseButton } from 'shared'
import { formatTime, getAudioDuration, getCachedDuration } from 'shared/utils/time'
import { computed, ref, watch } from 'vue'

const { activeFile, changeActiveFile, files, reorderFiles } = useFileList()

const dragDrop = useDragDrop(
  {
    onReorder: (fromIndex, toIndex) => {
      reorderFiles(fromIndex, toIndex)
    },
  },
  {
    enableMouse: true,
    enableTouch: true,
    preventClickOnDrag: false,
    touchThreshold: 15,
  },
)
const currentFileName = computed(() => activeFile.value?.name || '')

function handleFileClick(index: number): void {
  if (!dragDrop.state.isDragging) {
    changeActiveFile(index)
  }
}

const fileDurations = ref<Record<string, string>>({})
async function loadFileDuration(file: File) {
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
function loadVisibleDurations() {
  files.value.forEach((file) => {
    // Проверяем, есть ли уже в кэше
    const cached = getCachedDuration(file.name)
    if (cached !== undefined) {
      fileDurations.value[file.name] = formatTime(cached)
    }
    else {
      // Загружаем в фоне
      loadFileDuration(file)
    }
  })
}

// Загружаем метаданные при изменении списка файлов
watch(files, loadVisibleDurations, { immediate: true })
</script>

<template>
  <div class="font-medium h-full md:h-auto px-1 md:px-5 max-w-full border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-lg dark:shadow-xl shadow-right p-4">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center">
      Audio files
    </div>
    <div class="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
      drag to reorder
    </div>
    <div class="overflow-auto max-h-[calc(100dvh-190px)] md:h-96">
      <div class="pl-2 pr-2 overflow-visible flex flex-col gap-3 py-3 max-w-2xl">
        <BaseButton
          v-for="(file, index) in files"
          :key="file.name"
          :label="file.name"
          variant="list"
          class="max-w-full justify-between cursor-move transition-all duration-200"
          :class="dragDrop.createHandlers(index, file).draggable.class"
          :active="file.name === currentFileName"
          v-bind="{
            ...dragDrop.createHandlers(index, file).draggable,
            ...dragDrop.createHandlers(index, file).dropTarget,
            onClick: undefined,
          }"
          @click="handleFileClick(index)"
        >
          <span class="truncate flex-1 min-w-0 mr-2 text-left">{{ file.name }}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
            {{ fileDurations[file.name] || '...' }}
          </span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
