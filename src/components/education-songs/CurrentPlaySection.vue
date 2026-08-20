<!-- components/NowPlayingBanner.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useThemeStore } from '@/stores/theme'
import type { EdukasiSong } from '@/types'

const props = defineProps<{
  songs: EdukasiSong[]
}>()

const playerStore = usePlayerStore()
const themeStore = useThemeStore()

const isVisible = computed(() =>
  !!playerStore.currentTrack?.audio_url &&
  props.songs.some(s => s.url_audio?.trim() === playerStore.currentTrack?.audio_url)
)
</script>

<template>
  <Transition name="banner">
    <div v-if="isVisible"
      class="dark:bg-gradient-to-r dark:from-[#1e3a2f] dark:to-[#1e2a3a] bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-4 border dark:border-gray-700 border-gray-200 mb-6 flex items-center gap-4">

      <!-- Thumbnail -->
      <div class="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative bg-gray-200 dark:bg-gray-800">
        <img v-if="playerStore.currentTrack?.image_url" :src="playerStore.currentTrack.image_url"
          :alt="playerStore.currentTrack.title" class="w-full h-full object-cover" loading="lazy" decoding="async" />
        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-800 to-purple-500"
          :class="playerStore.currentTrack?.image_url ? '-z-10' : 'z-0'">
          <i class="ri-music-2-line text-white/70 text-lg" />
        </div>
        <!-- Equalizer -->
        <div v-if="playerStore.isPlaying" class="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div class="flex items-end gap-0.5 h-4">
            <span class="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
              style="height:40%;animation-delay:0s" />
            <span class="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
              style="height:100%;animation-delay:0.15s" />
            <span class="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
              style="height:60%;animation-delay:0.3s" />
            <span class="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
              style="height:80%;animation-delay:0.1s" />
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5"
          :class="themeStore.mode === 'dark' ? 'text-brand-green' : 'text-brand-red'">
          Sedang Diputar
        </p>
        <p class="font-bold dark:text-white text-gray-900 text-sm truncate">
          {{ playerStore.currentTrack?.title }}
        </p>
        <p class="text-xs dark:text-gray-400 text-gray-500 truncate">
          {{ playerStore.currentTrack?.subtitle }}
        </p>
      </div>

      <!-- Toggle -->
      <button @click="playerStore.togglePlay()"
        class="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0"
        :class="themeStore.mode === 'dark'
          ? 'bg-brand-green hover:bg-green-400'
          : 'bg-brand-red hover:bg-red-400'">
        <i :class="playerStore.isPlaying ? 'ri-pause-fill' : 'ri-play-fill'" class="text-lg" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: all 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>