<script setup lang="ts">
import { computed } from 'vue'

interface Emits {
  (event: 'seek', percent: number): void
}

const { currentTime, duration, isLoading = false } = defineProps<{
  currentTime: number
  duration: number
  isLoading?: boolean
  progress: number
}>()

const emit = defineEmits<Emits>()

const safeDuration = computed(() => {
  return Number.isNaN(duration) || !Number.isFinite(duration) || duration <= 0 ? 0 : duration
})

const safeCurrentTime = computed(() => {
  return Number.isNaN(currentTime) || !Number.isFinite(currentTime) || currentTime < 0 ? 0 : currentTime
})

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const truncatedSeconds = Math.trunc(seconds)
  const minutes = Math.floor(truncatedSeconds / 60)
  const remainingSeconds = truncatedSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function handleProgressClick(event: MouseEvent) {
  if (safeDuration.value <= 0)
    return

  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const progressBarWidth = rect.width
  const clickPercent = Math.max(0, Math.min(1, clickX / progressBarWidth))

  emit('seek', clickPercent)
}
</script>

<template>
  <div class="w-full px-4">
    <div class="flex justify-between text-lg text-gray-600 dark:text-white mb-1 font-blackcraft ">
      <span>{{ formatTime(safeCurrentTime) }}</span>
      <span v-if="safeDuration > 0">{{ formatTime(safeDuration) }}</span>
      <span v-else-if="isLoading" class="text-gray-400">Loading...</span>
      <span v-else class="text-gray-400">--:--</span>
    </div>
    <div
      class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 cursor-pointer relative overflow-hidden"
      :class="{ 'cursor-default': safeDuration <= 0 }"
      @click="handleProgressClick"
    >
      <div
        v-if="isLoading && safeDuration <= 0"
        class="absolute inset-0 bg-gradient-to-r from-purple-300 to-purple-500 opacity-50 animate-pulse"
      />

      <div
        class="bg-purple-500 h-full rounded-full transition-all duration-300"
        :class="{ 'opacity-50': safeDuration <= 0 }"
        :style="{ width: `${safeDuration > 0 ? progress : 0}%` }"
      />

      <div
        v-if="safeDuration > 0"
        class="absolute inset-0 opacity-0 hover:opacity-20 bg-white rounded-full transition-opacity duration-200"
      />
    </div>
  </div>
</template>
