<script setup lang="ts">
import { computed } from 'vue'
import { radioList } from 'processes'
import { useGlobalState } from 'processes'
import { iStation } from 'shared'
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

    <button
      :aria-label="radio.name"
      v-for="(radio, index) in radioList"
      @click="state.changeActiveRadio(index)"
      class="flex pt-2 pb-3 text-left text-xl text-dark-200 dark:text-blue-100 md:py-1"
      :class="{ 'font-bold': index === activeRadio }"
    >
      <iStation v-if="index === activeRadio" class="mr-2" />
      {{ radio.name }}
    </button>
  </div>
</template>
