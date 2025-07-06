<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{ hasFiles: boolean }>()

const emit = defineEmits<{
  filesSelected: [files: File[]]
}>()

const dropZone = ref<HTMLDivElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

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
  try {
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
  catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Ошибка выбора файлов:', error)
    }
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
        try {
          const newFiles = await Promise.all(fileHandles.map(handle => handle.getFile()))
          handleFileSelection(newFiles)
        }
        catch (error) {
          console.error('Error processing launchQueue files:', error)
        }
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
    class="z-10 mx-auto h-24 w-24 cursor-pointer items-center justify-between rounded-xl border border-dashed border-dark-100 dark:border-light-100"
  >
    <span class="absolute left-0 right-0 text-center">
      click or drag
      <br>
      for add files
    </span>
    <input
      ref="input"
      type="file"
      accept="audio/*"
      multiple
      class="h-full w-full cursor-pointer opacity-0"
      @change.stop="changeFiles"
    >
  </div>
</template>
