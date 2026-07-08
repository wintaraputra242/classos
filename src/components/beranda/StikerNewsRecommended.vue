<!-- components/beranda/StikerNewsPilihan.vue -->
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { usePlayerStore } from '@/stores/player'
import { gradientFor } from '@/composables/useContent'

const props = defineProps<{
  apiRandomItems: any[]
  localRandomNews: any[]
  loading?: boolean
  channelItems: Record<number, string>
}>()

const emit = defineEmits<{
  'play': [item: any]
  'detail': [item: any]
}>()

const themeStore = useThemeStore()
const playerStore = usePlayerStore()

const localGradients: any = [
  { from: '#1e3a5f', to: '#1a73e8' },
  { from: '#1a3a2a', to: '#1DB954' },
  { from: '#5f3a0d', to: '#f59e0b' },
  { from: '#5f1a1a', to: '#ef4444' },
  { from: '#3a1a5f', to: '#8b5cf6' },
]

function localGradient(id: string) {
  const idx = id.charCodeAt(id.length - 1) % localGradients.length
  return localGradients[idx]
}

function formatWaktu(waktu: string): string {
  if (!waktu) return '—'
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const [tanggal] = waktu.split(' ')
  const [dd, mm]: any = tanggal?.split('-')
  return `${parseInt(dd)} ${bulan[parseInt(mm) - 1]}`
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-orange-400">🔥</span>
        <h2 class="text-sm font-extrabold uppercase tracking-wider dark:text-gray-200 text-gray-800">
          StikerNews Pilihan
        </h2>
      </div>
      <RouterLink to="/stikernews" class="text-xs dark:text-brand-green text-brand-red font-bold hover:underline">
        Lihat semua →
      </RouterLink>
    </div>

    <!-- API items -->
    <div v-if="apiRandomItems.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div v-for="item in apiRandomItems" :key="item.id_lonceng"
        class="card-hover dark:bg-[#1e1e1e] bg-white rounded-xl overflow-hidden border dark:border-gray-800 border-gray-100 cursor-pointer group flex flex-col"
        @click="emit('play', item)">

        <!-- Thumbnail -->
        <div class="aspect-video relative overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0">
          <img v-if="item.gambar_url" :src="item.gambar_url" :alt="item.judul"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy" decoding="async" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />

          <div class="absolute inset-0"
            :style="{ background: `linear-gradient(135deg, ${gradientFor(item.id_lonceng).from}, ${gradientFor(item.id_lonceng).to})` }"
            :class="item.gambar_url ? '-z-10' : 'z-0'" />

          <!-- Badge audio/teks -->
          <div class="absolute top-1.5 left-1.5 flex gap-1 z-10">
            <span v-if="item.audio_url"
              class="text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-0.5">
              <i class="ri-headphone-line text-[8px]" /> Audio
            </span>
            <span v-else
              class="text-[9px] font-bold bg-gray-500/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-0.5">
              <i class="ri-article-line text-[8px]" /> Teks
            </span>
          </div>

          <!-- Badge channel -->
          <div class="absolute top-0 right-1.5 z-10">
            <span class="text-[9px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              {{ channelItems[item.channel] }}
            </span>
          </div>

          <!-- Durasi -->
          <div v-if="item.audio_url" class="absolute bottom-0 left-1.5 z-10">
            <span class="text-[9px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              {{ item.durasi }}
            </span>
          </div>

          <!-- Playing indicator -->
          <div v-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
            class="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
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
            class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors duration-200 z-10">
            <div
              class="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 shadow-md">
              <i class="ri-play-fill text-gray-900" style="margin-left:2px" />
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="p-2.5 flex flex-col flex-1">
          <p class="text-xs font-bold dark:text-white text-gray-900 leading-snug line-clamp-2 mb-1">
            {{ item.judul }}
          </p>
          <p class="text-[10px] dark:text-gray-500 text-gray-400 leading-relaxed line-clamp-2 flex-1">
            {{ item.isi }}
          </p>
          <div class="flex items-center justify-between mt-2 pt-1.5 border-t dark:border-gray-800 border-gray-100">
            <span class="text-[10px] dark:text-gray-600 text-gray-400 flex items-center gap-1">
              <i class="ri-time-line text-[9px]" />
              {{ formatWaktu(item.waktu) }}
            </span>

            <div class="flex items-center gap-2">
              <span v-if="!item.audio_url" class="text-[9px] dark:text-gray-600 text-gray-400 italic">
                Tanpa audio
              </span>
              <div v-else-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
                class="flex items-center gap-1">
                <span class="text-[8px] text-gray-500">{{ formatTime(playerStore.currentTime) }}</span>
                <i class="ri-pause-line text-[10px]"
                  :class="themeStore.mode === 'dark' ? 'text-brand-green' : 'text-red-500'" />
              </div>
              <i v-else class="ri-volume-up-line text-[10px]"
                :class="themeStore.mode === 'dark' ? 'text-brand-green' : 'text-red-500'" />

              <button
                class="flex items-center justify-center w-5 h-5 rounded-full dark:bg-gray-700 bg-gray-100 hover:dark:bg-gray-600 hover:bg-gray-200 transition-colors"
                @click.stop="emit('detail', item)">
                <i class="ri-eye-line text-[10px] dark:text-gray-300 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-else-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div v-for="i in 5" :key="i"
        class="dark:bg-[#1e1e1e] bg-white rounded-xl overflow-hidden border dark:border-gray-800 border-gray-100">
        <div class="aspect-video dark:bg-gray-800 bg-gray-200 animate-pulse" />
        <div class="p-2.5 space-y-1.5">
          <div class="h-3 dark:bg-gray-700 bg-gray-200 rounded animate-pulse" />
          <div class="h-3 w-3/4 dark:bg-gray-700 bg-gray-200 rounded animate-pulse" />
          <div class="h-2 w-1/2 dark:bg-gray-800 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
      </div>
    </div>

    <!-- Fallback lokal -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div v-for="item in localRandomNews" :key="item.id"
        class="card-hover dark:bg-[#1e1e1e] bg-white rounded-xl overflow-hidden border dark:border-gray-800 border-gray-100 cursor-pointer group">
        <div class="aspect-video flex items-center justify-center text-4xl"
          :style="{ background: `linear-gradient(135deg, ${localGradient(item.id).from}, ${localGradient(item.id).to})` }">
          {{ item.emoji }}
        </div>
        <div class="p-2.5">
          <p class="text-xs font-bold dark:text-white text-gray-900 leading-snug line-clamp-2">{{ item.title }}</p>
          <p class="text-[10px] dark:text-gray-500 text-gray-400 mt-1">{{ item.jenjang[0] }} • {{ item.duration }}</p>
        </div>
      </div>
    </div>
  </div>
</template>