<script setup lang="ts">
import { useRadio } from 'composables/useRadio'
import { radioWaves } from 'music'
import { BaseButton, iStation } from 'shared'

const { activeRadio, changeActiveRadio } = useRadio()
</script>

<template>
  <div class="font-medium h-full md:h-auto px-1 md:px-5 max-w-full border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-lg dark:shadow-xl shadow-right p-4">
    <div class="mb-4 font-blackcraft text-3xl text-black dark:text-white text-center">
      radio stations
    </div>
    <div class="overflow-auto max-h-[calc(100dvh-190px)] md:h-96">
      <div class="pl-2 pr-2 overflow-visible flex flex-col gap-3 py-3">
        <BaseButton
          v-for="radio in radioWaves"
          :key="radio.id"
          :label="radio.name"
          variant="list"
          class="truncate max-w-full"
          :active="radio.id === activeRadio.id"
          @click="changeActiveRadio(radio.id)"
        >
          <div class="flex items-center">
            <iStation v-if="radio.id === activeRadio.id" class="mr-2" />
            {{ radio.name }}
          </div>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
