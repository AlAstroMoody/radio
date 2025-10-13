<script setup lang="ts">
import { useDragDrop } from 'composables/useDragDrop'
import { useRadio } from 'composables/useRadio'
import { BaseButton, iStation } from 'shared'

const { activeRadio, changeActiveRadio, reorderRadios, userRadios } = useRadio()

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

function handleRadioClick(radioId: string, _index: number): void {
  changeActiveRadio(+radioId)
}
</script>

<template>
  <div class="font-medium h-full md:h-auto px-1 md:px-5 max-w-full border-r border-b border-l-0 border-t-0 border-gray-300/50 dark:border-gray-600/50 shadow-lg dark:shadow-xl shadow-right p-4" style="border-radius: 0 0 0.5rem 0;">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center">
      radio stations
    </div>
    <div class="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
      drag to reorder
    </div>
    <div class="overflow-auto max-h-[calc(100dvh-190px)] md:h-96">
      <div class="pl-2 pr-2 overflow-visible flex flex-col gap-3 py-3 list-optimized">
        <BaseButton
          v-for="(radio, index) in userRadios"
          :key="radio.id"
          :label="radio.name"
          variant="list"
          class="truncate max-w-full cursor-move transition-all duration-200"
          :class="dragDrop.createHandlers(index, radio).draggable.class"
          :active="radio.id === activeRadio.id"
          v-bind="{
            ...dragDrop.createHandlers(index, radio).draggable,
            ...dragDrop.createHandlers(index, radio).dropTarget,
          }"
          @click="handleRadioClick(radio.id.toString(), index)"
        >
          <div class="flex items-center">
            <iStation v-if="radio.id === activeRadio.id" class="mr-2" />
            {{ radio.name }}
          </div>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
