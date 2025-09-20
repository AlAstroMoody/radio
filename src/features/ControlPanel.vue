<script setup lang="ts">
import { AdjustmentsVerticalIcon, ListBulletIcon, MusicalNoteIcon } from '@heroicons/vue/24/solid'
import { useEventListener, useWindowSize } from '@vueuse/core'
import { useModal } from 'composables/useModal'
import { useRadio } from 'composables/useRadio'
import { useTheme } from 'composables/useTheme'
import { AudioSettings, RadioList } from 'features'
import { ButtonWithIcon, iLamp, iStation } from 'shared/ui'
import { computed, onMounted, provide, ref } from 'vue'

const { isRadioMode, toggleMode } = useRadio()
const { toggleDark } = useTheme()
const { openModal } = useModal()

const { height, width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const viewportHeight = ref(window.innerHeight)
const navBarHeight = ref(0)

// Вычисляем высоту системной панели навигации и обновляем высоту viewport
function calculateViewportHeight() {
  if (!isMobile.value) {
    navBarHeight.value = 0
    viewportHeight.value = window.innerHeight
    return
  }

  const viewport = window.visualViewport
  if (viewport) {
    viewportHeight.value = viewport.height
    const documentHeight = document.documentElement.clientHeight
    navBarHeight.value = Math.max(0, documentHeight - viewportHeight.value)
  }
  else {
    // Fallback на window.innerHeight
    viewportHeight.value = height.value
    const documentHeight = document.documentElement.clientHeight
    navBarHeight.value = Math.max(0, documentHeight - height.value)
  }

  // Минимальная высота для 3-button navigation
  if (navBarHeight.value > 0 && navBarHeight.value < 48) {
    navBarHeight.value = 48
  }
}

// Динамические стили для ControlPanel
const panelStyle = computed(() => {
  if (!isMobile.value)
    return {}

  return {
    bottom: navBarHeight.value > 0 ? `${navBarHeight.value}px` : '0px',
  }
})

// Динамическая высота для родительского контейнера
const pageStyle = computed(() => {
  if (!isMobile.value)
    return {}

  return {
    height: `${viewportHeight.value}px`,
    maxHeight: `calc(100vh - ${navBarHeight.value}px - env(safe-area-inset-bottom))`,
  }
})

provide('pageStyle', pageStyle)

// Слушаем изменения viewport
useEventListener(window.visualViewport || window, 'resize', calculateViewportHeight)
useEventListener(window.visualViewport || window, 'scroll', calculateViewportHeight)

onMounted(() => {
  calculateViewportHeight()
})
</script>

<template>
  <div
    class="w-fit overflow-visible z-50 pb-safe mb-safe fixed left-0 bottom-0 transition-all duration-300 touch-pan-y"
    :style="panelStyle"
  >
    <div class="flex gap-4 items-center p-1 rounded-tr-2xl border-r-0 border-b-0 bg-glass backdrop-blur-xl border border-glass shadow-lg shadow-top transition-all duration-300 dark:bg-glass-purple dark:border-glass-purple-border">
      <ButtonWithIcon label="theme" @click="toggleDark()">
        <iLamp />
      </ButtonWithIcon>
      <ButtonWithIcon label="playlist" @click="openModal(RadioList, { isRadioMode })">
        <ListBulletIcon class="size-6" />
      </ButtonWithIcon>
      <ButtonWithIcon :label="`${isRadioMode ? 'audio' : 'radio'} mode`" @click="toggleMode">
        <MusicalNoteIcon v-if="isRadioMode" class="size-6" />
        <iStation v-else />
      </ButtonWithIcon>
      <ButtonWithIcon label="settings" @click="openModal(AudioSettings)">
        <AdjustmentsVerticalIcon class="size-6" />
      </ButtonWithIcon>
    </div>
  </div>
</template>

<style>
@supports (padding: max(0px)) {
  .pb-safe {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
  .mb-safe {
    margin-bottom: max(16px, env(safe-area-inset-bottom));
  }
  .touch-pan-y {
    touch-action: pan-y;
  }
}
</style>
