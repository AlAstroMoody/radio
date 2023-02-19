<script setup lang="ts">
import { iButton, iLamp } from 'shared'
import { useDark, useToggle } from '@vueuse/core'
import { iRadioList } from 'features'

const isDarkTheme = useDark()
const toggleDark = useToggle(isDarkTheme)
</script>
<template>
  <aside class="flex flex-col justify-between">
    <iRadioList />
    <iButton
      @click="toggleDark()"
      class="mx-8 mb-8 mt-auto hidden rounded-xl text-base font-bold md:flex"
      :title="isDarkTheme ? 'Светлая тема' : 'Тёмная тема'"
    >
      <iLamp class="mr-2" />
    </iButton>
    <iButton
      @click="toggleDark()"
      class="relative ml-auto h-12 w-12 rounded-full md:hidden"
    >
      <iLamp />
    </iButton>
  </aside>
</template>
