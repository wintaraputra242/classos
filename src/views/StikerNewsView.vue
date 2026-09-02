<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { useContent } from '@/composables/useContent'
import type { LoncengItem, PlayerTrack } from '@/types'
import { useAppStore } from '@/stores/app'
// ✅ Import TrackDetailPopup sama seperti beranda
import TrackDetailPopup from '@/components/ui/TrackDetailPopup.vue'
import RequestKontenModal from '@/components/ui/RequestKontenModal.vue'
import NewsSection from '@/components/stikernews/NewsSection.vue'
import AllSection from '@/components/stikernews/AllSection.vue'

const route = useRoute()
const contentStore = useContentStore()
const playerStore = usePlayerStore()
const appStore = useAppStore()
const auth = useAuthStore()
useContent()

const showTrackPopup = ref(false)
const showRequestModal = ref(false)

interface JenjangFilter {
  label: string
  color: string
  channelId: number
}

const jenjangList: JenjangFilter[] = [
  { label: 'SD', color: 'bg-yellow-500', channelId: 7 },
  { label: 'SMP', color: 'bg-blue-500', channelId: 8 },
  { label: 'SMA', color: 'bg-purple-600', channelId: 9 },
  { label: 'SMK', color: 'bg-red-500', channelId: 10 },
]

const activeFilter = ref<JenjangFilter>(jenjangList[0]!)

const loaderRef = ref<HTMLElement | null>(null)
const isLoadingMore = ref(false)
const hasMore = computed(() => contentStore.hasMore)

async function loadMore() {
  if (isLoadingMore.value || !hasMore.value || contentStore.loading) return
  isLoadingMore.value = true
  try {
    await contentStore.loadContent(auth.userId, activeFilter.value.channelId)
  } finally {
    isLoadingMore.value = false
  }
}

let _observer: IntersectionObserver | null = null

function setupObserver() {
  if (_observer) { _observer.disconnect(); _observer = null }
  if (!loaderRef.value) return

  _observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    },
    { threshold: 0.1, rootMargin: '100px' }
  )

  _observer.observe(loaderRef.value)
}

// Watch loaderRef — setup observer begitu elemen muncul di DOM
watch(loaderRef, (el) => {
  if (el) setupObserver()
})

// Watch items — setup ulang observer setelah data pertama masuk
watch(
  () => contentStore.items.length,
  (len, prevLen) => {
    if (prevLen === 0 && len > 0) {
      nextTick(() => setupObserver())
    }
  }
)

async function switchFilter(item: JenjangFilter) {
  activeFilter.value = item
  await contentStore.loadContent(auth.userId, item.channelId, true)
  await nextTick()
  setupObserver()
}

const filteredBySearch = (items: LoncengItem[]) => {
  if (!searchQuery.value.trim()) return items
  const q = searchQuery.value.toLowerCase()
  return items.filter((item) =>
    item.judul?.toLowerCase().includes(q) ||
    item.isi?.toLowerCase().includes(q)
  )
}

const displayToday = computed(() => filteredBySearch(contentStore.items.slice(0, 3)))
const displayAll = computed(() => filteredBySearch(contentStore.items))

async function switchChannel(channelId: number) {
  await contentStore.loadContent(auth.userId, channelId, true)
  await nextTick()
  setupObserver()
}

const channelItems: Record<number, string> = {
  7: "SD", 8: "SMP", 9: "SMA", 10: "SMK",
}

function mapToPlayerTrack(item: LoncengItem): PlayerTrack {
  return {
    id: String(item.id_lonceng),
    id_stikernews: item.id_lonceng,
    id_channel: item.channel,
    title: item.judul,
    channel_name: channelItems[item.channel] ?? '',
    subtitle: (item.isi ?? '').slice(0, 60) + '...',
    emoji: '🎧',
    duration: item.durasi ?? '',
    duration_podcast: item.podcast_durasi ?? '',
    audio_url: item.audio_url ?? '',
    podcast_url: item.podcast_url ?? '',
    image_url: item.gambar_url ?? '',
    isi: item.isi ?? '',
    currentTime: 0,
    isPlaying: false,
    isFavorite: false,
    link: item.podcast_url || item.audio_url,
  }
}

