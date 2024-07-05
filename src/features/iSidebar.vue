<script setup lang="ts">
import { iButton, iLamp } from 'shared'
import { useDark, useToggle } from '@vueuse/core'
import { iRadioList } from 'features'
import { useFps } from '@vueuse/core'
const fps = useFps()

const isDarkTheme = useDark()
const toggleDark = useToggle(isDarkTheme)

const title = [
  { char: 'r', class: 'delay-0' },
  { char: 'a', class: 'delay-75' },
  { char: 'd', class: 'delay-150' },
  { char: 'i', class: 'delay-225' },
  { char: 'o', class: 'delay-300' },
]
</script>

<template>
  <aside class="flex flex-col justify-between">
    <div class="fixed right-8 top-1 w-14">fps: {{ fps }}</div>
    <div
      class="mb-4 w-full max-w-sm font-cyberpunk text-6xl text-black dark:text-white"
    >
      <div class="text-left">Amazing</div>
      <div class="text-right delay-100">
        <span v-for="(el, index) in title" :class="el.class" :key="index">
          {{ el.char }}
        </span>
      </div>
    </div>
    <iRadioList class="hidden md:block" />
    <iButton
      class="mx-8 mb-8 mt-auto hidden w-max rounded-xl text-xl font-bold md:flex"
      :title="isDarkTheme ? 'Light theme' : 'Dark theme'"
      variant="control"
      @click="toggleDark()"
    >
      <iLamp class="mr-2" />
    </iButton>
    <iButton
      class="absolute left-4 top-24 ml-auto h-12 w-12 rounded-full md:hidden"
      variant="control"
      @click="toggleDark()"
      aria-label="theme"
    >
      <iLamp class="ml-[10px]" />
    </iButton>
  </aside>
</template>
