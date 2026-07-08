<!-- components/beranda/FavoritPlaylistCard.vue -->
<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'
import { useContentStore } from '@/stores/content'
import { gradientFor } from '@/composables/useContent'
import { ref } from 'vue';

const props = defineProps<{
  linkedUser: { name: string; token: string; userId: string; photo: string } | null
  photoError: boolean
  showScanner: boolean
  scanMode: 'camera' | 'manual'
  scanTabs: { label: string; value: 'camera' | 'manual'; icon: string }[]
  manualCode: string
  verifying: boolean
  verifyError: string
  cameraError: string
  activeMenuTab: 'favorit' | 'playlist'
  selectedPlaylist: any
  selectedSessionPlaylist: any
  sessionStarted: boolean
  stepStatus: Record<string, string>
  isSpeaking: boolean
  isPaused: boolean
  speakingStep: string | null
  listeningStatus: boolean
  listeningElapsed: number
  channelItems: Record<number, string>
  showSessionReportPopup: boolean
}>()

const emit = defineEmits<{
  'disconnect': []
  'open-scanner': []
  'close-scanner': []
  'confirm-ganti': []
  'set-scan-mode': [mode: 'camera' | 'manual']
  'set-manual-code': [code: string]
  'submit-manual': []
  'set-active-tab': [tab: 'favorit' | 'playlist']
  'refresh-tab': []
  'play-favorite': [item: any]
  'detail-favorite': [item: any]
  'go-to-full-list': []
  'open-playlist-detail': [playlist: any]
  'back-playlist': []
  'play-playlist': [item: any]
  'detail-playlist': [item: any]
  'open-step': [key: string]
  'start-session': []
  'cancel-session': []
  'reset-session': []
  'clear-session-playlist': []
  'set-photo-error': [value: boolean]
  'confirm-disconnect': []
}>()

const playerStore = usePlayerStore()
const contentStore = useContentStore()

function formatListeningTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function stepClass(key: string) {
  const s = props.stepStatus[key]
  if (s === 'done') return 'dark:bg-zinc-800 bg-gray-50 dark:text-gray-300 text-gray-600 cursor-pointer hover:dark:bg-zinc-700 hover:bg-gray-100 border dark:border-zinc-700 border-gray-200 transition-colors'
  if (s === 'active') return 'bg-brand-red dark:bg-brand-green text-white hover:opacity-90 cursor-pointer'
  return 'dark:bg-zinc-800/50 bg-gray-50 dark:text-gray-600 text-gray-300 cursor-not-allowed opacity-60'
}

function stepNumClass(key: string) {
  const s = props.stepStatus[key]
  if (s === 'done') return 'bg-brand-red/15 dark:bg-brand-green/20 text-brand-red dark:text-brand-green'
  if (s === 'active') return 'bg-white/20 text-white'
  return 'dark:bg-zinc-700 bg-gray-200 dark:text-gray-500 text-gray-400'
}

const showCancelConfirm = ref(false)

function confirmCancel() {
  showCancelConfirm.value = false
  emit('cancel-session')
}

const showConfirmDisconnect = ref(false)

// Override emit 'confirm-disconnect' agar buka popup internal
// Ubah button di atas menjadi langsung set showConfirmDisconnect = true
// (tidak perlu emit ke parent untuk buka popup)

function onConfirmDisconnect() {
  showConfirmDisconnect.value = false
  emit('disconnect') // baru emit disconnect ke parent setelah konfirmasi
}
</script>

