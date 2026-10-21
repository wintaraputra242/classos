<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { useContent, gradientFor, localizeChannelName } from '@/composables/useContent'
import { stikerNewsData, getTodayItems } from '@/data/mockData'
import type { Content, Jenjang, PlayerTrack } from '@/types'
import { parseContentTools } from '@/helpers'
import { useThemeStore } from '@/stores/theme'
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
const { playItem } = useContent()
const themeStore = useThemeStore()

const showTrackPopup = ref(false)
const showRequestModal = ref(false)

// ⚠️ jenjangList (4 pill SD/SMP/SMA/SMK hardcode) dihapus — sudah tidak
// berguna sejak daftar kategori asli dari backend (contentStore.channels)
// dipasang, yang mencakup channel 7-10 ini juga plus 13 kategori lainnya.
// activeFilter tetap dipertahankan sebagai computed (bukan ref manual lagi)
// supaya badge label kecil di NewsSection/AllSection tetap jalan, sekarang
// otomatis mengikuti channel aktif yang mana pun dari daftar lengkap itu.
const activeFilter = computed(() => {
  const ch = contentStore.channels.find(c => c.id_channel === contentStore.activeChannelId)
  return { label: ch?.nama ?? '-', channelId: contentStore.activeChannelId, color: 'bg-brand-green' }
})

// ✅ Tombol panah untuk scroll horizontal daftar kategori — otomatis disable
// di ujung kiri/kanan. canScrollLeft/Right dicek ulang tiap kali list channel
// berubah (loadChannels async) dan tiap scroll manual (drag/trackpad).
const channelScrollRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateChannelScrollState() {
  const el = channelScrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
}

function scrollChannels(direction: 'left' | 'right') {
  const el = channelScrollRef.value
  if (!el) return
  el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' })
}

watch(() => contentStore.channels.length, () => {
  nextTick(updateChannelScrollState)
})

const loaderRef = ref<HTMLElement | null>(null)
const isLoadingMore = ref(false)
const hasMore = computed(() => contentStore.hasMore)

async function loadMore() {
  if (isLoadingMore.value || !hasMore.value || contentStore.loading) return
  isLoadingMore.value = true
  try {
    await contentStore.loadMore(auth.userId)
  } finally {
    isLoadingMore.value = false
  }
}

let _observer: IntersectionObserver | null = null

