<script setup lang="ts">
import { useRadio } from 'composables/useRadio'
import { computed } from 'vue'

const { isRadioMode } = useRadio()

const musicHotkeys = [
  { action: 'play/pause', key: 'Space' },
  { action: 'seek', key: '←', suffix: ' / →' },
  { action: 'volume', key: '↑', suffix: ' / ↓' },
  { action: 'next', key: 'n' },
  { action: 'previous', key: 'p' },
  { action: 'repeat', key: 'r' },
  { action: 'shuffle', key: 's' },
  { action: 'undo seek', key: 'u' },
  { action: 'open files', key: 'o' },
]

const radioHotkeys = [
  { action: 'play/pause', key: 'Space' },
  { action: 'volume', key: '↑', suffix: ' / ↓' },
  { action: 'next station', key: 'n' },
  { action: 'previous station', key: 'p' },
]

const currentHotkeys = computed(() => isRadioMode.value ? radioHotkeys : musicHotkeys)
</script>

<template>
  <div class="fixed bottom-4 right-4 hidden xl:block z-40">
    <div class="bg-glass backdrop-blur-md border border-glass shadow-lg rounded-lg p-3 dark:bg-glass-purple dark:border-glass-purple-border">
      <div class="text-xs text-gray-700 dark:text-gray-200 space-y-1">
        <div class="font-semibold text-gray-700 dark:text-gray-100 mb-2">
          {{ isRadioMode ? 'Radio Hotkeys' : 'Music Hotkeys' }}
        </div>

        <div
          v-for="hotkey in currentHotkeys"
          :key="hotkey.key"
        >
          <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 border border-gray-600 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-200">
            {{ hotkey.key }}
          </kbd>
          {{ hotkey.suffix || '' }} {{ hotkey.action }}
        </div>
      </div>
    </div>
  </div>
</template>
