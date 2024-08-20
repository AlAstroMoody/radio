<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { iButton, iLamp } from 'shared'
const isDarkTheme = useDark()
const toggleDark = useToggle(isDarkTheme)
</script>
<template>
  <iButton
    class="h-12 w-12 rounded-full text-xl font-bold md:w-max md:rounded-xl flex relative"
    variant="control"
    @click="toggleDark()"
    label="theme"
  >
    <iLamp class="md:ml-[10px] absolute left-[14px] md:relative md:left-0" />
    <span class="hidden md:block">
      {{ isDarkTheme ? 'Light theme' : 'Dark theme' }}
    </span>
  </iButton>
</template>
