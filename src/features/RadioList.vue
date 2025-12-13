<script setup lang="ts">
import { useRadio } from 'composables/useRadio'

import MusicFileList from './MusicFileList.vue'
import RadioStationList from './RadioStationList.vue'

const { isRadioMode } = useRadio()
</script>

<template>
  <RadioStationList v-if="isRadioMode" />
  <MusicFileList v-else />
</template>
