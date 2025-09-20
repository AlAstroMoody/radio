import type { DragDropCallbacks, DragDropHandlers, DragDropOptions, DragDropState, UseDragDropReturn } from 'shared/types/drag-drop'

import { reactive } from 'vue'

/**
 * Переиспользуемый composable для drag & drop функциональности
 * Поддерживает как mouse, так и touch события
 */
export function useDragDrop<T = any>(
  callbacks: DragDropCallbacks<T> = {},
  options: DragDropOptions = {},
): UseDragDropReturn<T> {
  const {
    enableMouse = true,
    enableTouch = true,
    touchThreshold = 10,
  } = options

  const {
    onDragEnd,
    onDragLeave,
    onDragOver,
    onDragStart,
    onReorder,
  } = callbacks

  // Состояние drag & drop
  const state = reactive<DragDropState>({
    draggedIndex: null,
    dragOverIndex: null,
    isDragging: false,
    touchCurrentY: 0,
    touchStartY: 0,
  })

  let clickStartTime = 0
  let clickStartPosition = { x: 0, y: 0 }
  function reset(): void {
    state.draggedIndex = null
    state.dragOverIndex = null
    state.isDragging = false
    state.touchStartY = 0
    state.touchCurrentY = 0
  }

  function handleDragStart(event: DragEvent, index: number, item: T): void {
    if (!enableMouse)
      return

    clickStartTime = Date.now()
    clickStartPosition = { x: event.clientX, y: event.clientY }
    state.draggedIndex = index
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', '')
    }
    onDragStart?.(item, index)
  }

  function handleDragOver(event: DragEvent, index: number, item: T): void {
    if (!enableMouse)
      return

    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    state.dragOverIndex = index
    onDragOver?.(item, index)
  }

  function handleDragLeave(event: DragEvent, index: number, item: T): void {
    if (!enableMouse)
      return

    state.dragOverIndex = null
    onDragLeave?.(item, index)
  }

  function handleDrop(event: DragEvent, dropIndex: number): void {
    if (!enableMouse)
      return

    event.preventDefault()

    if (state.draggedIndex !== null && state.draggedIndex !== dropIndex) {
      onReorder?.(state.draggedIndex, dropIndex)
    }

    reset()
  }

  function handleDragEnd(event: DragEvent, index: number, item: T): void {
    if (!enableMouse)
      return

    const dragDuration = Date.now() - clickStartTime
    const dragDistance = Math.sqrt(
      (event.clientX - clickStartPosition.x) ** 2
      + (event.clientY - clickStartPosition.y) ** 2,
    )

    if (dragDuration < 150 && dragDistance < 10) {
      state.isDragging = false
    }

    onDragEnd?.(item, index)
    reset()
  }

  function handleTouchStart(event: TouchEvent, index: number, _item: T): void {
    if (!enableTouch || event.touches.length !== 1)
      return

    const touch = event.touches[0]
    clickStartTime = Date.now()
    clickStartPosition = { x: touch.clientX, y: touch.clientY }
    state.touchStartY = touch.clientY
    state.touchCurrentY = touch.clientY
    state.draggedIndex = index
    state.isDragging = false
  }

  function handleTouchMove(event: TouchEvent, _index: number): void {
    if (!enableTouch || event.touches.length !== 1 || state.draggedIndex === null)
      return

    const touch = event.touches[0]
    state.touchCurrentY = touch.clientY

    const deltaY = Math.abs(state.touchCurrentY - state.touchStartY)

    if (deltaY > touchThreshold * 1.5 && !state.isDragging) {
      state.isDragging = true
      event.preventDefault()
    }

    if (state.isDragging) {
      event.preventDefault()

      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      const buttonElement = elementBelow?.closest('[data-drag-index]')

      if (buttonElement) {
        const targetIndex = Number.parseInt(buttonElement.getAttribute('data-drag-index') || '0')
        if (targetIndex !== state.draggedIndex) {
          state.dragOverIndex = targetIndex
        }
      }
    }
  }

  function handleTouchEnd(event: TouchEvent, index: number, item: T): void {
    if (!enableTouch || state.draggedIndex === null)
      return

    const touchDuration = Date.now() - clickStartTime
    const touchDistance = Math.sqrt(
      (event.changedTouches[0].clientX - clickStartPosition.x) ** 2
      + (event.changedTouches[0].clientY - clickStartPosition.y) ** 2,
    )

    if (touchDuration < 300 && touchDistance < 20) {
      state.isDragging = false
    }

    if (state.isDragging && state.dragOverIndex !== null && state.draggedIndex !== state.dragOverIndex) {
      onReorder?.(state.draggedIndex, state.dragOverIndex)
    }

    if (state.isDragging) {
      onDragEnd?.(item, state.draggedIndex)
    }

    reset()
  }

  function createHandlers(index: number, item: T): DragDropHandlers {
    return {
      draggable: {
        'class': [
          state.draggedIndex === index ? 'opacity-50 scale-95' : '',
          state.dragOverIndex === index ? 'ring-2 ring-blue-400 ring-opacity-50' : '',
          state.isDragging && state.draggedIndex === index ? 'z-10' : '',
        ],
        'data-drag-index': index,
        'draggable': enableMouse,
        'onDragend': (event: DragEvent) => handleDragEnd(event, index, item),
        'onDragstart': (event: DragEvent) => handleDragStart(event, index, item),
        'onTouchend': (event: TouchEvent) => handleTouchEnd(event, index, item),
        'onTouchmove': (event: TouchEvent) => handleTouchMove(event, index),
        'onTouchstart': (event: TouchEvent) => handleTouchStart(event, index, item),
      },
      dropTarget: {
        onDragleave: (event: DragEvent) => handleDragLeave(event, index, item),
        onDragover: (event: DragEvent) => handleDragOver(event, index, item),
        onDrop: (event: DragEvent) => handleDrop(event, index),
      },
    }
  }

  return {
    actions: {
      reset,
    },
    clickStartPosition: () => clickStartPosition,
    clickStartTime: () => clickStartTime,
    createHandlers,
    state,
  }
}
