<script setup lang="ts">
import { useAudioController } from 'composables/useAudioController'
import { useAudioSettings } from 'composables/useAudioSettings'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import FireFlame from './FireFlame.vue'

const audioController = useAudioController()
const { fireAudioReactive, fireEnabled } = useAudioSettings()
const analyser = computed(() =>
  fireEnabled.value && fireAudioReactive.value
    ? audioController?.analyser.value ?? null
    : null,
)
const isPlaying = computed(() => audioController?.state.isPlaying ?? false)

const isReady = ref(false)

watch(fireEnabled, (enabled) => {
  if (!enabled)
    isReady.value = false
})

watch([fireEnabled, isReady], ([enabled, ready]) => {
  document.documentElement.classList.toggle('fire-shader-ready', enabled && ready)
}, { immediate: true })

onBeforeUnmount(() => {
  document.documentElement.classList.remove('fire-shader-ready')
})
</script>

<template>
  <div v-if="fireEnabled" class="fire-flame-side" aria-hidden="true">
    <div class="fire-flame-side-rotator">
      <FireFlame
        :audio-reactive="false"
        :flame-height="0.55"
        :fps="24"
        :intensity="0.35"
        :opacity="0.9"
        :speed="0.8"
      />
    </div>
  </div>

  <div v-if="fireEnabled" class="fire-flame" aria-hidden="true">
    <FireFlame
      :active="isPlaying"
      :analyser="analyser"
      :audio-reactive="fireAudioReactive"
      :flame-height="0.6"
      @ready="isReady = $event"
    />
  </div>
</template>

<style scoped>
.fire-flame,
.fire-flame-side {
  position: fixed;
  z-index: 0;
  pointer-events: none;
}

.fire-flame {
  bottom: 0;
  left: 63%;
  width: min(920px, 110vw);
  height: min(850px, 92vh);
  transform: translateX(-50%);
  /* Верхние языки плавно гасим, чтобы они не упирались в край канваса */
  -webkit-mask-image: linear-gradient(to top, black 75%, transparent 100%);
  mask-image: linear-gradient(to top, black 75%, transparent 100%);
}

/* Слабое пламя на месте старой левой картинки: всегда горит */
.fire-flame-side {
  top: 0;
  left: 0;
  z-index: 70;
  width: 356px;
  height: 258px;
  overflow: hidden;
}

.fire-flame-side-rotator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 258px;
  height: 356px;
  transform: translate(-50%, -50%) rotate(90deg);
}

@media (max-width: 767px) {
  .fire-flame {
    height: min(650px, 85vh);
  }
}

@media (min-width: 768px) {
  .fire-flame-side {
    width: 712px;
    height: 515px;
  }

  .fire-flame-side-rotator {
    width: 515px;
    height: 712px;
  }
}
</style>
