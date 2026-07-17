import type { DeepReadonly, Ref } from 'vue'

import { readonly, ref } from 'vue'

export interface ToastApi {
  hideToast: () => void
  message: DeepReadonly<Ref<string>>
  showToast: (text: string, options?: ToastOptions) => void
  visible: DeepReadonly<Ref<boolean>>
}

export interface ToastOptions {
  duration?: number
}

let toastInstance: null | ToastApi = null

export function useToast(): ToastApi {
  if (!toastInstance)
    toastInstance = createToastInstance()

  return toastInstance
}

function createToastInstance(): ToastApi {
  const message = ref('')
  const visible = ref(false)
  let hideTimer = 0
  let sequence = 0

  function hideToast(): void {
    visible.value = false
    window.clearTimeout(hideTimer)
    hideTimer = 0
  }

  function showToast(text: string, options: ToastOptions = {}): void {
    const trimmed = text.trim()
    if (!trimmed)
      return

    const duration = options.duration ?? 4000
    const token = ++sequence

    message.value = trimmed
    visible.value = true
    window.clearTimeout(hideTimer)

    if (duration <= 0)
      return

    hideTimer = window.setTimeout(() => {
      if (token !== sequence)
        return
      hideToast()
    }, duration)
  }

  return {
    hideToast,
    message: readonly(message),
    showToast,
    visible: readonly(visible),
  }
}
