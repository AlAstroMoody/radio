<script setup lang="ts">
import { iSidebar } from 'features'
import { RouterView } from 'vue-router'
</script>

<template>
  <div
    class="flex min-h-screen w-full flex-col justify-between bg-light-100 text-blue-100 transition-colors dark:bg-dark-100 md:flex-row"
  >
    <iSidebar class="h-80 w-full overflow-hidden p-4 md:h-screen md:w-96" />
    <div class="h-full w-full px-4">
      <router-view />
    </div>
  </div>
</template>
