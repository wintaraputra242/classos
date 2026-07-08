<!-- components/StikerNewsAllSection.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useContentStore } from '@/stores/content'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { gradientFor } from '@/composables/useContent'
import { nextTick } from 'vue'

interface FilterItem {
  label: string
  channelId: number
  color?: string
}

interface LoncengItem {
  id_lonceng: number
  judul: string
  isi: string
  gambar_url?: string
  audio_url?: string
  podcast_url?: string
  durasi?: string
  podcast_durasi?: string
  waktu: string
  channel: number
}

const props = defineProps<{
  displayAll: LoncengItem[]
  activeFilter: FilterItem
}>()

const emit = defineEmits<{
  play: [item: LoncengItem]
  detail: [item: LoncengItem, queue: LoncengItem[]]
}>()

const playerStore = usePlayerStore()
const contentStore = useContentStore()
const themeStore = useThemeStore()
const auth = useAuthStore()

// ── Infinite Scroll ────────────────────────────────────────────────────────
const loaderRef = ref<HTMLElement | null>(null)
const isLoadingMore = ref(false)
const hasMore = computed(() => contentStore.hasMore)
let _observer: IntersectionObserver | null = null
let _loadingLock = false // lock tambahan untuk cegah double call

async function loadMore() {
  if (_loadingLock || isLoadingMore.value || !hasMore.value || contentStore.loading) return
  _loadingLock = true
  isLoadingMore.value = true
  try {
    await contentStore.loadMore(auth.userId)
  } finally {
    isLoadingMore.value = false
    // Delay sedikit sebelum unlock agar tidak langsung trigger lagi
    setTimeout(() => { _loadingLock = false }, 500)
  }
}

function setupObserver() {
  if (_observer) { _observer.disconnect(); _observer = null }
  if (!loaderRef.value) return

  _observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting) loadMore()
    },
    {
      threshold: 0,          // trigger begitu 1px masuk viewport
      rootMargin: '200px',   // pre-load 200px sebelum elemen benar-benar kelihatan
    }
  )

  _observer.observe(loaderRef.value)
}

// Re-observe setiap kali loaderRef el berubah
watch(loaderRef, (el) => {
  if (el) {
    nextTick(() => setupObserver())
  }
})

// Re-observe setelah data baru masuk — penting agar observer tidak "mati"
watch(() => props.displayAll.length, async () => {
  await nextTick()
  // Disconnect dulu, tunggu sebentar, baru observe ulang
  // Ini penting karena setelah re-render DOM posisi loaderRef bisa bergeser
  if (_observer) { _observer.disconnect(); _observer = null }
  setTimeout(() => {
    if (loaderRef.value) setupObserver()
  }, 100)
})

// Fallback: cek secara manual setiap 2 detik kalau observer tidak jalan
let _fallbackInterval: ReturnType<typeof setInterval> | null = null

function startFallbackCheck() {
  _fallbackInterval = setInterval(() => {
    if (!loaderRef.value || !hasMore.value || isLoadingMore.value) return

    const rect = loaderRef.value.getBoundingClientRect()
    const inView = rect.top <= window.innerHeight + 200

    if (inView) loadMore()
  }, 2000)
}

onMounted(() => {
  nextTick(() => setupObserver())
  startFallbackCheck()
})

onUnmounted(() => {
  if (_observer) { _observer.disconnect(); _observer = null }
  if (_fallbackInterval) { clearInterval(_fallbackInterval); _fallbackInterval = null }
})

// ── Helpers ────────────────────────────────────────────────────────────────
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
  <div v-if="displayAll.length">

    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xs font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 flex items-center gap-1">
        <i class="ri-grid-line" /> Semua Konten
        <span class="ml-1 px-1.5 py-0.5 rounded-full text-[9px] text-white opacity-80"
          :class="activeFilter.color ?? 'bg-gray-500'">
          {{ activeFilter.label }}
        </span>
      </h2>
      <span class="text-xs dark:text-gray-500 text-gray-400">{{ displayAll.length }} item</span>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div v-for="item in displayAll" :key="item.id_lonceng"
        class="card-hover dark:bg-[#1e1e1e] bg-white rounded-2xl overflow-hidden border dark:border-gray-800 border-gray-100 cursor-pointer group flex flex-col"
        :class="playerStore.currentTrack?.id === String(item.id_lonceng) ? 'ring-2 ring-brand-green' : ''"
        @click="emit('play', item)">

        <!-- Thumbnail -->
        <div class="h-32 relative overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0">
          <img v-if="item.gambar_url" :src="item.gambar_url" :alt="item.judul"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"
            decoding="async" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
          <div class="absolute inset-0" :class="item.gambar_url ? '-z-10' : 'z-0'"
            :style="{ background: `linear-gradient(135deg, ${gradientFor(item.id_lonceng).from}, ${gradientFor(item.id_lonceng).to})` }" />

          <!-- Badge audio/teks -->
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
                @click.stop="emit('detail', item, displayAll)">
                <i class="ri-eye-line text-[10px] dark:text-gray-300 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loader infinite scroll -->
    <div ref="loaderRef" class="mt-4 flex justify-center py-6">
      <div v-if="isLoadingMore || contentStore.loading"
        class="flex items-center gap-2 text-xs dark:text-gray-500 text-gray-400">
        <i class="ri-loader-4-line animate-spin" />
        Memuat lebih banyak...
      </div>
      <div v-else-if="!hasMore" class="text-xs dark:text-gray-600 text-gray-400 flex items-center gap-1">
        <i class="ri-check-line" /> Semua konten telah ditampilkan
      </div>
    </div>
  </div>

  <!-- Skeleton loading awal -->
  <div v-else-if="contentStore.loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
    <div v-for="i in 8" :key="i"
      class="dark:bg-[#1e1e1e] bg-white rounded-xl overflow-hidden border dark:border-gray-800 border-gray-100 animate-pulse">
      <div class="aspect-video dark:bg-gray-800 bg-gray-200" />
      <div class="p-2.5 space-y-1.5">
        <div class="h-3 dark:bg-gray-700 bg-gray-200 rounded" />
        <div class="h-2 w-2/3 dark:bg-gray-700 bg-gray-200 rounded" />
      </div>
    </div>
  </div>

  <!-- Loading state awal -->
  <div v-else-if="isLoadingMore" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    <div v-for="i in 8" :key="i" class="rounded-xl overflow-hidden border dark:border-gray-800 border-gray-100">
      <div class="aspect-video dark:bg-gray-800 bg-gray-100 animate-pulse" />
      <div class="p-2.5 space-y-2">
        <div class="h-3 dark:bg-gray-800 bg-gray-100 rounded animate-pulse" />
        <div class="h-2 dark:bg-gray-800 bg-gray-100 rounded animate-pulse w-2/3" />
      </div>
    </div>
  </div>

  <div v-else-if="contentStore.loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
    <div v-for="i in 8" :key="i"
      class="dark:bg-[#1e1e1e] bg-white rounded-xl overflow-hidden border dark:border-gray-800 border-gray-100 animate-pulse">
      <div class="aspect-video dark:bg-gray-700 bg-gray-200" />
      <div class="p-2.5 space-y-1.5">
        <div class="h-3 dark:bg-gray-700 bg-gray-200 rounded" />
        <div class="h-2 w-2/3 dark:bg-gray-700 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
</template>