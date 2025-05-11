<script setup lang="ts">
import { useFileList } from 'composables/useFileList'
import { useRadio } from 'composables/useRadio'
import { radioWaves } from 'music'
import { BaseButton, iStation } from 'shared'
import { computed } from 'vue'

const { isRadioMode } = defineProps({
  isRadioMode: Boolean,
})
const { activeRadio, changeActiveRadio } = useRadio()
const { activeFile, changeActiveFile, files } = useFileList()
const playlist = computed(() => files.value.map(file => file.name))
const currentFileName = computed(() => (activeFile.value as File)?.name || '')
</script>

<template>
  <div class="font-medium md:h-auto px-5 max-w-full md:max-w-lg">
    <div
      class="mb-4 font-blackcraft text-3xl text-black dark:text-white"
    >
      favorites
    </div>
    <div class="overflow-auto max-h-[calc(100dvh-190px)] md:h-96">
      <div class="pl-2 overflow-hidden flex flex-col gap-3">
        <template v-if="!playlist.length || isRadioMode">
          <BaseButton
            v-for="radio in radioWaves"
            :key="radio.id"
            :label="radio.name"
            class="truncate max-w-full"
            :class="{ 'font-bold': radio.id === activeRadio.id }"
            @click="changeActiveRadio(radio.id)"
          >
            <div class="flex items-center">
              <iStation v-if="radio.id === activeRadio.id" class="mr-2" />
              {{ radio.name }}
            </div>
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton
            v-for="(name, index) in playlist"
            :key="name"
            :label="name"
            class="truncate max-w-full"
            :class="{ 'font-bold': name === currentFileName }"
            @click="changeActiveFile(index)"
          >
            {{ name }}
          </BaseButton>
        </template>
      </div>
    </div>
  </div>
</template>
