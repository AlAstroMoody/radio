<script setup lang="ts">
import { useParallax } from '@vueuse/core'
import { useRadio } from 'composables/useRadio'
import { useVisualizer } from 'composables/useVisualizer'
import { computed, reactive, ref, watch } from 'vue'

interface Props {
  analyser: AnalyserNode | null
  isPlaying: boolean
}

const props = defineProps<Props>()

const canvas = ref<HTMLCanvasElement | null>(null)

const { startVisualization, stopVisualization } = useVisualizer(canvas, computed(() => props.analyser))

// Получаем активную радиостанцию для отслеживания изменений
const { activeRadio } = useRadio()

// Parallax эффект для 3D визуализации
const parallax = reactive(useParallax(canvas))
const cardStyle = computed(() => ({
  transform: `rotateX(${parallax.roll * 20 + 170}deg) rotateY(${
    parallax.tilt * 20 + 170
  }deg)`,
  transition: '.3s ease-out all',
}))

// Отслеживаем изменения состояния воспроизведения и анализатора
watch([() => props.isPlaying, () => props.analyser], ([isPlaying, analyser]) => {
  if (isPlaying && analyser) {
    // Добавляем небольшую задержку для стабилизации аудио потока
    setTimeout(() => {
      if (props.isPlaying && props.analyser) {
        startVisualization()
      }
    }, 100)
  }
}, { immediate: true })

// Останавливаем визуализацию при смене радиостанции
watch(() => activeRadio.value, () => {
  stopVisualization()
})

defineExpose({
  startVisualization,
  stopVisualization,
})
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
