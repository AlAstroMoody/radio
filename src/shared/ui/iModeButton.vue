<script setup lang="ts">
import { iButton, iStation, iNote } from 'shared/ui'

import { useGlobalState } from 'processes'

const { changeMode, isRadioMode } = useGlobalState()
</script>

<template>
  <iButton
    class="h-12 w-12 rounded-full"
    variant="control"
    @click="changeMode"
    label="mode"
  >
    <iNote class="ml-[5px]" v-if="isRadioMode" />
    <iStation class="ml-[10px]" v-else />
  </iButton>
</template>
