<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onMounted, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  prompt: () => Promise<void>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

const isShow = ref(false)
const installEvent = ref<BeforeInstallPromptEvent>()
async function hideComponent() {
  if ('getInstalledRelatedApps' in navigator) {
    try {
      const relatedApps = await navigator.getInstalledRelatedApps()
      const PWAisInstalled = relatedApps.length > 0
      if (PWAisInstalled)
        isShow.value = false
    }
    catch {}
  }
}

function installPWA() {
  if (!installEvent.value)
    return
  installEvent.value.prompt()
  installEvent.value.userChoice.then(() => {
    isShow.value = false
  })
}
onMounted(() => {
  hideComponent()
  if (window.launchQueue) {
    window.launchQueue.setConsumer((params) => {
      // eslint-disable-next-line no-console
      console.log(params)
    })
  }
})

useEventListener(
  window,
  'beforeinstallprompt',
  (e: BeforeInstallPromptEvent) => {
    e.preventDefault()
    installEvent.value = e
    isShow.value = true
  },
)
</script>

<template>
  <div
    v-if="isShow"
    class="pwa-install-button fixed right-0 z-10 flex gap-1 rounded-bl-xl bg-dark-200 p-4 text-light-200 lg:hidden"
  >
    <button class="rounded-l-xl border p-1" @click="installPWA">
      Install Radio!
    </button>
    <button class="rounded-r-xl border p-1" @click="isShow = false">
      No, thanks
    </button>
  </div>
</template>

<style>
@media (display-mode: standalone), (display-mode: window-controls-overlay) {
  .pwa-install-button {
    display: none;
  }
}
</style>
