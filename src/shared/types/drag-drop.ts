export interface DragDropCallbacks<T = any> {
  /** Вызывается при завершении перетаскивания */
  onDragEnd?: (item: T, index: number) => void
  /** Вызывается при покидании элемента во время перетаскивания */
  onDragLeave?: (item: T, index: number) => void
  /** Вызывается при наведении на элемент во время перетаскивания */
  onDragOver?: (item: T, index: number) => void
  /** Вызывается при начале перетаскивания */
  onDragStart?: (item: T, index: number) => void
  /** Вызывается при переупорядочивании элементов */
  onReorder?: (fromIndex: number, toIndex: number) => void
}

export interface DragDropHandlers {
  draggable: {
    'class': string[]
    'data-drag-index': number
    'draggable': boolean
    'onClick': (event: Event) => void
    'onDragend': (event: DragEvent) => void
    'onDragstart': (event: DragEvent) => void
    'onTouchend': (event: TouchEvent) => void
    'onTouchmove': (event: TouchEvent) => void
    'onTouchstart': (event: TouchEvent) => void
  }
  dropTarget: {
    onDragleave: (event: DragEvent) => void
    onDragover: (event: DragEvent) => void
    onDrop: (event: DragEvent) => void
  }
}

export interface DragDropOptions {
  /** Включить поддержку mouse drag & drop */
  enableMouse?: boolean
  /** Включить поддержку touch событий */
  enableTouch?: boolean
  /** Предотвращать клик во время перетаскивания */
  preventClickOnDrag?: boolean
  /** Порог движения для активации перетаскивания на touch устройствах (в пикселях) */
  touchThreshold?: number
}

export interface DragDropState {
  /** Индекс перетаскиваемого элемента */
  draggedIndex: null | number
  /** Индекс элемента-цели */
  dragOverIndex: null | number
  /** Флаг активного перетаскивания на touch устройствах */
  isDragging: boolean
  /** Текущая Y координата для touch событий */
  touchCurrentY: number
  /** Начальная Y координата для touch событий */
  touchStartY: number
}

export interface UseDragDropReturn<T = any> {
  actions: {
    reset: () => void
  }
  clickStartPosition: () => null | { x: number, y: number }
  clickStartTime: () => number
  createHandlers: (index: number, item: T) => DragDropHandlers
  state: DragDropState
}