<template>
  <div class="dark:bg-[#1e1e1e] bg-white rounded-2xl border dark:border-gray-800 border-gray-100 p-4 mb-4">

    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <i class="ri-heart-fill text-red-400 text-base" />
        <h2 class="text-sm font-extrabold dark:text-gray-200 text-gray-800">Favorit & Playlist Saya</h2>
        <span v-if="linkedUser"
          class="text-[10px] px-2 py-0.5 rounded-full bg-brand-red/15 dark:bg-brand-green/15 text-brand-red dark:text-brand-green font-bold">
          {{ linkedUser.name }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="linkedUser" @click="showConfirmDisconnect = true"
          class="text-[10px] dark:text-gray-500 text-gray-400 hover:text-red-400 transition-colors">
          Putuskan
        </button>
        <button @click="linkedUser ? emit('confirm-ganti') : emit('open-scanner')"
          class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
          :class="linkedUser
            ? 'dark:border-gray-700 border-gray-200 dark:text-gray-400 text-gray-500 hover:border-brand-green hover:text-brand-green'
            : 'bg-brand-red dark:bg-brand-green text-white border-brand-red hover:bg-red-400 dark:border-brand-green dark:hover:bg-green-400'">
          <i class="ri-qr-scan-2-line text-sm" />
          {{ linkedUser ? 'Ganti Akun' : 'Scan QR' }}
        </button>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div v-if="linkedUser" class="flex gap-4 items-center mb-4">
      <div class="flex items-center gap-1 p-1 rounded-xl dark:bg-zinc-800 bg-gray-100 w-fit">
        <button @click="emit('set-active-tab', 'favorit')"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all" :class="activeMenuTab === 'favorit'
            ? 'dark:bg-zinc-700 bg-white shadow text-brand-red'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'">
          <i class="text-sm" :class="activeMenuTab === 'favorit' ? 'ri-heart-fill' : 'ri-heart-line'" />
          Favorit
        </button>
        <button @click="emit('set-active-tab', 'playlist')"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all" :class="activeMenuTab === 'playlist'
            ? 'dark:bg-zinc-700 bg-white shadow text-brand-red dark:text-brand-green'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'">
          <i class="ri-play-list-line text-sm" />
          Playlist
        </button>
      </div>
      <button @click="emit('refresh-tab')" class="text-xs text-gray-400">
        <i class="ri-refresh-line"
          :class="{ 'animate-spin': contentStore.loadingFavorite || contentStore.loadingPlaylist }" />
      </button>
    </div>

    <!-- STATE: Belum scan -->
    <div v-if="!linkedUser && !showScanner" class="flex flex-col items-center py-8 text-center">
      <div class="w-16 h-16 rounded-2xl dark:bg-gray-800 bg-gray-100 flex items-center justify-center mb-3">
        <i class="ri-qr-code-line text-3xl dark:text-gray-500 text-gray-400" />
      </div>
      <p class="text-sm font-bold dark:text-gray-200 text-gray-700 mb-1">Hubungkan Akun StikerNews</p>
      <p class="text-xs dark:text-gray-500 text-gray-400 leading-relaxed max-w-xs mb-4">
        Scan QR dari aplikasi StikerNews untuk menampilkan daftar konten favorit kamu di sini.
      </p>
      <button @click="emit('open-scanner')"
        class="flex items-center gap-2 bg-brand-red dark:bg-brand-green text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-red-400 dark:hover:bg-green-400 transition-colors">
        <i class="ri-qr-scan-2-line" />
        Scan QR Sekarang
      </button>
    </div>

    <!-- STATE: Scanner terbuka -->
    <div v-if="showScanner" class="space-y-4">
      <div class="flex gap-1 p-1 dark:bg-gray-800 bg-gray-100 rounded-xl">
        <button v-for="tab in scanTabs" :key="tab.value" @click="emit('set-scan-mode', tab.value)"
          class="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition-colors"
          :class="scanMode === tab.value
            ? 'bg-white dark:bg-gray-700 dark:text-white text-gray-900 shadow-sm'
            : 'dark:text-gray-500 text-gray-400'">
          <i :class="tab.icon" class="text-sm" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Kamera -->
      <div v-if="scanMode === 'camera'" class="space-y-3">
        <div
          class="relative rounded-xl overflow-hidden bg-black aspect-video max-h-52 flex items-center justify-center m-auto">
          <slot name="camera-video" />
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-0 left-0 right-0 bg-black/60" style="bottom: calc(50% + 80px)" />
            <div class="absolute bottom-0 left-0 right-0 bg-black/60" style="top: calc(50% + 80px)" />
            <div class="absolute left-0 bg-black/60"
              style="top: calc(50% - 80px); bottom: calc(50% - 80px); right: calc(50% + 80px)" />
            <div class="absolute right-0 bg-black/60"
              style="top: calc(50% - 80px); bottom: calc(50% - 80px); left: calc(50% + 80px)" />
            <div class="absolute" style="top: calc(50% - 80px); left: calc(50% - 80px); width: 160px; height: 160px">
              <div class="absolute left-2 right-2 h-0.5 bg-brand-red/80 scan-line" />
            </div>
          </div>
          <div v-if="cameraError"
            class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-center px-4">
            <i class="ri-camera-off-line text-3xl text-gray-400 mb-2" />
            <p class="text-xs text-gray-400 mb-2">{{ cameraError }}</p>
            <button @click="emit('set-scan-mode', 'manual')" class="text-xs text-brand-green font-bold underline">
              Gunakan Kode Manual
            </button>
          </div>
        </div>
        <p class="text-[10px] text-center dark:text-gray-500 text-gray-400">
          Arahkan kamera ke QR Code yang ada di aplikasi StikerNews
        </p>
      </div>

      <!-- Manual -->
      <div v-if="scanMode === 'manual'" class="space-y-3">
        <div class="dark:bg-gray-800/50 bg-gray-50 rounded-xl p-4 border dark:border-gray-700 border-gray-200">
          <p class="text-xs dark:text-gray-400 text-gray-500 mb-3 leading-relaxed">
            Buka aplikasi SpeedID → Pilih "MyID" → Lihat
            <strong class="dark:text-gray-200 text-gray-700">Kode ID</strong> → Masukkan kesini.
          </p>
          <div class="flex gap-2">
            <input :value="manualCode" type="text" placeholder="Contoh: ABCDEFGH12345678"
              class="flex-1 text-sm font-mono tracking-widest uppercase px-3 py-2.5 rounded-xl dark:bg-gray-700 bg-white border dark:border-gray-600 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
              @input="emit('set-manual-code', ($event.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9]/g, ''))"
              @keydown.enter="emit('submit-manual')" />
            <button @click="emit('submit-manual')" :disabled="(manualCode?.length ?? 0) < 6 || verifying"
              class="px-4 py-2.5 bg-brand-red dark:bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-red-400 dark:hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
              <i v-if="verifying" class="ri-loader-4-line animate-spin" />
              <i v-else class="ri-check-line" />
              {{ verifying ? 'Memverifikasi...' : 'Verifikasi' }}
            </button>
          </div>
        </div>
        <p v-if="verifyError" class="text-xs text-red-400 text-center">
          <i class="ri-error-warning-line" /> {{ verifyError }}
        </p>
      </div>

      <button @click="emit('close-scanner')"
        class="px-4 py-2.5 bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 transition-colors flex items-center gap-1.5 m-auto rounded-full">
        Batal
      </button>
    </div>

    <!-- STATE: Sudah linked -->
    <div v-if="linkedUser && !showScanner" class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- List favorit / playlist -->
      <div class="lg:col-span-2">
        <div class="flex items-center justify-between mb-2 px-1">
          <div
            class="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 text-[10px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 flex-1">
            <span>#</span><span>Judul</span>
            <span
              v-if="activeMenuTab === 'favorit' || (activeMenuTab === 'playlist' && selectedPlaylist)">Channel</span>
            <span v-if="activeMenuTab === 'favorit' || (activeMenuTab === 'playlist' && selectedPlaylist)">Durasi</span>
          </div>
        </div>

        <div v-if="contentStore.loadingFavorite || contentStore.loadingPlaylist" class="space-y-2">
          <div v-for="i in 5" :key="i" class="h-9 rounded-lg dark:bg-gray-800 bg-gray-100 animate-pulse" />
        </div>

        <template v-else-if="contentStore.favoriteItems.length || contentStore.playlistItems.length">

          <!-- TAB: FAVORIT -->
          <template v-if="activeMenuTab === 'favorit'">
            <div v-for="(item, idx) in contentStore.favoriteItems.slice(0, 5)" :key="item.id_lonceng"
              class="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center px-1 py-2.5 rounded-lg transition-colors cursor-pointer"
              :class="playerStore.currentTrack?.id === String(item.id_lonceng)
                ? 'bg-brand-red/10 dark:bg-brand-green/10'
                : 'hover:dark:bg-gray-800 hover:bg-gray-50'"
              @click="(!item.audio_url || item.durasi === '00:00') ? emit('detail-favorite', item) : emit('play-favorite', item)">

              <span class="w-4 text-xs text-center"
                :class="playerStore.currentTrack?.id === String(item.id_lonceng) ? 'text-brand-red dark:text-brand-green' : 'dark:text-gray-500 text-gray-400'">
                <span v-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
                  class="flex items-end justify-center gap-[2px] h-4 w-4">
                  <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq1" />
                  <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq2" />
                  <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq3" />
                </span>
                <template v-else>{{ idx + 1 }}</template>
              </span>

              <div class="flex items-center gap-2.5 min-w-0">
                <img v-if="item.gambar_url" :src="item.gambar_url" :alt="item.judul"
                  class="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" decoding="async" />
                <div v-else class="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                  :style="{ background: `linear-gradient(135deg, ${gradientFor(item.id_lonceng).from}, ${gradientFor(item.id_lonceng).to})` }">
                  🎧
                </div>
                <span class="text-xs font-semibold truncate" :class="playerStore.currentTrack?.id === String(item.id_lonceng)
                  ? 'text-brand-red dark:text-brand-green font-bold'
                  : 'dark:text-gray-200 text-gray-700'">
                  {{ item.judul }}
                </span>
              </div>

              <span class="text-xs dark:text-gray-500 text-gray-400 mr-4">{{ channelItems[item.channel] }}</span>
              <span class="text-xs" :class="!item.audio_url || item.durasi === '00:00'
                ? 'dark:text-gray-600 text-gray-400 italic'
                : 'dark:text-gray-500 text-gray-400'">
                {{ !item.audio_url || item.durasi === '00:00' ? 'Teks' : (item.durasi || '—') }}
              </span>
            </div>

            <button @click="emit('go-to-full-list')"
              class="w-full mt-2 py-2 rounded-lg text-xs font-bold dark:text-gray-400 text-gray-500 hover:dark:bg-gray-800 hover:bg-gray-50 transition-colors">
              Lihat lainnya
            </button>
          </template>

          <!-- TAB: PLAYLIST -->
          <template v-else-if="activeMenuTab === 'playlist'">

            <!-- Detail playlist -->
            <template v-if="selectedPlaylist">
              <div class="flex items-center gap-2 mb-3">
                <button v-if="!sessionStarted" @click="emit('back-playlist')"
                  class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-gray-800 bg-gray-100 hover:dark:bg-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0">
                  <i class="ri-arrow-left-s-line text-sm dark:text-gray-300 text-gray-600" />
                </button>
                <div class="min-w-0">
                  <p class="text-xs font-bold dark:text-gray-200 text-gray-800 truncate">{{ selectedPlaylist.name }}</p>
                  <p class="text-[10px] dark:text-gray-500 text-gray-400">{{ selectedPlaylist.content_count }} konten
                  </p>
                </div>
              </div>

              <div v-if="contentStore.loadingDetailPlaylist" class="space-y-2">
                <div v-for="i in 4" :key="i" class="h-9 rounded-lg dark:bg-gray-800 bg-gray-100 animate-pulse" />
              </div>

              <template v-else>
                <div class="max-h-72 overflow-y-auto scrollbar-hide">
                  <div v-for="(item, idx) in contentStore.detailPlaylistItems" :key="item.id_lonceng"
                    class="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center px-1 py-2.5 rounded-lg transition-colors cursor-pointer"
                    :class="playerStore.currentTrack?.id === String(item.id_lonceng)
                      ? 'bg-brand-red/10 dark:bg-brand-green/10'
                      : 'hover:dark:bg-gray-800 hover:bg-gray-50'"
                    @click="(!item.audio_url || item.durasi === '00:00') ? emit('detail-playlist', item) : emit('play-playlist', item)">

                    <span class="w-4 text-xs text-center"
                      :class="playerStore.currentTrack?.id === String(item.id_lonceng) ? 'text-brand-red dark:text-brand-green' : 'dark:text-gray-500 text-gray-400'">
                      <span v-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
                        class="flex items-end justify-center gap-[2px] h-4 w-4">
                        <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq1" />
                        <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq2" />
                        <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq3" />
                      </span>
                      <template v-else>{{ idx + 1 }}</template>
                    </span>

                    <div class="flex items-center gap-2.5 min-w-0">
                      <img v-if="item.gambar_url" :src="item.gambar_url" :alt="item.judul"
                        class="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" decoding="async" />
                      <div v-else class="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                        :style="{ background: `linear-gradient(135deg, ${gradientFor(item.id_lonceng).from}, ${gradientFor(item.id_lonceng).to})` }">
                        🎧
                      </div>
                      <span class="text-xs font-semibold truncate" :class="playerStore.currentTrack?.id === String(item.id_lonceng)
                        ? 'text-brand-red dark:text-brand-green font-bold'
                        : 'dark:text-gray-200 text-gray-700'">
                        {{ item.judul }}
                      </span>
                    </div>

                    <span class="text-xs dark:text-gray-500 text-gray-400 mr-4">{{ channelItems[item.channel] }}</span>
                    <span class="text-xs" :class="!item.audio_url || item.durasi === '00:00'
                      ? 'dark:text-gray-600 text-gray-400 italic'
                      : 'dark:text-gray-500 text-gray-400'">
                      {{ !item.audio_url || item.durasi === '00:00' ? 'Teks' : (item.durasi || '—') }}
                    </span>
                  </div>
                </div>

                <div v-if="!contentStore.detailPlaylistItems.length"
                  class="flex flex-col items-center py-6 text-center">
                  <i class="ri-play-list-line text-3xl dark:text-gray-700 text-gray-300 mb-2" />
                  <p class="text-xs dark:text-gray-500 text-gray-400">Playlist ini masih kosong</p>
                </div>
              </template>
            </template>

            <!-- List semua playlist -->
            <template v-else>
              <div class="max-h-72 overflow-y-auto scrollbar-hide">
                <div v-for="playlist in contentStore.playlistItems" :key="playlist.id"
                  class="flex items-center gap-3 px-1 py-2.5 rounded-lg cursor-pointer transition-colors hover:dark:bg-gray-800 hover:bg-gray-50"
                  @click="emit('open-playlist-detail', playlist)">
                  <div class="relative flex-shrink-0">
                    <img v-if="playlist.thumbnail_url" :src="playlist.thumbnail_url" :alt="playlist.name"
                      class="w-10 h-10 rounded-lg object-cover" loading="lazy" decoding="async" />
                    <div v-else
                      class="w-10 h-10 rounded-lg dark:bg-gray-700 bg-gray-200 flex items-center justify-center text-base">
                      🎵
                    </div>
                    <span
                      class="absolute -bottom-1 -right-1 text-[9px] font-black bg-brand-red dark:bg-brand-green text-white px-1.5 py-0.5 rounded-full leading-none">
                      {{ playlist.content_count }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold dark:text-gray-200 text-gray-800 truncate">{{ playlist.name }}</p>
                    <p class="text-[10px] dark:text-gray-500 text-gray-400 truncate">{{ playlist.thumbnail_title }}</p>
                  </div>
                  <i class="ri-arrow-right-s-line text-sm dark:text-gray-600 text-gray-300 flex-shrink-0" />
                </div>

                <div v-if="!contentStore.playlistItems.length" class="flex flex-col items-center py-6 text-center">
                  <i class="ri-play-list-line text-3xl dark:text-gray-700 text-gray-300 mb-2" />
                  <p class="text-xs dark:text-gray-500 text-gray-400">Belum ada playlist</p>
                </div>
              </div>
            </template>
          </template>
        </template>

        <div v-else class="flex flex-col items-center py-6 text-center">
          <i v-if="activeMenuTab === 'favorit'" class="ri-heart-line text-3xl dark:text-gray-700 text-gray-300 mb-2" />
          <i v-else class="ri-play-list-line text-3xl dark:text-gray-700 text-gray-300 mb-2" />
          <p class="text-xs dark:text-gray-500 text-gray-400">
            Belum ada konten {{ activeMenuTab === 'favorit' ? 'favorit' : 'playlist' }}
          </p>
        </div>
      </div>

      <!-- Panel kanan -->
      <div class="dark:bg-[#2a2a2a] bg-gray-50 rounded-xl p-4 flex flex-col gap-2">

        <!-- Header guru -->
        <div class="flex items-center gap-2 mb-1">
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-sm font-black text-white flex-shrink-0 overflow-hidden">
            <img v-if="linkedUser.photo && !photoError" :src="linkedUser.photo" alt="teacher photo"
              class="w-full h-full object-cover" @error="emit('set-photo-error', true)"
              @load="(e) => { if ((e.target as HTMLImageElement).naturalWidth === 0) emit('set-photo-error', true) }" />
            <span v-if="!linkedUser.photo || photoError">
              {{ linkedUser.name?.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="min-w-0">
            <p class="font-bold dark:text-white text-gray-800 text-sm truncate">{{ linkedUser.name }}</p>
          </div>
        </div>

        <!-- Belum mulai sesi -->
        <div v-if="!sessionStarted" class="flex flex-col gap-3">
          <div v-if="!selectedSessionPlaylist" class="text-center py-2">
            <i class="ri-play-list-line text-2xl dark:text-gray-600 text-gray-300 mb-1.5" />
            <p class="text-xs dark:text-gray-400 text-gray-500">
              Pilih playlist di tab Playlist untuk memulai sesi
            </p>
          </div>

          <div v-else class="flex items-center gap-2.5 dark:bg-zinc-800 bg-gray-100 rounded-xl p-2.5">
            <img v-if="selectedSessionPlaylist.thumbnail_url" :src="selectedSessionPlaylist.thumbnail_url"
              class="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
            <div v-else
              class="w-9 h-9 rounded-lg dark:bg-zinc-700 bg-gray-200 flex items-center justify-center text-sm flex-shrink-0">
              🎵
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold dark:text-gray-200 text-gray-800 truncate">{{ selectedSessionPlaylist.name }}
              </p>
              <p class="text-[10px] dark:text-gray-500 text-gray-400">{{ selectedSessionPlaylist.content_count }} konten
              </p>
            </div>
            <button @click="emit('clear-session-playlist')"
              class="w-6 h-6 rounded-full dark:bg-zinc-700 bg-gray-200 flex items-center justify-center flex-shrink-0">
              <i class="ri-close-line text-xs" />
            </button>
          </div>

          <button @click="emit('start-session')" :disabled="!selectedSessionPlaylist"
            class="relative w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-red dark:bg-brand-green text-white hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
            :class="selectedSessionPlaylist ? 'animate-pulse-cta' : ''">
            <span v-if="selectedSessionPlaylist" class="absolute inset-0 rounded-xl bg-white/20 animate-shine" />
            <i class="ri-play-circle-line text-sm relative z-10" />
            <span class="relative z-10">Mulai Sesi Mengajar</span>
          </button>
        </div>

        <!-- Sesi berjalan -->
        <div v-else class="flex flex-col gap-2">
          <div class="flex items-center justify-between mb-1">
            <p class="text-[10px] dark:text-gray-500 text-gray-400">Sesi sedang berlangsung</p>
            <button v-if="!showSessionReportPopup && stepStatus.endclass !== 'done'" @click="showCancelConfirm = true"
              class="text-[10px] dark:text-gray-500 text-gray-400 dark:hover:text-red-400 hover:text-red-400 transition-colors">
              Batalkan
            </button>
          </div>

          <!-- Step 1: Briefing -->
          <div class="relative" style="isolation: isolate;">
            <template v-if="isSpeaking && !isPaused && speakingStep === 'briefing'">
              <span class="absolute inset-0 rounded-xl pointer-events-none animate-pulse-shadow" />
              <span
                class="absolute inset-0 rounded-xl pointer-events-none animate-pulse-shadow [animation-delay:0.6s]" />
              <span
                class="absolute inset-0 rounded-xl pointer-events-none animate-pulse-shadow [animation-delay:1.2s]" />
            </template>
            <button @click="emit('open-step', 'briefing')" :disabled="stepStatus.briefing === 'locked'"
              class="relative z-10 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors duration-300"
              :class="stepClass('briefing')">
              <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px]"
                :class="stepNumClass('briefing')">
                <i v-if="stepStatus.briefing === 'done'" class="ri-check-line" />
                <template v-else>1</template>
              </div>
              <span class="flex-1 text-left">Briefing</span>
              <div v-if="isSpeaking && !isPaused && speakingStep === 'briefing'"
                class="flex items-end gap-[2.5px] h-3.5 mr-1">
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:55%;animation-delay:0s" />
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:100%;animation-delay:0.1s" />
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:70%;animation-delay:0.2s" />
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:90%;animation-delay:0.3s" />
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:45%;animation-delay:0.05s" />
              </div>
              <i v-if="stepStatus.briefing === 'locked'" class="ri-lock-line text-sm" />
              <i v-else-if="stepStatus.briefing === 'active'" class="ri-arrow-right-s-line text-sm" />
            </button>
          </div>

          <!-- Step 2: Listening -->
          <button @click="emit('open-step', 'listening')" :disabled="stepStatus.listening === 'locked'"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative overflow-hidden"
            :class="stepClass('listening')">
            <div v-if="listeningStatus" class="absolute inset-0 bg-white/10 animate-pulse-slow" />
            <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] relative"
              :class="stepNumClass('listening')">
              <i v-if="stepStatus.listening === 'done'" class="ri-check-line" />
              <template v-else-if="listeningStatus">
                <span class="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
                <i class="ri-mic-fill relative text-red-500" />
              </template>
              <template v-else>2</template>
            </div>
            <span class="flex-1 text-left relative">Listening</span>
            <span v-if="listeningElapsed > 0 || listeningStatus"
              class="relative flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
              :class="listeningStatus ? 'bg-red-500/20 text-red-500' : 'dark:bg-zinc-700 bg-gray-200 dark:text-gray-400 text-gray-500'">
              <span v-if="listeningStatus" class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {{ formatListeningTime(listeningElapsed) }}
            </span>
            <i v-if="stepStatus.listening === 'locked'" class="ri-lock-line text-sm relative" />
            <i v-else-if="stepStatus.listening === 'active' && !listeningStatus"
              class="ri-arrow-right-s-line text-sm relative" />
          </button>

          <!-- Step 3: Summary -->
          <div class="relative" style="isolation: isolate;">
            <template v-if="isSpeaking && !isPaused && speakingStep === 'summary'">
              <span class="absolute inset-0 rounded-xl pointer-events-none animate-pulse-shadow" />
              <span
                class="absolute inset-0 rounded-xl pointer-events-none animate-pulse-shadow [animation-delay:0.6s]" />
              <span
                class="absolute inset-0 rounded-xl pointer-events-none animate-pulse-shadow [animation-delay:1.2s]" />
            </template>
            <button @click="emit('open-step', 'summary')" :disabled="stepStatus.summary === 'locked'"
              class="relative z-10 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors duration-300"
              :class="stepClass('summary')">
              <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px]"
                :class="stepNumClass('summary')">
                <i v-if="stepStatus.summary === 'done'" class="ri-check-line" />
                <template v-else>3</template>
              </div>
              <span class="flex-1 text-left">Summary</span>
              <div v-if="isSpeaking && !isPaused && speakingStep === 'summary'"
                class="flex items-end gap-[2.5px] h-3.5 mr-1">
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:55%;animation-delay:0s" />
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:100%;animation-delay:0.1s" />
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:70%;animation-delay:0.2s" />
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:90%;animation-delay:0.3s" />
                <span class="w-[2.5px] rounded-sm bg-white origin-bottom animate-bar-bounce"
                  style="height:45%;animation-delay:0.05s" />
              </div>
              <i v-if="stepStatus.summary === 'locked'" class="ri-lock-line text-sm" />
              <i v-else-if="stepStatus.summary === 'active'" class="ri-arrow-right-s-line text-sm" />
            </button>
          </div>

          <!-- Step 4: End Class -->
          <button @click="emit('open-step', 'endclass')" :disabled="stepStatus.endclass === 'locked'"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
            :class="stepClass('endclass')">
            <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px]"
              :class="stepNumClass('endclass')">
              <i v-if="stepStatus.endclass === 'done'" class="ri-file-chart-2-fill" />
              <template v-else>4</template>
            </div>
            <span class="flex-1 text-left">
              {{ stepStatus.endclass === 'done' ? 'Laporan Sesi Mengajar' : 'End-Class (Foto)' }}
            </span>
            <span v-if="stepStatus.endclass === 'done'"
              class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold dark:bg-brand-green/15 bg-brand-red/10 dark:text-brand-green text-brand-red">
              <i class="ri-eye-line text-[11px]" />
              Lihat
            </span>
            <i v-if="stepStatus.endclass === 'locked'" class="ri-lock-line text-sm" />
            <i v-else-if="stepStatus.endclass === 'active'" class="ri-arrow-right-s-line text-sm" />
          </button>

          <!-- Ulangi Sesi -->
          <Transition name="fade">
            <div v-if="stepStatus.endclass === 'done'" class="mt-2 pt-3 border-t dark:border-zinc-700 border-gray-200">
              <p class="text-[10px] dark:text-gray-500 text-gray-400 text-center mb-2">Sesi telah selesai 🎉</p>
              <button @click="emit('reset-session')"
                class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 border-brand-red dark:border-brand-green text-brand-red dark:text-brand-green hover:bg-brand-red dark:hover:bg-brand-green hover:text-white dark:hover:text-white transition-colors">
                <i class="ri-restart-line" />
                Ulangi Sesi
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCancelConfirm" class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          @click.self="showCancelConfirm = false">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showCancelConfirm = false" />

          <div
            class="relative w-full max-w-sm dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl border dark:border-zinc-700 border-gray-200 overflow-hidden">

            <!-- Top accent -->
            <div class="h-1 bg-gradient-to-r from-red-500 to-pink-500" />

            <div class="p-6">
              <!-- Icon -->
              <div class="flex flex-col items-center text-center mb-5">
                <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-3">
                  <i class="ri-stop-circle-line text-3xl text-red-500" />
                </div>
                <p class="text-sm font-extrabold dark:text-white text-gray-900 mb-1">
                  Batalkan Sesi Mengajar?
                </p>
                <p class="text-xs dark:text-gray-400 text-gray-500 leading-relaxed">
                  Semua progres sesi yang sedang berjalan akan hilang dan tidak bisa dikembalikan.
                </p>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-2">
                <button @click="confirmCancel"
                  class="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2">
                  <i class="ri-stop-circle-line" />
                  Ya, Batalkan Sesi
                </button>
                <button @click="showCancelConfirm = false"
                  class="w-full py-2.5 rounded-xl dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 text-xs font-bold hover:opacity-80 transition-opacity">
                  Lanjutkan Sesi
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Konfirmasi Putuskan Akun -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmDisconnect"
          class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          @click.self="showConfirmDisconnect = false">
          <div class="w-full max-w-sm rounded-2xl dark:bg-zinc-900 bg-white shadow-2xl p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <i class="ri-logout-box-r-line text-red-500 text-lg" />
              </div>
              <div>
                <p class="font-bold dark:text-white text-gray-900 text-sm">Putuskan Akun?</p>
                <p class="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                  Akun <strong class="dark:text-gray-200 text-gray-700">{{ linkedUser?.name }}</strong> akan diputuskan
                </p>
              </div>
            </div>
            <p class="text-xs dark:text-gray-400 text-gray-500 mb-5 leading-relaxed">
              Seluruh data sesi, favorit, dan playlist yang sedang aktif akan direset. Anda perlu scan QR ulang untuk
              menghubungkan akun kembali.
            </p>
            <div class="flex gap-2">
              <button @click="showConfirmDisconnect = false"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity">
                Batal
              </button>
              <button @click="onConfirmDisconnect"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:opacity-80 transition-opacity">
                Ya, Putuskan
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>