// ✅ Play dari section terbaru — sama persis dengan beranda
function playNew(item: LoncengItem) {
  if (!item?.audio_url && !item?.podcast_url) return

  const track = mapToPlayerTrack(item)
  const queueTracks = displayToday.value
    ?.filter((i) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'StikerNews Terbaru'
  playerStore.playWithQueue(track, queueTracks)
}

// ✅ Play dari section semua konten
function playAll(item: LoncengItem) {
  if (!item?.audio_url && !item?.podcast_url) return

  const track = mapToPlayerTrack(item)
  const queueTracks = displayAll.value
    ?.filter((i) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'StikerNews Semua'
  playerStore.playWithQueue(track, queueTracks)
}

// ✅ Handle klik detail — sama persis dengan beranda
function handleClickDetail(item: LoncengItem, sourceItems: LoncengItem[]) {
  showTrackPopup.value = true

  const track = mapToPlayerTrack(item)
  const queueTracks = sourceItems
    ?.filter((i) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  // Kalau track yang di-preview sama dengan yang sedang diplay, tidak masuk preview mode
  if (playerStore.currentTrack?.id !== track.id) {
    playerStore.setItemPlay(track, queueTracks)
  } else {
    playerStore.clearPreview()
  }
}

const searchQuery = ref('')
const isSearchFocused = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  appStore.registerSearchInput(searchInputRef.value)
  if (route.query.focus === '1') {
    searchInputRef.value?.focus()
  }

  await nextTick()
  setupObserver()
})

onUnmounted(() => {
  appStore.registerSearchInput(null)
  if (_observer) { _observer.disconnect(); _observer = null }
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
        <h1 class="text-lg font-extrabold dark:text-white text-gray-900 flex items-center gap-2">
          🔥 StikerNews
          <span v-if="route.query.mode" class="pill bg-brand-green text-white capitalize">
            {{ route.query.mode }}
          </span>
        </h1>
        <p class="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
          {{ contentStore.items.length
            ? `${contentStore.items.length} konten tersedia`
            : 'Konten edukatif pilihan untuk pelajar Indonesia' }}
        </p>
      </div>

      <button @click="showRequestModal = true"
        class="pill flex items-center gap-1 bg-brand-green text-white hover:opacity-90 transition-opacity">
        <i class="ri-add-line" /> Request Konten
      </button>

      <div class="flex gap-1.5 flex-wrap items-center">
        <!-- ✅ Dipisah di kiri (bukan bagian grup jenjang) — Request Konten berlaku untuk semua jenjang -->
        <button v-for="j in jenjangList" :key="j.label" class="pill text-white transition-all"
          :class="[j.color, activeFilter.label === j.label ? 'opacity-100 ring-2 ring-white/40 ring-offset-1' : 'opacity-40 hover:opacity-70']"
          @click="switchFilter(j)">
          {{ j.label }}
        </button>
      </div>
    </div>

    <div v-if="contentStore.channels.length" class="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
      <button v-for="ch in contentStore.channels" :key="ch.id_channel"
        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors" :class="contentStore.activeChannelId === ch.id_channel
          ? 'bg-brand-green text-white'
          : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-300 text-gray-600'" @click="switchChannel(ch.id_channel)">
        {{ ch.nama_channel }}
      </button>
    </div>

    <div class="mb-5">
      <div class="relative flex items-center gap-2 px-4 h-11 rounded-2xl border transition-all duration-150" :class="isSearchFocused
        ? 'border-brand-green ring-2 ring-brand-green/15 dark:bg-zinc-900 bg-white'
        : 'border-gray-200 dark:border-gray-700 dark:bg-zinc-800 bg-gray-100'">
        <i class="ri-search-line text-base flex-shrink-0 transition-colors"
          :class="isSearchFocused ? 'text-brand-green' : 'dark:text-gray-500 text-gray-400'" />
        <input ref="searchInputRef" v-model="searchQuery" type="text" placeholder="Cari judul atau konten..."
          autocomplete="off"
          class="flex-1 bg-transparent text-sm dark:text-white text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 outline-none min-w-0"
          @focus="isSearchFocused = true" @blur="isSearchFocused = false" />
        <button v-if="searchQuery"
          class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center dark:hover:bg-gray-700 hover:bg-gray-200 dark:text-gray-400 text-gray-500 transition-colors"
          @click="searchQuery = ''; searchInputRef?.focus()">
          <i class="ri-close-line text-sm" />
        </button>
      </div>
    </div>

    <!-- ── Terbaru ── -->
    <NewsSection :display-today="displayToday" :active-filter="activeFilter" @play="playNew"
      @detail="handleClickDetail" />

    <!-- Semua Konten -->
    <AllSection :display-all="displayAll" :active-filter="activeFilter" @play="playAll" @detail="handleClickDetail" />

    <!-- ✅ Popup detail — sama seperti beranda -->
    <TrackDetailPopup v-model="showTrackPopup" />

    <!-- Request Konten -->
    <RequestKontenModal v-model="showRequestModal" />
  </div>
</template>