<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

defineProps<{ hasFiles: boolean }>()

const emit = defineEmits<{
  filesSelected: [files: File[]]
}>()

const dropZone = useTemplateRef('dropZone')
const input = useTemplateRef('input')

function changeFiles(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files)
    return

  const filesArray = [...input.files]
  handleFileSelection(filesArray)
}

function handleFileSelection(newFiles: File[]) {
  if (newFiles.length > 0) {
    emit('filesSelected', newFiles)
  }
}

async function openFiles() {
  if ('showOpenFilePicker' in window) {
    const fileHandles = await window.showOpenFilePicker({
      multiple: true,
      types: [{ accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'] }, description: 'Audio Files' }],
    })
    const newFiles = await Promise.all(fileHandles.map(handle => handle.getFile()))
    handleFileSelection(newFiles)
  }
  else {
    input.value?.click()
  }
}

function setupDragAndDrop() {
  if (!dropZone.value)
    return

  dropZone.value.ondrop = async (e) => {
    e.preventDefault()
    if (e.dataTransfer?.items) {
      const newFiles = [...e.dataTransfer.items]
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => !!file)
      handleFileSelection(newFiles)
    }
  }

  dropZone.value.ondragover = e => e.preventDefault()
}

function setupLaunchQueue() {
  if (window.launchQueue) {
    window.launchQueue.setConsumer(async (launchParams: LaunchParams) => {
      const fileHandles = launchParams.files
      if (fileHandles.length > 0) {
        const newFiles = await Promise.all(fileHandles.map(handle => handle.getFile()))
        handleFileSelection(newFiles)
      }
    })
  }
}

onMounted(() => {
  setupDragAndDrop()
  setupLaunchQueue()
})

defineExpose({
  openFiles,
})
</script>

<template>
  <div
    ref="dropZone"
    :class="hasFiles ? 'hidden' : 'flex'"
    class="relative z-10 mx-auto min-h-40 w-full max-w-[280px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-dark-100 px-4 py-6 text-center dark:border-light-100"
  >
    <p class="pointer-events-none font-blackcraft text-lg text-black dark:text-white">
      Drop audio here
    </p>
    <p class="pointer-events-none text-sm opacity-70 dark:text-white">
      or click to open files
    </p>
    <input
      ref="input"
      type="file"
      accept="audio/*"
      multiple
      class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      aria-label="Open audio files"
      @change.stop="changeFiles"
    >
  </div>
</template>
