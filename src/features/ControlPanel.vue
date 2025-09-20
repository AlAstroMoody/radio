<script setup lang="ts">
import { AdjustmentsVerticalIcon, ListBulletIcon, MusicalNoteIcon } from '@heroicons/vue/24/solid'
import { useEventListener, useWindowSize } from '@vueuse/core'
import { useModal } from 'composables/useModal'
import { useRadio } from 'composables/useRadio'
import { useTheme } from 'composables/useTheme'
import { AudioSettings, RadioList } from 'features'
import { ButtonWithIcon, iLamp, iStation } from 'shared/ui'
import { computed, onMounted, ref } from 'vue'

const { isRadioMode, toggleMode } = useRadio()
const { toggleDark } = useTheme()
const { openModal } = useModal()

const { height, width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const navBarHeight = ref(0)

// Вычисляем высоту системной панели навигации для мобильных устройств
function calculateNavBarHeight() {
  if (!isMobile.value)
    return

  const documentHeight = document.documentElement.clientHeight
  const currentHeight = height.value
  navBarHeight.value = Math.max(0, documentHeight - currentHeight)
}

// Автоматически пересчитываем при изменении размера окна
useEventListener('resize', calculateNavBarHeight)

onMounted(() => calculateNavBarHeight())

const panelStyle = computed(() => {
  if (!isMobile.value)
    return {}

  return {
    bottom: navBarHeight.value > 0 ? `${navBarHeight.value}px` : '0px',
  }
})
</script>

<template>
  <div
    class="w-fit overflow-visible z-50 pb-safe mb-safe fixed left-0 right-0 transition-all duration-300"
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
