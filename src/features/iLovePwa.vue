<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const isShow = ref(true)
const installEvent = ref<BeforeInstallPromptEvent>()
function installPWA() {
  if (!installEvent.value) return
  installEvent.value.prompt()
  installEvent.value.userChoice.then((choice) => {
    isShow.value = false
  })
}

// async function hideComponent() {
//   if ('getInstalledRelatedApps' in navigator) {
//     const relatedApps = await navigator.getInstalledRelatedApps()
//     const PWAisInstalled = relatedApps.length > 0

//     if (PWAisInstalled) isShow.value = false
//   }
// }

useEventListener(
  document,
  'beforeinstallprompt',
  (e: BeforeInstallPromptEvent) => {
    alert('before magic...')
    e.preventDefault()
    installEvent.value = e
    isShow.value = true
  }
)
</script>

<template>
  <div
    v-if="isShow"
    class="pwa-install-button fixed right-0 z-10 flex gap-1 rounded-bl-xl bg-dark-200 p-4 text-light-200"
  >
    <button @click="installPWA" class="rounded-l-xl border p-1">
      Install PWA
    </button>
    <button @click="isShow = false" class="rounded-r-xl border p-1">
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
