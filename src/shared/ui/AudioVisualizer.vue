<script setup lang="ts">
import { useParallax } from '@vueuse/core'
import { useVisualizer } from 'composables/useVisualizer'
import { computed, reactive, ref, watch } from 'vue'

interface Props {
  analyser: AnalyserNode | null
  isPlaying: boolean
}

const props = defineProps<Props>()

const canvas = ref<HTMLCanvasElement | null>(null)

const { startVisualization, stopVisualization } = useVisualizer(canvas, computed(() => props.analyser))

// Parallax эффект для 3D визуализации
const parallax = reactive(useParallax(canvas))
const cardStyle = computed(() => ({
  transform: `rotateX(${parallax.roll * 20 + 170}deg) rotateY(${
    parallax.tilt * 20 + 170
  }deg)`,
  transition: '.3s ease-out all',
}))

// Отслеживаем изменения состояния воспроизведения
// Запускаем визуализацию при воспроизведении, но НЕ останавливаем при паузе
// Это позволяет анимации естественно затухать
watch(() => props.isPlaying, (isPlaying) => {
  if (isPlaying) {
    startVisualization()
  }
  // НЕ останавливаем при паузе - пусть затухает естественно
})

// Экспортируем методы управления визуализацией
const methods = {
  startVisualization,
  stopVisualization,
}

// Эмитим методы управления после создания компонента
defineExpose(methods)
</script>

<template>
  <canvas
    ref="canvas"
    :style="cardStyle"
    width="360"
    height="200"
    class="pointer-events-none mx-auto my-2 overflow-hidden rounded-2xl shadow-next dark:shadow-card rotate-180"
  />
</template>
