// Автоматически прокручивает список к активному элементу при его изменении или изменении списка
// Используется в RadioStationList и MusicFileList для показа текущего трека/станции

import type { Ref } from 'vue'

import { nextTick, onMounted, watch } from 'vue'

interface UseScrollToActiveOptions<TItem, TActive> {
  activeItem: Ref<TActive | undefined>
  buttonsContainer: Ref<HTMLElement | null>
  debounceMs?: number
  findActiveIndex: (items: TItem[], activeItem: TActive | undefined) => number
  items: Ref<TItem[]>
  scrollContainer: Ref<HTMLElement | null>
}

export function useScrollToActive<TItem, TActive>({
  activeItem,
  buttonsContainer,
  debounceMs = 150,
  findActiveIndex,
  items,
  scrollContainer,
}: UseScrollToActiveOptions<TItem, TActive>): {
  debouncedScrollToActive: () => void
  scrollToActive: (immediate?: boolean) => void
} {
  let scrollTimeout: null | number = null

  function scrollToActive(immediate = false): void {
    if (!scrollContainer.value || !activeItem.value)
      return

    const activeIndex = findActiveIndex(items.value, activeItem.value)
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

  function debouncedScrollToActive(): void {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    scrollTimeout = setTimeout(() => {
      scrollToActive(true)
    }, debounceMs)
  }

  watch(activeItem, () => {
    requestAnimationFrame(() => {
      nextTick(() => scrollToActive())
    })
  })

  watch(items, () => {
    if (items.value.length > 0 && activeItem.value) {
      nextTick(() => debouncedScrollToActive())
    }
  })

  onMounted(() => {
    nextTick(() => scrollToActive())
  })

  return {
    debouncedScrollToActive,
    scrollToActive,
  }
}
