<script setup lang="ts">
import { iButton, iLamp } from 'shared'
import { useDark, useToggle } from '@vueuse/core'
import { iRadioList } from 'features'

const isDarkTheme = useDark()
const toggleDark = useToggle(isDarkTheme)
</script>

<template>
  <aside class="flex flex-col justify-between">
    <div
      class="mb-4 w-full max-w-sm font-cyberpunk text-6xl text-black dark:text-white"
    >
      <div class="text-left">
        Amazing
      </div>
      <div class="text-right">
        radio
      </div>
    </div>
    <iRadioList />
    <iButton
      class="mx-8 mb-8 mt-auto hidden w-max rounded-xl text-xl font-bold md:flex"
      :title="isDarkTheme ? 'Light theme' : 'Dark theme'"
      variant="control"
      @click="toggleDark()"
    >
      <iLamp class="mr-2" />
    </iButton>
    <iButton
      class="absolute top-1 right-1 ml-auto h-12 w-12 rounded-full md:hidden"
      variant="control"
      @click="toggleDark()"
    >
      <iLamp class="ml-[10px]" />
    </iButton>
  </aside>
</template>
