<script setup lang="ts">
import { radioWaves, useGlobalState } from 'processes'
import { iButton, iStation } from 'shared'

const { changeActiveRadio, activeRadio } = useGlobalState()
</script>

<template>
  <div class="w-full font-medium md:h-auto">
    <div
      class="my-4 text-center font-cyberpunk text-3xl text-black dark:text-white"
    >
      favorites
    </div>
    <div class="overflow-auto max-h-[calc(100dvh-150px)] md:max-h-fit">
      <iButton
        v-for="radio in radioWaves"
        :key="radio.id"
        :label="radio.name"
        class="pb-3 pt-2 md:py-1"
        :class="{ 'font-bold': radio.id === activeRadio.id }"
        @click="changeActiveRadio(radio.id)"
      >
        <iStation v-if="radio.id === activeRadio.id" class="mr-2" />
        {{ radio.name }}
      </iButton>
    </div>
  </div>
</template>
