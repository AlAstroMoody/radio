<script setup lang="ts">
import type { Wave } from 'shared/types/audio'

import { useDragDrop } from 'composables/useDragDrop'
import { useRadio } from 'composables/useRadio'
import { useScrollToActive } from 'composables/useScrollToActive'
import { storeToRefs } from 'pinia'
import { BaseButton, iStation } from 'shared'
import { useStationsStore } from 'stores'
import { computed, useTemplateRef } from 'vue'

const { activeRadio, changeActiveRadio, reorderRadios } = useRadio()
const stationsStore = useStationsStore()
const { categories, isStationsLoading, stationsError, userRadios } = storeToRefs(stationsStore)

const buttonsContainer = useTemplateRef('buttonsContainer')
const scrollContainer = useTemplateRef('scrollContainer')

const categoriesMap = computed(() =>
  new Map(categories.value.map((cat: { id: string, name: string }) => [cat.id, cat.name])),
)

const dragHandlersCache = new Map()

const dragDrop = useDragDrop(
  {
    onReorder: (fromIndex, toIndex) => {
      reorderRadios(fromIndex, toIndex)
    },
  },
  {
    enableMouse: true,
    enableTouch: true,
    touchThreshold: 25,
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

function getDragHandlers(index: number, radio: any) {
  const key = `${index}-${radio.id}`
  if (!dragHandlersCache.has(key)) {
    const handlers = dragDrop.createHandlers(index, radio)
    dragHandlersCache.set(key, handlers)
  }
  return dragHandlersCache.get(key)
}

function handleRadioClick(radioId: string, _index: number): void {
  changeActiveRadio(+radioId)
}
</script>

<template>
  <div class="font-medium px-1 md:px-5 max-w-full border-gray-200/50 dark:border-gray-600/50 shadow-lg dark:shadow-xl shadow-right p-4 flex flex-col max-h-[70vh] overflow-hidden">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center flex-shrink-0">
      radio stations
    </div>
    <div v-if="isStationsLoading" class="text-xs text-center mb-2 flex-shrink-0">
      Загрузка списка станций...
    </div>
    <div v-else-if="stationsError" class="text-xs text-purple-500 dark:text-purple-400 text-center mb-2 flex-shrink-0">
      Ошибка при загрузке списка станций
    </div>
    <div v-else class="text-xs text-center mb-2 flex-shrink-0">
      drag to reorder
    </div>

    <div ref="scrollContainer" class="overflow-auto max-h-[calc(100dvh-190px)] md:h-[600px]">
      <div ref="buttonsContainer" class="pl-2 pr-2 flex flex-col gap-3 py-3 list-optimized">
        <BaseButton
          v-for="(radio, index) in userRadios"
          :key="radio.id"
          :label="radio.name"
          variant="list"
          class="truncate max-w-full cursor-move relative"
          :class="[
            getDragHandlers(index, radio).draggable.class,
            dragDrop.state.dragOverIndex === index && dragDrop.state.insertPosition === 'before' && dragDrop.state.draggedIndex !== index && 'outline-2 outline-purple-500 dark:outline-purple-400 outline-offset-[-6px]',
          ]"
          :style="dragDrop.state.dragOverIndex === index && dragDrop.state.insertPosition === 'before' && dragDrop.state.draggedIndex !== index ? { boxShadow: '0 0 8px rgba(168, 85, 247, 0.8), 0 0 4px rgba(168, 85, 247, 0.6)' } : undefined"
          :active="radio.id === activeRadio?.id"
          v-bind="{
            ...getDragHandlers(index, radio).draggable,
            ...getDragHandlers(index, radio).dropTarget,
          }"
          @click="handleRadioClick(radio.id.toString(), index)"
        >
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center">
              <iStation v-if="radio.id === activeRadio?.id" class="mr-2" />
              {{ radio.name }}
            </div>
            <div v-if="radio.category" class="text-xs mb-auto ml-2">
              {{ categoriesMap.get(radio.category) }}
            </div>
          </div>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
