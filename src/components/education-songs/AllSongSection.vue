<!-- components/EdukasiSongGrid.vue -->
<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'
import { useContentStore } from '@/stores/content'
import { gradientFor } from '@/composables/useContent'

interface EdukasiSong {
  id: string | number
  judul?: string
  isi?: string
  img_url?: string
  url_audio?: string
  durasi?: string
}

const props = defineProps<{
  songs: EdukasiSong[]
}>()

const emit = defineEmits<{
  play: [song: EdukasiSong]
}>()

const playerStore = usePlayerStore()
const contentStore = useContentStore()

function isActive(song: EdukasiSong) {
  return playerStore.currentTrack?.audio_url === song.url_audio?.trim()
}

function isPlaying(song: EdukasiSong) {
  return isActive(song) && playerStore.isPlaying
}
</script>

<template>
  <!-- Skeleton -->
  <div v-if="contentStore.loading && !songs.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <div v-for="i in 6" :key="i"
      class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100 animate-pulse">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-14 h-14 rounded-xl dark:bg-gray-700 bg-gray-200 flex-shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3 dark:bg-gray-700 bg-gray-200 rounded w-3/4" />
          <div class="h-2 dark:bg-gray-700 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div class="h-8 dark:bg-gray-700 bg-gray-200 rounded-full w-24" />
    </div>
  </div>

  <!-- Grid -->
  <div v-else-if="songs.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <div v-for="song in songs" :key="song.id"
      class="card-hover dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100 cursor-pointer transition-all group"
      :class="isActive(song) ? 'ring-2 ring-brand-red dark:ring-brand-green' : ''" @click="emit('play', song)">

      <!-- Thumbnail + info -->
      <div class="flex items-center gap-3 mb-3">
        <div class="relative flex-shrink-0 w-14 h-14">
          <img v-if="song.img_url" :src="song.img_url" :alt="song.judul" class="w-full h-full rounded-xl object-cover"
            loading="lazy" decoding="async" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
          <div class="absolute inset-0 rounded-xl flex items-center justify-center"
            :class="song.img_url ? '-z-10' : 'z-0'"
            :style="{ background: `linear-gradient(135deg, ${gradientFor(Number(song.id)).from}, ${gradientFor(Number(song.id)).to})` }">
            <i class="ri-music-2-line text-white/60 text-xl" />
          </div>

          <!-- Playing indicator -->
          <div v-if="isActive(song)" class="absolute inset-0 rounded-xl flex items-center justify-center"
            :class="isPlaying(song) ? 'bg-black/40' : 'bg-black/20'">
            <div v-if="isPlaying(song)" class="flex items-end gap-0.5 h-4">
              <span class="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                style="height:40%;animation-delay:0s" />
              <span class="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                style="height:100%;animation-delay:0.15s" />
              <span class="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                style="height:60%;animation-delay:0.3s" />
              <span class="w-0.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                style="height:80%;animation-delay:0.1s" />
            </div>
            <i v-else class="ri-pause-fill text-white text-lg" />
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <p class="font-bold dark:text-white text-gray-900 text-sm leading-tight truncate">
            {{ song.judul }}
          </p>
          <p class="text-xs dark:text-gray-400 text-gray-500 truncate">{{ song.isi }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-2 border-t dark:border-gray-800 border-gray-100">
        <button @click.stop="emit('play', song)"
          class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors" :class="isPlaying(song)
            ? 'bg-brand-red/20 text-brand-red dark:bg-brand-green/20 dark:text-brand-green'
            : 'bg-brand-red hover:bg-red-400 dark:bg-brand-green dark:hover:bg-green-400 text-white'">
          <i :class="isPlaying(song) ? 'ri-pause-fill' : 'ri-play-fill'" class="text-sm" />
          {{ isPlaying(song) ? 'Pause' : 'Play' }}
        </button>

        <span class="ml-auto text-[10px] dark:text-gray-500 text-gray-400 flex items-center gap-1">
          <i class="ri-headphone-line text-[9px]" />
          {{ song.durasi && song.durasi !== '00:00' ? song.durasi : 'Audio' }}
        </span>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="flex flex-col items-center py-12 text-center">
    <div class="w-16 h-16 rounded-2xl dark:bg-gray-800 bg-gray-100 flex items-center justify-center mb-3">
      <i class="ri-music-off-line text-3xl dark:text-gray-600 text-gray-400" />
    </div>
    <p class="text-sm font-bold dark:text-gray-400 text-gray-500">Belum ada lagu edukasi tersedia</p>
    <p class="text-xs dark:text-gray-500 text-gray-400 mt-1">Silakan cek kembali nanti</p>
  </div>
</template>