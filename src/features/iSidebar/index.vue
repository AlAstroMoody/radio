<script setup lang="ts">
import { iButton, iLamp } from 'shared'
import { useDark, useToggle } from '@vueuse/core'
import { iRadioList } from 'features'

const isDarkTheme = useDark()
const toggleDark = useToggle(isDarkTheme)
</script>
<template>
  <aside class="flex flex-col justify-between">
    <div class="mb-4 font-cyberpunk text-6xl text-black dark:text-white">
      <div class="text-left">Amazing</div>
      <div class="text-right">radio</div>
    </div>
    <iRadioList />
    <iButton
      @click="toggleDark()"
      class="mx-8 mb-8 mt-auto hidden w-max rounded-xl text-xl font-bold md:flex"
      :title="isDarkTheme ? 'Light theme' : 'Dark theme'"
      variant="control"
    >
      <iLamp class="mr-2" />
    </iButton>
    <iButton
      @click="toggleDark()"
      class="relative ml-auto h-12 w-12 rounded-full md:hidden"
      variant="control"
    >
      <iLamp class="ml-[10px]" />
    </iButton>
  </aside>
</template>
