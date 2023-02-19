<script setup lang="ts">
import { computed } from 'vue'
import { radioList } from 'processes'
import { useGlobalState } from 'processes'
import { iStation } from 'shared'
const state = useGlobalState()
const activeRadio = computed(() => state.activeRadio.value)
</script>
<template>
  <div class="w-max">
    <button
      v-for="(radio, index) in radioList"
      @click="state.changeActiveRadio(index)"
      class="flex text-left text-xl"
      :class="{ 'font-bold': index === activeRadio }"
    >
      <iStation v-if="index === activeRadio" class="mr-2" />
      {{ radio.name }}
    </button>
  </div>
</template>
