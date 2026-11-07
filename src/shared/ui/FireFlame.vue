<script setup lang="ts">
import { useFireShader } from 'composables/useFireShader'
import { toRef, useTemplateRef, watch } from 'vue'

const props = withDefaults(defineProps<{
  active?: boolean
  analyser?: AnalyserNode | null
  audioReactive?: boolean
  flameHeight?: number
  fps?: number
  intensity?: number
  opacity?: number
  orientation?: 'bottom' | 'left'
  speed?: number
}>(), {
  active: true,
  analyser: null,
  audioReactive: true,
  flameHeight: 0.9,
  fps: 30,
  intensity: 1,
  opacity: 1,
  orientation: 'bottom',
  speed: 1,
})

const emit = defineEmits<{ ready: [ready: boolean] }>()

const canvas = useTemplateRef('canvas')
const { isReady } = useFireShader(canvas, {
  active: toRef(props, 'active'),
  analyser: toRef(props, 'analyser'),
  audioReactive: toRef(props, 'audioReactive'),
  flameHeight: props.flameHeight,
  fps: props.fps,
  intensity: props.intensity,
  opacity: props.opacity,
  orientation: props.orientation,
  speed: props.speed,
})

watch(isReady, (ready) => {
  emit('ready', ready)
})
</script>

<template>
  <canvas ref="canvas" class="block size-full" aria-hidden="true" />
</template>
