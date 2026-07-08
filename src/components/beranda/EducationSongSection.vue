<!-- components/beranda/EdukasiAndKarakter.vue -->
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { usePlayerStore } from '@/stores/player'

defineProps<{
  todayEdukasiSong: any
  isEdukasiActive: boolean
  isEdukasiPlaying: boolean
  progressPercent: number
  displayed: any[]
}>()

const emit = defineEmits<{
  'play': []
  'seek': [event: MouseEvent]
  'seek-start': []
}>()

const themeStore = useThemeStore()
const playerStore = usePlayerStore()

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

    <!-- Lagu Edukasi Hari Ini -->
    <div class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i class="ri-music-2-line text-base dark:text-gray-400 text-gray-500" />
          <h2 class="text-sm font-extrabold uppercase tracking-wider dark:text-gray-200 text-gray-800">
            Lagu Edukasi Hari Ini
          </h2>
        </div>
        <RouterLink to="/lagu" class="text-xs dark:text-brand-green text-brand-red font-bold hover:underline">
          Lihat Semua →
        </RouterLink>
      </div>

      <!-- Ada data -->
      <div v-if="todayEdukasiSong" class="flex gap-3 py-3">

        <!-- Thumbnail -->
        <div class="w-16 h-16 rounded-xl flex-shrink-0 relative overflow-hidden bg-gray-200 dark:bg-gray-800">
          <img v-if="todayEdukasiSong.img_url" :src="todayEdukasiSong.img_url" :alt="todayEdukasiSong.judul"
            class="w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
          <div v-else
            class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-800 to-purple-500">
            <i class="ri-music-2-line text-white/70 text-xl" />
          </div>
          <div v-if="isEdukasiPlaying" class="absolute inset-0 bg-black/40 flex items-center justify-center">
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

        <!-- Info + player -->
        <div class="w-full">
          <p class="text-xs font-bold dark:text-white text-gray-900 mb-0.5">{{ todayEdukasiSong.judul }}</p>
          <p class="text-[10px] dark:text-gray-500 text-gray-400 mb-2">{{ todayEdukasiSong.isi }}</p>

          <!-- Progress bar -->
          <div class="flex-1 relative h-1 dark:bg-gray-700 bg-gray-300 rounded-full cursor-pointer group mb-2"
            @mousedown="emit('seek-start')" @click="emit('seek', $event)">
            <div class="h-1 rounded-full transition-none"
              :class="themeStore.mode === 'dark' ? 'bg-brand-green' : 'bg-red-500'"
              :style="{ width: (isEdukasiActive ? progressPercent : 0) + '%' }" />
            <div
              class="absolute w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
              :style="{
                top: '50%',
                left: (isEdukasiActive ? progressPercent : 0) + '%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }" />
          </div>

          <div class="flex items-center gap-2">
            <button @click="emit('play')"
              class="w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 transition-transform flex-shrink-0"
              :class="themeStore.mode === 'dark' ? 'bg-brand-green' : 'bg-red-500'">
              <i :class="isEdukasiPlaying ? 'ri-pause-fill' : 'ri-play-fill'" class="text-white text-sm"
                :style="!isEdukasiPlaying ? 'margin-left:1px' : ''" />
            </button>
            <span class="text-[10px] dark:text-gray-500 text-gray-400 tabular-nums">
              {{ isEdukasiActive ? formatTime(playerStore.currentTime) : (todayEdukasiSong as any).durasi }}
            </span>
          </div>
        </div>
      </div>

      <!-- Kosong -->
      <div v-else class="flex flex-col items-center py-6 text-center">
        <div class="w-12 h-12 rounded-xl dark:bg-gray-800 bg-gray-100 flex items-center justify-center mb-2">
          <i class="ri-music-off-line text-xl dark:text-gray-600 text-gray-400" />
        </div>
        <p class="text-xs font-bold dark:text-gray-500 text-gray-400">Belum ada lagu edukasi hari ini</p>
        <p class="text-[10px] dark:text-gray-600 text-gray-400 mt-0.5">Silakan cek kembali nanti</p>
      </div>
    </div>

    <!-- Karakter & Habit -->
    <div class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-yellow-400">⭐</span>
          <h2 class="text-sm font-extrabold uppercase tracking-wider dark:text-gray-200 text-gray-800">
            Karakter & Habit
          </h2>
        </div>
        <RouterLink to="/karakter" class="text-xs dark:text-brand-green text-brand-red font-bold hover:underline">
          Lihat Semua →
        </RouterLink>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <div v-for="item in displayed" :key="item.id" class="flex flex-col items-center text-center">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-1 hover:scale-110 transition-transform cursor-default"
            :class="item.bgClass">
            {{ item.emoji }}
          </div>
          <p class="text-xs font-bold dark:text-gray-200 text-gray-800 leading-tight">{{ item.title }}</p>
          <p class="text-[10px] dark:text-gray-500 text-gray-400 mt-0.5 leading-tight">{{ item.description }}</p>
        </div>
      </div>
    </div>

  </div>
</template>