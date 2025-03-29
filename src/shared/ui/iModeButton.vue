<script setup lang="ts">
import { iButton, iNote, iStation } from 'shared/ui'

const isRadioMode = defineModel()
</script>

<template>
  <iButton
    class="h-12 w-12 rounded-full"
    variant="control"
    label="mode"
  >
    <iNote v-if="isRadioMode" class="ml-[5px]" />
    <iStation v-else class="ml-[10px]" />
  </iButton>
</template>
