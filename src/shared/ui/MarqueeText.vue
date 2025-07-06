<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  className?: string
  minDuration?: number
  speed?: number
  text: string
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  minDuration: 8,
  speed: 30,
})

const textContainer = ref<HTMLDivElement | null>(null)
const textElement = ref<HTMLDivElement | null>(null)
const shouldAnimate = ref(false)
const animationStyle = ref({})

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
      const animationDuration = Math.max(props.minDuration, singleTextWidth / props.speed)

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

watch(() => props.text, () => {
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

const containerClasses = computed(() => [
  'overflow-hidden whitespace-nowrap',
  props.className,
])
</script>

<template>
  <div
    ref="textContainer"
    :class="containerClasses"
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
