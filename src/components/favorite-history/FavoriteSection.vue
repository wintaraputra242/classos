<!-- components/FavoriteSection.vue -->
<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'
import { useContentStore } from '@/stores/content'
import { gradientFor } from '@/composables/useContent'
import { ref } from 'vue'
import type { LoncengItem, PlaylistItem } from '@/types'

interface LinkedUser {
  name: string
  token: string
  userId: string
  photo: string
}

const props = defineProps<{
  linkedUser: LinkedUser | null
  showScanner: boolean
  activeMenuTab: 'favorit' | 'playlist'
  currentMenuItems: LoncengItem[]
  selectedPlaylist: PlaylistItem | null
  verifyError?: string
  scanMode: 'camera' | 'manual'
  manualCode: string
  verifying: boolean
  cameraError?: string
  videoRef: HTMLVideoElement | null
  photoError: boolean
}>()

const emit = defineEmits<{
  'openScanner': []
  'closeScanner': []
  'disconnect': []
  'showConfirmGanti': []
  'update:activeMenuTab': ['favorit' | 'playlist']
  'update:scanMode': ['camera' | 'manual']
  'update:manualCode': [string]
  'submitManual': []
  'refreshTab': []
  'playMenuItem': [item: LoncengItem]
  'clickDetailMenuItem': [item: LoncengItem]
  'playPlaylistItem': [item: LoncengItem]
  'clickDetailPlaylistItem': [item: LoncengItem]
  'openPlaylistDetail': [playlist: PlaylistItem]
  'backFromPlaylist': []
  'set-photo-error': [value: boolean]
}>()

const playerStore = usePlayerStore()
const contentStore = useContentStore()

const channelItems: Record<number, string> = {
  7: 'SD', 8: 'SMP', 9: 'SMA', 10: 'SMK'
}

