<script setup lang="ts">
import { useFileList } from 'composables/useFileList'
import { computed } from 'vue'

import MusicFileList from './MusicFileList.vue'
import RadioStationList from './RadioStationList.vue'

const { isRadioMode } = defineProps({
  isRadioMode: Boolean,
})

const { files } = useFileList()
const hasFiles = computed(() => files.value.length > 0)
</script>

<template>
  <RadioStationList v-if="isRadioMode || !hasFiles" />
  <MusicFileList v-else />
</template>
