import type { MaybeRefOrGetter, Ref } from 'vue'

import { onScopeDispose, toValue, watch } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap(
  target: Ref<HTMLElement | null>,
  active: MaybeRefOrGetter<boolean>,
  options: { initialFocus?: Ref<HTMLElement | null> } = {},
): void {
  let previousFocus: HTMLElement | null = null

  function getFocusable(): HTMLElement[] {
    const root = target.value
    if (!root)
      return []

    return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
      .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null)
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !target.value)
      return

    const focusable = getFocusable()
    if (!focusable.length) {
      event.preventDefault()
      target.value.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const current = document.activeElement as HTMLElement | null

    if (event.shiftKey) {
      if (current === first || !target.value.contains(current)) {
        event.preventDefault()
        last.focus()
      }
      return
    }

    if (current === last || !target.value.contains(current)) {
      event.preventDefault()
      first.focus()
    }
  }

  function activate(): void {
    previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    requestAnimationFrame(() => {
      const preferred = options.initialFocus?.value
      if (preferred) {
        preferred.focus()
        return
      }

      const focusable = getFocusable()
      ;(focusable[0] ?? target.value)?.focus()
    })

    document.addEventListener('keydown', onKeyDown, true)
  }

  function deactivate(): void {
    document.removeEventListener('keydown', onKeyDown, true)
    previousFocus?.focus?.()
    previousFocus = null
  }

  watch(
    () => toValue(active),
    (isActive) => {
      if (isActive)
        activate()
      else
        deactivate()
    },
    { flush: 'post' },
  )

  onScopeDispose(deactivate)
}
