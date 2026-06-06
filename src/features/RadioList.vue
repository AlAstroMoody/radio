<script setup lang="ts">
import { useRadio } from 'composables/useRadio'

import MusicFileList from './MusicFileList.vue'
import RadioStationList from './RadioStationList.vue'

const { isRadioMode } = useRadio()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <RadioStationList v-if="isRadioMode" />
    <MusicFileList v-else />
  </div>
</template>
