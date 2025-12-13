<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

const { minDuration = 8, speed = 30, text } = defineProps<{
  minDuration?: number
  speed?: number
  text: string
}>()

const shouldAnimate = ref(false)
const animationStyle = ref({})
const textContainer = useTemplateRef('textContainer')
const textElement = useTemplateRef('textElement')

let resizeObserver: null | ResizeObserver = null

function checkTextOverflow() {
  if (!textContainer.value || !textElement.value)
    return

  const containerWidth = textContainer.value.offsetWidth
  shouldAnimate.value = false
  const singleTextWidth = textElement.value.querySelector('span')?.offsetWidth || 0

  if (singleTextWidth > containerWidth) {
    shouldAnimate.value = true

    nextTick(() => {
      const animationDuration = Math.max(minDuration, singleTextWidth / speed)

      animationStyle.value = {
        '--marquee-duration': `${animationDuration}s`,
      }
    })
  }
  else {
    shouldAnimate.value = false
    animationStyle.value = {}
  }
}

function setupResizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  if (textContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      checkTextOverflow()
    })
    resizeObserver.observe(textContainer.value)
  }
}

watch(() => text, () => {
  nextTick(() => {
    checkTextOverflow()
  })
})

onMounted(() => {
  nextTick(() => {
    checkTextOverflow()
    setupResizeObserver()
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div
    ref="textContainer"
    class="overflow-hidden whitespace-nowrap gpu-accelerated"
  >
    <div
      ref="textElement"
      class="smart-marquee inline-block"
      :class="{ 'animate-smart-marquee': shouldAnimate }"
      :style="animationStyle"
    >
      <span class="inline-block">{{ text }}</span>
      <span v-if="shouldAnimate" class="inline-block ml-8">{{ text }}</span>
    </div>
  </div>
</template>
