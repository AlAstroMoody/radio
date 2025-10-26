<script setup lang="ts">
import { useDragDrop } from 'composables/useDragDrop'
import { useMusicStore } from 'composables/useMusicStore'
import { useRadio } from 'composables/useRadio'
import { BaseButton, iStation } from 'shared'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

let scrollTimeout: null | number = null

const { activeRadio, changeActiveRadio, reorderRadios } = useRadio()
const { categories, userRadios } = useMusicStore()

const scrollContainer = ref<HTMLElement>()
const buttonsContainer = ref<HTMLElement>()

const categoriesMap = computed(() =>
  new Map(categories.value.map(cat => [cat.id, cat.name])),
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

function debouncedScrollToActiveRadio(): void {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = setTimeout(() => {
    scrollToActiveRadio(true)
  }, 150)
}

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

function scrollToActiveRadio(immediate = false): void {
  if (!scrollContainer.value || !activeRadio.value)
    return

  const activeIndex = userRadios.value.findIndex(radio => radio.id === activeRadio.value?.id)
  if (activeIndex === -1)
    return

  const container = scrollContainer.value
  if (!buttonsContainer.value)
    return

  const activeElement = buttonsContainer.value.children[activeIndex] as HTMLElement
  if (!activeElement)
    return

  const containerRect = container.getBoundingClientRect()
  const elementRect = activeElement.getBoundingClientRect()

  const elementTop = elementRect.top - containerRect.top + container.scrollTop
  const containerHeight = container.clientHeight
  const elementHeight = activeElement.offsetHeight

  const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2)

  container.scrollTo({
    behavior: immediate ? 'auto' : 'smooth',
    top: Math.max(0, scrollTop),
  })
}

watch(activeRadio, () => {
  nextTick(() =>
    scrollToActiveRadio(),
  )
})

watch(userRadios, () => {
  if (userRadios.value.length > 0 && activeRadio.value) {
    nextTick(() =>
      debouncedScrollToActiveRadio(),
    )
  }
})

onMounted(() => {
  nextTick(() =>
    scrollToActiveRadio(),
  )
})
</script>

<template>
  <div class="font-medium h-full md:h-auto px-1 md:px-5 max-w-full border-r border-b border-l-0 border-t-0 border-gray-300/50 dark:border-gray-600/50 shadow-lg dark:shadow-xl shadow-right p-4" style="border-radius: 0 0 0.5rem 0;">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center">
      radio stations
    </div>
    <div class="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
      drag to reorder
    </div>

    <div ref="scrollContainer" class="overflow-auto max-h-[calc(100dvh-250px)] md:h-80">
      <div ref="buttonsContainer" class="pl-2 pr-2 overflow-visible flex flex-col gap-3 py-3 list-optimized">
        <BaseButton
          v-for="(radio, index) in userRadios"
          :key="radio.id"
          v-memo="[radio.id, radio.name, radio.category, activeRadio?.id]"
          :label="radio.name"
          variant="list"
          class="truncate max-w-full cursor-move"
          :class="getDragHandlers(index, radio).draggable.class"
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
            <div v-if="radio.category" class="text-xs text-gray-400 dark:text-gray-500 mb-auto ml-2">
              {{ categoriesMap.get(radio.category) }}
            </div>
          </div>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
