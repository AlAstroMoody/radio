<script setup lang="ts">
import { iSidebar } from 'features'
import { RouterView } from 'vue-router'
</script>

<template>
  <div
    class="flex min-h-screen w-full flex-col justify-between bg-light-100 text-blue-100 transition-colors dark:bg-dark-100 md:flex-row"
  >
    <iSidebar
      class="z-10 w-full overflow-hidden p-4 md:h-screen md:w-96 md:min-w-[24rem]"
    />
    <div class="z-10 flex h-full w-full px-4 md:h-screen">
      <router-view />
    </div>
    <img
      src="/images/flame-left.webp"
      class="pointer-events-none absolute top-0 left-0 z-0"
      alt=""
    />
    <img
      src="/images/flame-right.webp"
      class="pointer-events-none absolute bottom-0 right-0 z-0"
      alt=""
    />
  </div>
</template>
