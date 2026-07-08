<template>
  <Transition name="slide-down">
    <button v-if="isInstallable && !isInstalled" @click="install"
      class="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors dark:border-gray-700 border-gray-200 dark:text-gray-300 text-gray-600 hover:bg-brand-green hover:text-white hover:border-brand-green">
      <i class="ri-download-line text-sm" />
      Install App
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { useInstallPwa } from '@/composables/useInstallPwa'
const { isInstallable, isInstalled, install } = useInstallPwa()
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>