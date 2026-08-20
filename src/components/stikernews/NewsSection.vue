<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'
import { useContentStore } from '@/stores/content'
import { useThemeStore } from '@/stores/theme'
import { gradientFor } from '@/composables/useContent'
import type { LoncengItem } from '@/types'

interface FilterItem {
  label: string
  channelId: number
  color?: string // ← jadikan opsional
}

defineProps<{
  displayToday: LoncengItem[]
  activeFilter: FilterItem
}>()

const emit = defineEmits<{
  play: [item: LoncengItem]
  detail: [item: LoncengItem, queue: LoncengItem[]]
}>()

const playerStore = usePlayerStore()
const contentStore = useContentStore()
const themeStore = useThemeStore()

function formatWaktu(waktu?: string): string {
  if (!waktu) return '—'
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const [tanggal] = waktu.split(' ')
  const [dd, mm] = (tanggal ?? '').split('-').map(Number)
  if (!dd || !mm) return '—'
  return `${dd} ${bulan[mm - 1]}`
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="mb-6">
    <h2
      class="text-xs font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-3 flex items-center gap-1">
      <i class="ri-calendar-check-line text-orange-400" />
      Terbaru
      <span class="ml-1 px-1.5 py-0.5 rounded-full text-[9px] text-white opacity-80"
        :class="activeFilter.color ?? 'bg-gray-500'">
        {{ activeFilter.label }}
      </span>
    </h2>

    <!-- Loading skeleton -->
    <div v-if="contentStore.loading && !displayToday.length" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i"
        class="dark:bg-[#1e1e1e] bg-white rounded-2xl overflow-hidden border dark:border-gray-800 border-gray-100 animate-pulse">
        <div class="h-32 dark:bg-gray-700 bg-gray-200" />
        <div class="p-3 space-y-2">
          <div class="h-3 dark:bg-gray-700 bg-gray-200 rounded w-3/4" />
          <div class="h-2 dark:bg-gray-700 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>

    <!-- List konten -->
    <div v-else-if="displayToday.length" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="item in displayToday" :key="item.id_lonceng"
        class="card-hover dark:bg-[#1e1e1e] bg-white rounded-2xl overflow-hidden border dark:border-gray-800 border-gray-100 cursor-pointer group flex flex-col"
        :class="playerStore.currentTrack?.id === String(item.id_lonceng) ? 'ring-2 ring-brand-green' : ''"
        @click="emit('play', item)">

        <div class="h-32 relative overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0">
          <img v-if="item.gambar_url" :src="item.gambar_url" :alt="item.judul"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"
            decoding="async" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
          <div class="absolute inset-0" :class="item.gambar_url ? '-z-10' : 'z-0'"
            :style="{ background: `linear-gradient(135deg, ${gradientFor(item.id_lonceng).from}, ${gradientFor(item.id_lonceng).to})` }" />

          <!-- Badges -->
          <div class="absolute top-2 left-2 flex gap-1 z-10">
            <span v-if="item.audio_url"
              class="text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-0.5">
              <i class="ri-headphone-line text-[8px]" /> Audio
            </span>
            <span v-else
              class="text-[9px] font-bold bg-gray-500/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-0.5">
              <i class="ri-article-line text-[8px]" /> Teks
            </span>
          </div>

          <!-- Durasi -->
          <div v-if="item.audio_url || item.podcast_url" class="absolute bottom-1.5 left-2 z-10">
            <span class="text-[9px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              {{ item.podcast_url ? item.podcast_durasi : item.durasi }}
            </span>
          </div>

          <!-- Playing indicator -->
          <div v-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
            class="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div class="flex items-end gap-0.5 h-5">
              <span class="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                style="height:60%;animation-delay:0s" />
              <span class="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                style="height:100%;animation-delay:0.15s" />
              <span class="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                style="height:40%;animation-delay:0.3s" />
              <span class="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                style="height:80%;animation-delay:0.1s" />
            </div>
          </div>

          <!-- Hover overlay -->
          <div v-else-if="item.audio_url || item.podcast_url"
            class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors z-10">
            <div
              class="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-md">
              <i class="ri-play-fill text-gray-900" style="margin-left:2px" />
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="p-3 flex flex-col flex-1">
          <p class="text-xs font-bold dark:text-white text-gray-900 leading-snug mb-1 line-clamp-2">
            {{ item.judul }}
          </p>
          <p class="text-[10px] dark:text-gray-400 text-gray-500 leading-relaxed line-clamp-2 flex-1">
            {{ item.isi }}
          </p>
          <div class="flex items-center justify-between mt-2 pt-1.5 border-t dark:border-gray-800 border-gray-100">
            <span class="text-[10px] dark:text-gray-500 text-gray-400 flex items-center gap-1">
              <i class="ri-time-line text-[9px]" />
              {{ formatWaktu(item.waktu) }}
            </span>

            <div class="flex items-center gap-2">
              <span v-if="!item.audio_url" class="text-[9px] dark:text-gray-600 text-gray-400 italic">
                Tanpa audio
              </span>
              <div v-else-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying">
                <div class="flex items-center gap-1">
                  <span class="text-[8px] text-gray-500">{{ formatTime(playerStore.currentTime) }}</span>
                  <i class="ri-pause-line text-[10px]"
                    :class="themeStore.mode === 'dark' ? 'text-brand-green' : 'text-red-500'" />
                </div>
              </div>
              <i v-else class="ri-volume-up-line text-[10px]"
                :class="themeStore.mode === 'dark' ? 'text-brand-green' : 'text-red-500'" />

              <!-- Tombol detail -->
              <button
                class="flex items-center justify-center w-5 h-5 rounded-full dark:bg-gray-700 bg-gray-100 hover:dark:bg-gray-600 hover:bg-gray-200 transition-colors"
                @click.stop="emit('detail', item, displayToday)">
                <i class="ri-eye-line text-[10px] dark:text-gray-300 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center py-10 text-center">
      <i class="ri-newspaper-line text-4xl dark:text-gray-700 text-gray-300 mb-2" />
      <p class="text-sm font-bold dark:text-gray-500 text-gray-400">
        Belum ada konten untuk {{ activeFilter.label }}
      </p>
      <p class="text-xs dark:text-gray-600 text-gray-400 mt-0.5">Coba pilih jenjang lain di atas</p>
    </div>
  </div>
</template>