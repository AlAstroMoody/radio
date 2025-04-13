<script setup lang="ts">
import { useRadio } from 'composables/useRadio'
import { radioWaves } from 'music'
import { BaseButton, iStation } from 'shared'

const { changeActiveRadio, activeRadio } = useRadio()
</script>

<template>
  <div class="font-medium md:h-auto px-5">
    <div
      class="my-4 text-center font-cyberpunk text-3xl text-black dark:text-white"
    >
      favorites
    </div>
    <div class="overflow-auto max-h-[calc(100dvh-150px)] md:h-96 -scale-x-100">
      <div class="-scale-x-100 pl-2">
        <BaseButton
          v-for="radio in radioWaves"
          :key="radio.id"
          :label="radio.name"
          class="pb-3 pt-2 md:py-1"
          :class="{ 'font-bold': radio.id === activeRadio.id }"
          @click="changeActiveRadio(radio.id)"
        >
          <iStation v-if="radio.id === activeRadio.id" class="mr-2" />
          {{ radio.name }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
