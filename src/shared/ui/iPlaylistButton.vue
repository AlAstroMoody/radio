<script setup lang="ts">
import { iButton, iPlaylist } from 'shared/ui'

import { useGlobalState } from 'processes'

const { togglePlaylist } = useGlobalState()
</script>

<template>
  <iButton
    class="h-12 w-12 rounded-full"
    variant="control"
    @click="togglePlaylist"
    label="mode"
  >
    <iPlaylist class="mx-2" />
  </iButton>
</template>