function setupObserver() {
  if (_observer) { _observer.disconnect(); _observer = null }
  if (!loaderRef.value) return

  _observer = new IntersectionObserver(
    (entries: any) => {
      if (entries[0].isIntersecting) loadMore()
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

// ⚠️ Di-cast ke any[] — tipe LoncengItem di types/index.ts sudah tidak cocok
// dengan field asli API yang dipakai NewsSection/AllSection (item.judul,
// item.gambar_url, dll). Ini bug tipe pre-existing, bukan dari perubahan
// search ini — sebelumnya "tersembunyi" karena filteredBySearch() lama
// me-return any[]. Di luar scope fitur search untuk dibetulkan sekarang.
const displayToday = computed(() => contentStore.items.slice(0, 3) as any[])
const displayAll = computed(() => contentStore.items as any[])

async function switchChannel(channelId: number) {
  await contentStore.loadContent(auth.userId, channelId, true)
  await nextTick()
  setupObserver()
}

const channelItems: any = {
  7: "SD", 8: "SMP", 9: "SMA", 10: "SMK",
}

function mapToPlayerTrack(item: any): PlayerTrack {
  const { questions, quiz, slides, project } = parseContentTools(item)

  return {
    id: String(item.id_lonceng),
    id_stikernews: item.id_lonceng,
    id_channel: item.channel,
    title: item.judul,
    channel_name: channelItems[item.channel],
    subtitle: (item.isi as string)?.slice(0, 60) + '...' || '',
    emoji: '🎧',
    duration: item.durasi,
    duration_podcast: item.podcast_durasi,
    audio_url: item.audio_url,
    podcast_url: item.podcast_url,
    image_url: item.gambar_url,
    isi: item.isi,
    currentTime: 0,
    isPlaying: false,
    isFavorite: false,
    link: item.podcast_url || item.audio_url,
    questions,
    quiz,
    slides,
    project,
  }
}

// ✅ Play dari section terbaru — sama persis dengan beranda
function playNew(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return

  const track = mapToPlayerTrack(item)
  const queueTracks = displayToday.value
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'StikerNews Terbaru'
  playerStore.playWithQueue(track, queueTracks)
}

// ✅ Play dari section semua konten
function playAll(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return

  const track = mapToPlayerTrack(item)
  const queueTracks = displayAll.value
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'StikerNews Semua'
  playerStore.playWithQueue(track, queueTracks)
}

// ✅ Handle klik detail — sama persis dengan beranda
function handleClickDetail(item: any, sourceItems: any[]) {
  showTrackPopup.value = true

  const track = mapToPlayerTrack(item)
  const queueTracks = sourceItems
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
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

// ✅ Search sekarang dikirim ke backend (param "filter" di v1/getStikernews),
// bukan filter client-side lagi — supaya hasil cari mencakup seluruh konten,
// bukan cuma yang kebetulan sudah ke-load lewat infinite scroll. Debounce
// 400ms supaya tidak nembak request tiap ketikan huruf.
let _searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (query) => {
  if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer)
  _searchDebounceTimer = setTimeout(async () => {
    await contentStore.searchContent(auth.userId, query)
    await nextTick()
    setupObserver()
  }, 400)
})

onMounted(async () => {
  appStore.registerSearchInput(searchInputRef.value)
  if (route.query.focus === '1') {
    searchInputRef.value?.focus()
  }

  await nextTick()
  setupObserver()
  updateChannelScrollState()
})

onUnmounted(() => {
  appStore.registerSearchInput(null)
  if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer)
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
    </div>

    <div v-if="contentStore.channels.length" class="relative mb-5">
      <!-- Gradient fade kiri — kasih isyarat visual masih ada konten di kiri -->
      <div class="pointer-events-none absolute left-0 top-0 bottom-1 w-12 z-[5] bg-gradient-to-r dark:from-[#121212] from-[#f8f9fb] to-transparent transition-opacity duration-200"
        :class="canScrollLeft ? 'opacity-100' : 'opacity-0'" />
      <!-- Gradient fade kanan -->
      <div class="pointer-events-none absolute right-0 top-0 bottom-1 w-12 z-[5] bg-gradient-to-l dark:from-[#121212] from-[#f8f9fb] to-transparent transition-opacity duration-200"
        :class="canScrollRight ? 'opacity-100' : 'opacity-0'" />

      <div ref="channelScrollRef" class="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
        @scroll="updateChannelScrollState">
        <button v-for="ch in contentStore.channels" :key="ch.id_channel" @click="switchChannel(ch.id_channel)"
          class="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200"
          :class="contentStore.activeChannelId === ch.id_channel
            ? 'bg-brand-green border-brand-green text-white shadow-lg shadow-brand-green/30 scale-[1.03]'
            : 'dark:bg-zinc-900 bg-white dark:border-zinc-700 border-gray-200 dark:text-gray-300 text-gray-600 hover:border-brand-green/50 hover:dark:bg-zinc-800 hover:bg-gray-50'">
          {{ localizeChannelName(ch.nama) }}
        </button>
      </div>

      <!-- Panah kiri — bulat melayang dengan shadow, memudar saat sudah mentok -->
      <button @click="scrollChannels('left')"
        class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md dark:bg-zinc-800 bg-white dark:text-gray-200 text-gray-600 hover:scale-110 active:scale-95 transition-all duration-200"
        :class="canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'" title="Scroll ke kiri">
        <i class="ri-arrow-left-s-line text-lg" />
      </button>

      <!-- Panah kanan -->
      <button @click="scrollChannels('right')"
        class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md dark:bg-zinc-800 bg-white dark:text-gray-200 text-gray-600 hover:scale-110 active:scale-95 transition-all duration-200"
        :class="canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'" title="Scroll ke kanan">
        <i class="ri-arrow-right-s-line text-lg" />
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