<script setup lang="ts">
import { useAudioController } from 'composables/useAudioController'
import { useAudioSettings } from 'composables/useAudioSettings'
import { useRadio } from 'composables/useRadio'
import { useVisualizer } from 'composables/useVisualizer'
import { computed, useTemplateRef, watch } from 'vue'

const canvas = useTemplateRef('canvas')
const audioController = useAudioController()

const analyser = computed(() => audioController?.analyser.value ?? null)
const isPlaying = computed(() => audioController?.state.isPlaying ?? false)

const { fadeOutVisualization, startVisualization, stopVisualization } = useVisualizer(canvas, analyser)

const { activeRadio } = useRadio()
const { electricEffects } = useAudioSettings()

watch([isPlaying, analyser], ([playing, analyserNode]) => {
  if (playing && analyserNode) {
    setTimeout(() => {
      if (isPlaying.value && analyser.value) {
        startVisualization()
      }
    }, 100)
  }
}, { immediate: true })

watch(() => activeRadio.value, () => {
  fadeOutVisualization()
  if (isPlaying.value && analyser.value) {
    setTimeout(() => {
      if (isPlaying.value && analyser.value) {
        startVisualization()
      }
    }, 300)
  }
})

defineExpose({
  fadeOutVisualization,
  startVisualization,
  stopVisualization,
})
</script>

<template>
  <div class="canvas-container rotate-180 m-auto">
    <svg v-if="electricEffects" class="absolute">
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
    <div v-if="electricEffects" class="electric-border-frame" />
    <div v-if="electricEffects" class="glow-layer-1" />
    <div v-if="electricEffects" class="glow-layer-2" />
    <canvas
      ref="canvas"
      width="360"
      height="200"
      class="pointer-events-none mx-auto rounded-lg rotate-180"
      :class="electricEffects ? 'border-[#dd8448] border-2' : ''"
    />
  </div>
</template>

<style>
.canvas-container {
  position: relative;
  width: 360px;
  height: 200px;
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