const scanTabs = [
  { label: 'Kamera', value: 'camera' as const, icon: 'ri-camera-line' },
  { label: 'Kode Manual', value: 'manual' as const, icon: 'ri-keyboard-line' },
]

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
  <div>
    <!-- Profil linkedUser -->
    <div v-if="linkedUser"
      class="flex items-center gap-3 mb-4 dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100">
      <!-- <img v-if="linkedUser.photo" :src="linkedUser.photo" :alt="linkedUser.name"
        class="w-12 h-12 rounded-full object-cover flex-shrink-0" loading="lazy" decoding="async" />
      <div v-else
        class="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-base font-black text-white flex-shrink-0">
        {{ linkedUser.name?.charAt(0).toUpperCase() }}
      </div> -->
      <div
        class="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-sm font-black text-white flex-shrink-0 overflow-hidden">
        <img v-if="linkedUser.photo && !photoError" :src="linkedUser.photo" alt="teacher photo"
          class="w-full h-full object-cover" @error="emit('set-photo-error', true)"
          @load="(e) => { if ((e.target as HTMLImageElement).naturalWidth === 0) emit('set-photo-error', true) }" />
        <span v-if="!linkedUser.photo || photoError">
          {{ linkedUser.name?.charAt(0).toUpperCase() }}
        </span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold dark:text-white text-gray-900 text-sm truncate">{{ linkedUser.name }}</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button v-if="linkedUser" @click="showConfirmDisconnect = true"
          class="text-[10px] dark:text-gray-500 text-gray-400 hover:text-red-400 transition-colors">
          Putuskan
        </button>
        <button @click="linkedUser ? emit('showConfirmGanti') : emit('openScanner')"
          class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors dark:border-gray-700 border-gray-200 dark:text-gray-400 text-gray-500 hover:border-brand-green hover:text-brand-green">
          <i class="ri-qr-scan-2-line text-sm" />
          Ganti Akun
        </button>
      </div>
    </div>

    <!-- Tab switcher -->
    <div v-if="linkedUser" class="flex items-center gap-4 mb-4">
      <div class="flex items-center gap-1 p-1 rounded-xl dark:bg-zinc-800 bg-gray-100 w-fit">
        <button @click="emit('update:activeMenuTab', 'favorit')"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all" :class="activeMenuTab === 'favorit'
            ? 'dark:bg-zinc-700 bg-white shadow text-brand-red dark:text-brand-green'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'">
          <i class="text-sm" :class="activeMenuTab === 'favorit' ? 'ri-heart-fill' : 'ri-heart-line'" />
          Favorit
        </button>
        <button @click="emit('update:activeMenuTab', 'playlist')"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all" :class="activeMenuTab === 'playlist'
            ? 'dark:bg-zinc-700 bg-white shadow text-brand-red dark:text-brand-green'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'">
          <i class="ri-play-list-line text-sm" />
          Playlist
        </button>
      </div>
      <button @click="emit('refreshTab')" class="text-xs text-gray-400">
        <i class="ri-refresh-line"
          :class="{ 'animate-spin': contentStore.loadingFavorite || contentStore.loadingPlaylist }" />
      </button>
    </div>

    <!-- STATE: belum scan -->
    <div v-if="!linkedUser && !showScanner" class="flex flex-col items-center py-12 text-center">
      <div class="w-16 h-16 rounded-2xl dark:bg-gray-800 bg-gray-100 flex items-center justify-center mb-3">
        <i class="ri-qr-code-line text-3xl dark:text-gray-500 text-gray-400" />
      </div>
      <p class="text-sm font-bold dark:text-gray-200 text-gray-700 mb-1">Hubungkan Akun StikerNews</p>
      <p class="text-xs dark:text-gray-500 text-gray-400 leading-relaxed max-w-xs mb-4">
        Scan QR dari aplikasi StikerNews untuk menampilkan daftar konten favorit kamu di sini.
      </p>
      <button @click="emit('openScanner')"
        class="flex items-center gap-2 bg-brand-red dark:bg-brand-green text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-red-400 dark:hover:bg-green-400 transition-colors">
        <i class="ri-qr-scan-2-line" />
        Scan QR Sekarang
      </button>
    </div>

    <!-- STATE: scanner terbuka -->
    <div v-if="showScanner" class="space-y-4 max-w-xl mx-auto">
      <div class="flex gap-1 p-1 dark:bg-gray-800 bg-gray-100 rounded-xl">
        <button v-for="tab in scanTabs" :key="tab.value" @click="emit('update:scanMode', tab.value)"
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
          <!-- <video :ref="videoRef" class="w-full h-full object-cover" autoplay playsinline muted /> -->
          <slot name="camera-video" />
          <div v-if="!cameraError" class="absolute inset-0 pointer-events-none">
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
            <button @click="emit('update:scanMode', 'manual')" class="text-xs text-brand-green font-bold underline">
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
            <strong class="dark:text-gray-200 text-gray-700">Kode ID</strong>
            → Masukkan di sini.
          </p>
          <div class="flex gap-2">
            <input :value="manualCode" type="text" placeholder="Contoh: ABCDEFGH12345678"
              class="flex-1 text-sm font-mono font-bold tracking-widest uppercase px-3 py-2.5 rounded-xl dark:bg-gray-700 bg-white border dark:border-gray-600 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
              @input="emit('update:manualCode', ($event.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9]/g, ''))"
              @keydown.enter="emit('submitManual')" />
            <button @click="emit('submitManual')" :disabled="(manualCode?.length ?? 0) < 6 || verifying"
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

      <button @click="emit('closeScanner')"
        class="px-4 py-2.5 bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 transition-colors flex items-center gap-1.5 m-auto rounded-full">
        Batal
      </button>
    </div>

    <!-- STATE: sudah linked -->
    <div v-if="linkedUser && !showScanner">
      <div v-if="contentStore.loadingFavorite || contentStore.loadingPlaylist" class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-12 rounded-lg dark:bg-gray-800 bg-gray-100 animate-pulse" />
      </div>

      <template v-else>

        <!-- TAB: FAVORIT -->
        <template v-if="activeMenuTab === 'favorit'">
          <div v-if="currentMenuItems.length" class="space-y-2">
            <div v-for="(item, idx) in currentMenuItems" :key="item.id_lonceng"
              class="dark:bg-[#1e1e1e] bg-white rounded-xl p-3 border dark:border-gray-800 border-gray-100 flex items-center gap-3 card-hover group cursor-pointer"
              :class="playerStore.currentTrack?.id === String(item.id_lonceng) ? 'ring-2 ring-brand-green' : ''"
              @click="(!item.audio_url || item.durasi === '00:00') ? emit('clickDetailMenuItem', item) : emit('playMenuItem', item)">

              <span class="text-xs dark:text-gray-500 text-gray-400 w-5 text-center flex-shrink-0">
                <span v-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
                  class="flex items-end justify-center gap-[2px] h-4 w-5">
                  <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq1" />
                  <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq2" />
                  <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq3" />
                </span>
                <template v-else>{{ idx + 1 }}</template>
              </span>

              <img v-if="item.gambar_url" :src="item.gambar_url" :alt="item.judul"
                class="w-10 h-10 rounded-xl object-cover flex-shrink-0" loading="lazy" decoding="async" />
              <div v-else class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
                :style="{ background: `linear-gradient(135deg, ${gradientFor(item.id_lonceng).from}, ${gradientFor(item.id_lonceng).to})` }">
                🎧
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-bold dark:text-white text-gray-900 text-sm truncate"
                  :class="playerStore.currentTrack?.id === String(item.id_lonceng) ? 'text-brand-green' : ''">
                  {{ item.judul }}
                </p>
                <p class="text-xs dark:text-gray-400 text-gray-500">
                  {{ channelItems[item.channel] }} •
                  <span :class="!item.audio_url || item.durasi === '00:00' ? 'italic' : ''">
                    {{ !item.audio_url || item.durasi === '00:00' ? 'Teks' : (item.durasi || '—') }}
                  </span>
                </p>
              </div>

              <i v-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
                class="ri-volume-up-line text-brand-green flex-shrink-0" />
            </div>
          </div>

          <div v-else class="flex flex-col items-center py-12 text-center">
            <i class="ri-heart-line text-5xl dark:text-gray-700 text-gray-300 mb-3" />
            <p class="dark:text-gray-400 text-gray-500 text-sm font-bold">Belum ada konten favorit</p>
          </div>
        </template>

        <!-- TAB: PLAYLIST -->
        <template v-else-if="activeMenuTab === 'playlist'">

          <!-- Detail playlist -->
          <template v-if="selectedPlaylist">
            <div class="flex items-center gap-2 mb-4">
              <button @click="emit('backFromPlaylist')"
                class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-gray-800 bg-gray-100 hover:dark:bg-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0">
                <i class="ri-arrow-left-s-line text-sm dark:text-gray-300 text-gray-600" />
              </button>
              <div class="min-w-0">
                <p class="text-sm font-bold dark:text-gray-200 text-gray-800 truncate">{{ selectedPlaylist.name }}</p>
                <p class="text-xs dark:text-gray-500 text-gray-400">{{ selectedPlaylist.content_count }} konten</p>
              </div>
            </div>

            <div v-if="contentStore.loadingDetailPlaylist" class="space-y-2">
              <div v-for="i in 4" :key="i" class="h-12 rounded-lg dark:bg-gray-800 bg-gray-100 animate-pulse" />
            </div>

            <template v-else>
              <div v-if="contentStore.detailPlaylistItems.length" class="space-y-2">
                <div v-for="(item, idx) in contentStore.detailPlaylistItems" :key="item.id_lonceng"
                  class="dark:bg-[#1e1e1e] bg-white rounded-xl p-3 border dark:border-gray-800 border-gray-100 flex items-center gap-3 card-hover group cursor-pointer"
                  :class="playerStore.currentTrack?.id === String(item.id_lonceng) ? 'ring-2 ring-brand-green' : ''"
                  @click="(!item.audio_url || item.durasi === '00:00') ? emit('clickDetailPlaylistItem', item) : emit('playPlaylistItem', item)">

                  <span class="text-xs dark:text-gray-500 text-gray-400 w-5 text-center flex-shrink-0">
                    <span v-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
                      class="flex items-end justify-center gap-[2px] h-4 w-5">
                      <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq1" />
                      <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq2" />
                      <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq3" />
                    </span>
                    <template v-else>{{ idx + 1 }}</template>
                  </span>

                  <img v-if="item.gambar_url" :src="item.gambar_url" :alt="item.judul"
                    class="w-10 h-10 rounded-xl object-cover flex-shrink-0" loading="lazy" decoding="async" />
                  <div v-else class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
                    :style="{ background: `linear-gradient(135deg, ${gradientFor(item.id_lonceng).from}, ${gradientFor(item.id_lonceng).to})` }">
                    🎧
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="font-bold dark:text-white text-gray-900 text-sm truncate"
                      :class="playerStore.currentTrack?.id === String(item.id_lonceng) ? 'text-brand-green' : ''">
                      {{ item.judul }}
                    </p>
                    <p class="text-xs dark:text-gray-400 text-gray-500">
                      {{ channelItems[item.channel] }} •
                      <span :class="!item.audio_url || item.durasi === '00:00' ? 'italic' : ''">
                        {{ !item.audio_url || item.durasi === '00:00' ? 'Teks' : (item.durasi || '—') }}
                      </span>
                    </p>
                  </div>

                  <i v-if="playerStore.currentTrack?.id === String(item.id_lonceng) && playerStore.isPlaying"
                    class="ri-volume-up-line text-brand-green flex-shrink-0" />
                </div>
              </div>

              <div v-else class="flex flex-col items-center py-12 text-center">
                <i class="ri-play-list-line text-5xl dark:text-gray-700 text-gray-300 mb-3" />
                <p class="dark:text-gray-400 text-gray-500 text-sm font-bold">Playlist ini masih kosong</p>
              </div>
            </template>
          </template>

          <!-- List semua playlist -->
          <template v-else>
            <div v-if="contentStore.playlistItems.length" class="space-y-2">
              <div v-for="playlist in contentStore.playlistItems" :key="playlist.id"
                class="dark:bg-[#1e1e1e] bg-white rounded-xl p-3 border dark:border-gray-800 border-gray-100 flex items-center gap-3 cursor-pointer card-hover transition-colors"
                :class="playlist.content_count === 0 ? 'opacity-50 cursor-default' : 'cursor-pointer'"
                @click="playlist.content_count === 0 ? null : emit('openPlaylistDetail', playlist)">

                <div class="relative flex-shrink-0">
                  <img v-if="playlist.thumbnail_url" :src="playlist.thumbnail_url" :alt="playlist.name"
                    class="w-10 h-10 rounded-xl object-cover" loading="lazy" decoding="async" />
                  <div v-else
                    class="w-10 h-10 rounded-xl dark:bg-gray-700 bg-gray-200 flex items-center justify-center text-lg">
                    🎵
                  </div>
                  <span
                    class="absolute -bottom-1 -right-1 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full leading-none"
                    :class="playlist.content_count === 0 ? 'bg-gray-400' : 'bg-brand-red dark:bg-brand-green'">
                    {{ playlist.content_count }}
                  </span>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="font-bold dark:text-white text-gray-900 text-sm truncate">{{ playlist.name }}</p>
                  <p class="text-xs dark:text-gray-400 text-gray-500 truncate">
                    {{ playlist.content_count === 0 ? 'Playlist kosong' : playlist.thumbnail_title }}
                  </p>
                </div>

                <i class="ri-arrow-right-s-line text-sm dark:text-gray-600 text-gray-300 flex-shrink-0" />
              </div>
            </div>

            <div v-else class="flex flex-col items-center py-12 text-center">
              <i class="ri-play-list-line text-5xl dark:text-gray-700 text-gray-300 mb-3" />
              <p class="dark:text-gray-400 text-gray-500 text-sm font-bold">Belum ada playlist</p>
            </div>
          </template>

        </template>
      </template>
    </div>

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

<style scoped>
.scan-line {
  animation: scanMove 2s ease-in-out infinite;
  top: 10%;
}

@keyframes scanMove {

  0%,
  100% {
    top: 10%;
  }

  50% {
    top: 85%;
  }
}
</style>