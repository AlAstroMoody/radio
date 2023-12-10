<script setup lang="ts">
import { computed } from 'vue'
import { radioList, useGlobalState } from 'processes'
import { iButton, iStation } from 'shared'

const state = useGlobalState()
const activeRadio = computed(() => state.activeRadio.value)
</script>

<template>
  <div class="h-96 w-full font-medium md:h-auto">
    <div
      class="my-4 text-center font-cyberpunk text-3xl text-black dark:text-white"
    >
      favorites
    </div>
    <iButton
      v-for="radio in radioList"
      :key="radio.id"
      :title="radio.name"
      class="pt-2 pb-3 md:py-1"
      :class="{ 'font-bold': radio.id === activeRadio }"
      @click="state.changeActiveRadio(radio.id)"
    >
      <iStation v-if="radio.id === activeRadio" class="mr-2" />
    </iButton>
  </div>
</template>
