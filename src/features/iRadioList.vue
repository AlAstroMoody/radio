<script setup lang="ts">
import { computed } from 'vue'
import { radioList, useGlobalState } from 'processes'
import { iButton, iStation } from 'shared'

const state = useGlobalState()
const activeRadio = computed(() => state.activeRadio.value)
</script>

<template>
  <div class="h-fit w-full font-medium md:h-auto">
    <div
      class="my-4 text-center font-cyberpunk text-3xl text-black dark:text-white"
    >
      favorites
    </div>
    <div class="max-h-56 overflow-auto md:max-h-fit">
      <iButton
        v-for="radio in radioList"
        :key="radio.id"
        :title="radio.name"
        class="pb-3 pt-2 md:py-1"
        :class="{ 'font-bold': radio.id === activeRadio }"
        @click="state.changeActiveRadio(radio.id)"
      >
        <iStation v-if="radio.id === activeRadio" class="mr-2" />
      </iButton>
    </div>
  </div>
</template>
