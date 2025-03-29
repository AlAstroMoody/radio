<script setup lang="ts">
import { iButton, iPlaylist } from 'shared/ui'
</script>

<template>
  <iButton
    class="h-12 w-12 rounded-full"
    variant="control"
    label="mode"
  >
    <iPlaylist class="mx-2" />
  </iButton>
</template>
