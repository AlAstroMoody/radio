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
  <div class="canvas-container" :style="cardStyle">
    <svg class="absolute">
      <defs>
        <filter id="turbulent-displace" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
            <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
            <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
            <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
            <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
          <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
          <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />

          <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </defs>
    </svg>

    <!-- Электрическая рамка с glow эффектами -->
    <div class="electric-border-frame" />
    <div class="glow-layer-1" />
    <div class="glow-layer-2" />
    <canvas
      ref="canvas"
      width="360"
      height="200"
      class="pointer-events-none mx-auto border-[#dd8448] border-2 rounded-lg rotate-180"
    />
  </div>
</template>

<style>
.canvas-container {
  position: relative;
  width: 360px;
  height: 200px;
  margin: 0 auto 8px 0;
}

/* Электрическая рамка  */
.electric-border-frame {
  position: absolute;
  top: 0;
  left: 0;
  width: 360px;
  height: 200px;
  border: 2px solid #dd8448;
  border-radius: 1rem;
  filter: url(#turbulent-displace);
  pointer-events: none;
  z-index: 3;
}

.glow-layer-1 {
  position: absolute;
  top: 0;
  left: 0;
  width: 360px;
  height: 200px;
  border: 2px solid rgba(221, 132, 72, 0.6);
  border-radius: 1rem;
  filter: blur(1px);
  pointer-events: none;
  z-index: 2;
}

.glow-layer-2 {
  position: absolute;
  top: 0;
  left: 0;
  width: 360px;
  height: 200px;
  border: 2px solid #dd8448;
  border-radius: 1rem;
  filter: blur(4px);
  pointer-events: none;
  z-index: 1;
}
</style>
