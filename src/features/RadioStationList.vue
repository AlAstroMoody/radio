<script setup lang="ts">
import type { Wave } from 'shared/types/audio'

import { useDragDrop } from 'composables/useDragDrop'
import { useRadio } from 'composables/useRadio'
import { useScrollToActive } from 'composables/useScrollToActive'
import { useToast } from 'composables/useToast'
import { storeToRefs } from 'pinia'
import { BaseButton, iStation, ListDragHandle, ListSkeleton } from 'shared'
import { useStationsStore } from 'stores'
import { computed, useTemplateRef, watch } from 'vue'

const { activeRadio, changeActiveRadio, reorderRadios } = useRadio()
const stationsStore = useStationsStore()
const { showToast } = useToast()
const { categories, isStationsLoading, stationsError, userRadios } = storeToRefs(stationsStore)

watch(stationsError, (error) => {
  if (error && !userRadios.value.length)
    showToast(error)
})

const buttonsContainer = useTemplateRef('buttonsContainer')
const scrollContainer = useTemplateRef('scrollContainer')

const categoriesMap = computed(() =>
  new Map(categories.value.map((cat: { id: string, name: string }) => [cat.id, cat.name])),
)

const dragDrop = useDragDrop(
  {
    onReorder: (fromIndex, toIndex) => {
      reorderRadios(fromIndex, toIndex)
    },
  },
  {
    enableMouse: true,
    enableTouch: true,
    touchThreshold: 12,
  },
)

useScrollToActive({
  activeItem: activeRadio,
  buttonsContainer,
  findActiveIndex: (items: Wave[], active: undefined | Wave) =>
    items.findIndex((radio: Wave) => radio.id === active?.id),
  items: userRadios,
  scrollContainer,
})

function handleRadioClick(radioId: string, _index: number): void {
  changeActiveRadio(+radioId)
}

function isDropBefore(index: number): boolean {
  return dragDrop.state.dragOverIndex === index
    && dragDrop.state.insertPosition === 'before'
    && dragDrop.state.draggedIndex !== index
}
</script>

<template>
  <div class="font-medium flex h-full min-h-0 max-w-full flex-col overflow-hidden border-gray-200/50 p-4 px-1 dark:border-gray-600/50">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center shrink-0">
      radio stations
    </div>
    <div v-if="isStationsLoading && !userRadios.length" class="text-xs text-center mb-2 shrink-0 dark:text-white">
      Loading stations...
    </div>
    <div v-else-if="stationsError && !userRadios.length" class="mb-2 flex shrink-0 flex-col items-center gap-2 px-2 text-center">
      <p class="text-xs text-purple-500 dark:text-purple-400">
        Failed to load stations
      </p>
      <button
        type="button"
        class="rounded-lg border border-glass-purple-border bg-glass px-3 py-1.5 text-xs text-black dark:bg-glass-purple/40 dark:text-white"
        @click="stationsStore.fetchStations({ force: true })"
      >
        Retry
      </button>
    </div>
    <div v-else class="text-xs text-center mb-2 shrink-0 dark:text-white">
      use ⋮ handle to reorder
    </div>

    <div ref="scrollContainer" class="min-h-0 flex-1 overflow-auto overscroll-y-contain md:max-h-[600px]">
      <ListSkeleton v-if="isStationsLoading && !userRadios.length" />
      <div
        v-else
        ref="buttonsContainer"
        class="pl-2 pr-2 flex flex-col gap-3 py-3 list-optimized"
      >
        <BaseButton
          v-for="(radio, index) in userRadios"
          :key="radio.id"
          :label="radio.name"
          variant="list"
          class="relative flex max-w-full items-center gap-1"
          :class="[
            dragDrop.createHandlers(index, radio).row.class,
            isDropBefore(index) && 'outline-2 outline-purple-500 dark:outline-purple-400 outline-offset-[-6px]',
          ]"
          :style="isDropBefore(index) ? { boxShadow: '0 0 8px rgba(168, 85, 247, 0.8), 0 0 4px rgba(168, 85, 247, 0.6)' } : undefined"
          :active="radio.id === activeRadio?.id"
          v-bind="{
            ...dragDrop.createHandlers(index, radio).row,
            ...dragDrop.createHandlers(index, radio).dropTarget,
          }"
          @click="handleRadioClick(radio.id.toString(), index)"
        >
          <ListDragHandle v-bind="dragDrop.createHandlers(index, radio).dragHandle" />
          <div class="flex min-w-0 flex-1 items-center justify-between">
            <div class="flex min-w-0 items-center">
              <iStation v-if="radio.id === activeRadio?.id" class="mr-2 shrink-0" />
              <span class="truncate">{{ radio.name }}</span>
            </div>
            <div v-if="radio.category" class="ml-2 shrink-0 text-xs">
              {{ categoriesMap.get(radio.category) }}
            </div>
          </div>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
