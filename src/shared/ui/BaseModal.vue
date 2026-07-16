<script setup lang="ts">
import { useEventListener, useWindowSize } from '@vueuse/core'
import { useModal } from 'composables/useModal'
import { iClose } from 'shared/ui/icons'
import { computed, nextTick, ref, watch } from 'vue'

const SHEET_BREAKPOINT = 1024
const DISMISS_DISTANCE = 96
const DISMISS_VELOCITY = 0.55

const { closeModal, isOpen } = useModal()
const { width: windowWidth } = useWindowSize()

const isSheet = computed(() => windowWidth.value < SHEET_BREAKPOINT)

const dragY = ref(0)
const isDragging = ref(false)
const isDismissing = ref(false)
const panelEl = ref<HTMLElement | null>(null)

let dragStartY = 0
let lastY = 0
let lastTime = 0
let velocity = 0

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value)
    void requestClose()
})

watch(isOpen, (open) => {
  if (open) {
    dragY.value = 0
    isDragging.value = false
    isDismissing.value = false
  }
})

function onHandlePointerDown(event: PointerEvent): void {
  if (!isSheet.value || isDismissing.value)
    return

  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)

  isDragging.value = true
  dragStartY = event.clientY - dragY.value
  lastY = event.clientY
  lastTime = performance.now()
  velocity = 0
}

function onHandlePointerMove(event: PointerEvent): void {
  if (!isDragging.value)
    return

  const now = performance.now()
  dragY.value = Math.max(0, event.clientY - dragStartY)

  const dt = now - lastTime
  if (dt > 0) {
    velocity = (event.clientY - lastY) / dt
    lastY = event.clientY
    lastTime = now
  }
}

function onHandlePointerUp(): void {
  if (!isDragging.value)
    return

  isDragging.value = false

  if (dragY.value > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
    void requestClose()
    return
  }

  dragY.value = 0
}

function panelStyle(): Record<string, string> | undefined {
  if (!isSheet.value || (!isDragging.value && !isDismissing.value && dragY.value === 0))
    return undefined

  return {
    transform: `translate3d(0, ${dragY.value}px, 0)`,
    transition: isDragging.value ? 'none' : 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
  }
}

async function requestClose(): Promise<void> {
  if (!isOpen.value || isDismissing.value)
    return

  if (!isSheet.value) {
    closeModal()
    return
  }

  isDragging.value = false
  isDismissing.value = true
  await nextTick()

  const panel = panelEl.value
  if (!panel) {
    isDismissing.value = false
    closeModal()
    return
  }

  const sheet: HTMLElement = panel
  const offscreen = Math.ceil(sheet.getBoundingClientRect().height + 24)
  dragY.value = Math.max(dragY.value, offscreen)

  let done = false
  let fallback = 0

  function finish() {
    if (done)
      return
    done = true
    sheet.removeEventListener('transitionend', onEnd)
    window.clearTimeout(fallback)
    isDismissing.value = false
    dragY.value = 0
    closeModal()
  }

  function onEnd(event: TransitionEvent) {
    if (event.propertyName !== 'transform')
      return
    finish()
  }

  sheet.addEventListener('transitionend', onEnd)
  fallback = window.setTimeout(finish, 320)
}
</script>

<template>
  <Teleport to="body">
    <Transition :name="isSheet ? 'sheet' : 'fade'">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50"
        :class="isSheet
          ? 'flex items-end justify-center'
          : 'flex items-center justify-center p-4'"
        tabindex="-1"
        role="presentation"
        @click.self="requestClose"
      >
        <div
          class="sheet-backdrop absolute inset-0 bg-black/50 dark:bg-black/70"
          aria-hidden="true"
          @click="requestClose"
        />

        <div
          ref="panelEl"
          role="dialog"
          aria-modal="true"
          class="sheet-panel relative z-10 flex min-h-0 flex-col bg-light-100 shadow-xl dark:bg-dark-100 content-visibility-auto"
          :class="isSheet
            ? 'max-h-[88dvh] w-full rounded-t-2xl pb-safe'
            : 'max-h-[90vh] w-auto max-w-2xl rounded-lg'"
          :style="panelStyle()"
          @click.stop
        >
          <div
            v-if="isSheet"
            class="flex shrink-0 cursor-grab touch-none flex-col items-center pt-2 active:cursor-grabbing"
            @pointerdown="onHandlePointerDown"
            @pointermove="onHandlePointerMove"
            @pointerup="onHandlePointerUp"
            @pointercancel="onHandlePointerUp"
          >
            <div class="mb-1 h-1.5 w-10 rounded-full bg-gray-600/35 dark:bg-white/30" />
            <span class="sr-only">Drag down to close</span>
          </div>

          <button
            class="absolute right-3 top-3 z-10 rounded-full p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            :class="isSheet ? 'top-2.5' : 'top-4 right-4'"
            aria-label="Close"
            @click="requestClose"
          >
            <iClose class="h-6 w-6 dark:text-white" />
          </button>

          <div
            class="flex min-h-0 min-w-[320px] flex-1 flex-col md:min-w-[480px]"
            :class="isSheet ? 'max-h-[calc(88dvh-2rem)] overflow-y-auto' : 'overflow-auto'"
          >
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.28s ease;
}

.sheet-enter-active .sheet-panel {
  transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-leave-active .sheet-panel {
  /* уже уехал через drag — leave без второго рывка */
  transition: none;
}

.sheet-enter-active .sheet-backdrop,
.sheet-leave-active .sheet-backdrop {
  transition: opacity 0.28s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 1;
}

.sheet-enter-from .sheet-backdrop,
.sheet-leave-to .sheet-backdrop {
  opacity: 0;
}

.sheet-enter-from .sheet-panel {
  transform: translate3d(0, 100%, 0);
}

.sheet-leave-to .sheet-panel {
  transform: translate3d(0, 100%, 0);
}
</style>
