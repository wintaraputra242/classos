<script setup lang="ts">
import { laguEdukasiData } from '@/data/mockData'
import type { LaguEdukasi, PlayerTrack } from '@/types'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import jsQR from 'jsqr'
import TrackDetailPopup from '@/components/ui/TrackDetailPopup.vue'
import FavoriteSection from '@/components/favorite-history/FavoriteSection.vue'
import HistorySection from '@/components/favorite-history/HistorySection.vue'
import ConfirmChangeAccountModal from '@/components/ui/ConfirmChangeAccountModal.vue'
import ErrorVerificationAccountModal from '@/components/ui/ErrorVerificationAccountModal.vue'

const playerStore = usePlayerStore()
const activeTab = ref('favorit')
const router = useRouter()
const auth = useAuthStore()
const contentStore = useContentStore()

const tabs = computed(() => [
  { id: 'favorit', label: '❤️ Favorit & Playlist', count: null },
  { id: 'history', label: '🕐 History Play', count: playerStore.history.length },
])

const favoriteLagu = computed(() => laguEdukasiData.filter(l => l.isFavorite))

// const tabs = computed(() => [
//   { id: 'lagu', label: '❤️ Lagu Favorit', count: favoriteLagu.value.length },
//   { id: 'history', label: '🕐 History Play', count: playerStore.history.length },
//   { id: 'guru', label: '👩‍🏫 Playlist Guru', count: null },
// ])

const teacherPlaylists = [
  { jenjang: 'SD', color: 'bg-yellow-500', tracks: laguEdukasiData.filter(l => l.jenjang.includes('SD')) },
  { jenjang: 'SMP', color: 'bg-blue-500', tracks: laguEdukasiData.filter(l => l.jenjang.includes('SMP')) },
  { jenjang: 'SMA', color: 'bg-purple-600', tracks: laguEdukasiData.filter(l => l.jenjang.includes('SMA')) },
  { jenjang: 'SMK', color: 'bg-red-500', tracks: laguEdukasiData.filter(l => l.jenjang.includes('SMK')) },
]

// function toggleFav(lagu: LaguEdukasi) {
//   lagu.isFavorite = !lagu.isFavorite
// }

const channelItems: any = { 7: 'SD', 8: 'SMP', 9: 'SMA', 10: 'SMK' }

function gradientFor(id: string) {
  const gradients = [
    { from: '#1e3a5f', to: '#1a73e8' },
    { from: '#1a3a2a', to: '#1DB954' },
    { from: '#5f3a0d', to: '#f59e0b' },
    { from: '#5f1a1a', to: '#ef4444' },
    { from: '#3a1a5f', to: '#8b5cf6' },
  ]
  const idx = String(id).charCodeAt(String(id).length - 1) % gradients.length
  return gradients[idx]
}

function mapToPlayerTrack(item: any): PlayerTrack {
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
  }
}

// ── linkedUser & scanner ─────────────────────────────────────────────────
interface LinkedUser { name: string; token: string; userId: string; photo: string }

const linkedUser = ref<LinkedUser | null>(
  JSON.parse(localStorage.getItem('sn_linked_user') ?? 'null')
)
const showScanner = ref(false)
const scanMode = ref<'camera' | 'manual'>('camera')
const manualCode = ref('')
const verifying = ref(false)
const verifyError = ref('')
const cameraError = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
let cameraStream: MediaStream | null = null
let qrInterval: ReturnType<typeof setInterval> | null = null

const scanTabs = [
  { label: 'Kamera', value: 'camera' as const, icon: 'ri-camera-line' },
  { label: 'Kode Manual', value: 'manual' as const, icon: 'ri-keyboard-line' },
]

function disconnect() {
  linkedUser.value = null
  localStorage.removeItem('sn_linked_user')

  contentStore.favoriteItems = []
  contentStore.playlistItems = []
  contentStore.detailPlaylistItems = []

  playerStore.history = []
  localStorage.removeItem('classos_player_history')
}


async function openScanner() {
  showScanner.value = true
  scanMode.value = 'camera'
  verifyError.value = ''
  manualCode.value = ''
  await startCamera()
}

function closeScanner() {
  showScanner.value = false
  stopCamera()
}

async function startCamera() {
  cameraError.value = ''

  const constraints = [
    { video: { width: { ideal: 1920 }, height: { ideal: 1080 } } },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { width: { min: 640 }, height: { min: 480 } } },
    { video: true },
  ]

  for (const constraint of constraints) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia(constraint)
      if (videoRef.value) videoRef.value.srcObject = cameraStream

      const settings = cameraStream.getVideoTracks()[0]?.getSettings()
      console.log('[qr-camera] resolusi:', settings?.width, 'x', settings?.height)

      startQrScan()
      return
    } catch {
      continue
    }
  }

  cameraError.value = 'Kamera tidak dapat diakses. Gunakan kode manual.'
}

function stopCamera() {
  cameraStream?.getTracks().forEach(t => t.stop())
  cameraStream = null
  if (qrInterval) { clearInterval(qrInterval); qrInterval = null }
}

function startQrScan() {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!

  qrInterval = setInterval(() => {
    if (!videoRef.value || videoRef.value.readyState < 2) return
    const video = videoRef.value
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
    if (code?.data) {
      clearInterval(qrInterval!)
      verifyCode(code.data)
    }
  }, 300)
}

async function submitManual() {
  if ((manualCode.value?.length ?? 0) < 6 || verifying.value) return
  await verifyCode(manualCode.value)
}

// Declare agar TypeScript tidak error
declare const responsiveVoice: any

function speak(text: string) {
  // Fallback ke responsiveVoice kalau speechSynthesis tidak support
  if (typeof responsiveVoice !== 'undefined') {
    responsiveVoice.cancel()
    responsiveVoice.speak(text, 'Indonesian Female', {
      rate: 1.1,
      pitch: 1.1,
      volume: 0.8,
    })
    return
  }

  // Fallback ke Web Speech API kalau responsiveVoice tidak ada
  if (!window.speechSynthesis) return
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'id-ID'
  utt.rate = 1.1
  utt.pitch = 1.1
  utt.volume = 0.8
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utt)
}

function playChime(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src)
    audio.volume = 0.7
    audio.onended = () => resolve()
    audio.onerror = () => resolve() // tetap lanjut meski audio gagal
    audio.play().catch(() => resolve())
  })
}

async function speakWithChime(text: string, chimeSrc: string) {
  await playChime(chimeSrc)
  speak(text)
}

const _lastScanTime = ref(0)
const _scanCooldown = 2500

async function verifyCode(code: string) {
  const now = Date.now()
  if (now - _lastScanTime.value < _scanCooldown) return
  _lastScanTime.value = now

  verifying.value = true
  verifyError.value = ''

  try {
    const res = await auth.scanUniqId(code)

    if (res.success) {
      const data = res.data
      const namaGuru = data.name ?? 'Bapak atau Ibu Guru'

      linkedUser.value = {
        name: data.name,
        photo: data.photo,
        token: data.token,
        userId: data.user_id,
      }

      localStorage.setItem('sn_linked_user', JSON.stringify(linkedUser.value))
      closeScanner()
      await contentStore.loadFavoriteContent(data.user_id)
      await speakWithChime(
        `Selamat datang ${namaGuru}.. Semangat mengajar hari ini!`,
        '/sounds/login-chime.mp3'
      )
    } else {
      verifyErrorModalMsg.value = res.error ?? 'Kode tidak valid atau sudah kadaluarsa.'
      showVerifyErrorModal.value = true
      window.speechSynthesis.cancel()
      speak('Kode tidak valid. Silakan periksa kembali kode ID Anda.')
    }
  } catch {
    verifyErrorModalMsg.value = 'Gagal memverifikasi. Periksa koneksi internet.'
    showVerifyErrorModal.value = true
    window.speechSynthesis.cancel()
    speak('Gagal memverifikasi. Silakan periksa koneksi internet Anda.')
  } finally {
    verifying.value = false
  }
}

watch(scanMode, (val) => {
  if (val !== 'camera') stopCamera()
  else startCamera()
})

// ── Tab Favorit / Playlist ───────────────────────────────────────────────
const activeMenuTab = ref<'favorit' | 'playlist'>('favorit')
const loadedTabs = ref<Set<string>>(new Set())

const favoriteItems = computed<any[]>(() => contentStore.favoriteItems ?? [])
const playlistItems = computed<any[]>(() => contentStore.playlistItems ?? [])

const currentMenuItems = computed(() =>
  activeMenuTab.value === 'favorit' ? favoriteItems.value : playlistItems.value
)

watch(activeMenuTab, async (tab) => {
  selectedPlaylist.value = null
  contentStore.detailPlaylistItems = []

  if (!linkedUser.value?.userId) return
  if (loadedTabs.value.has(tab)) return

  if (tab === 'favorit') {
    await contentStore.loadFavoriteContent(linkedUser.value.userId)
    loadedTabs.value.add('favorit')
  }
  if (tab === 'playlist') {
    await contentStore.loadPlaylistContent(linkedUser.value.userId)
    loadedTabs.value.add('playlist')
  }
}, { immediate: true })

async function refreshCurrentTab() {
  if (!linkedUser.value?.userId) return
  if (activeMenuTab.value === 'favorit') {
    await contentStore.loadFavoriteContent(linkedUser.value.userId)
  } else {
    await contentStore.loadPlaylistContent(linkedUser.value.userId)
  }
}

function playMenuItem(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return
  const track = mapToPlayerTrack(item)
  const queueTracks = currentMenuItems.value
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'Favorit & Playlist Saya'
  playerStore.playWithQueue(track, queueTracks)
}

function playPlaylistItem(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return
  const track = mapToPlayerTrack(item)
  const queueTracks = contentStore.detailPlaylistItems
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'Favorit & Playlist Saya'
  playerStore.playWithQueue(track, queueTracks)
}

function playHistoryItem(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return
  const track = mapToPlayerTrack(item)
  const queueTracks = playerStore.history
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'Favorit & Playlist Saya'
  playerStore.playWithQueue(track, queueTracks)
}

const selectedPlaylist = ref<null | {
  id: number
  name: string
  content_count: number
  thumbnail_url?: string
  thumbnail_title?: string
}>(null)

async function openPlaylistDetail(playlist: typeof selectedPlaylist.value) {
  selectedPlaylist.value = playlist
  await contentStore.loadDetailPlaylistContent(String(playlist!.id))
}

const showConfirmGanti = ref(false)

function confirmGantiAkun() {
  showConfirmGanti.value = false

  // 1. Stop TTS jika ada
  if (typeof window.responsiveVoice !== 'undefined') {
    window.responsiveVoice.cancel()
  } else {
    window.speechSynthesis?.cancel()
  }

  // 2. Stop kamera scanner jika sedang aktif
  closeScanner()

  // 3. Reset tab dan data konten
  activeMenuTab.value = 'favorit'
  loadedTabs.value.clear()
  selectedPlaylist.value = null
  contentStore.favoriteItems = []
  contentStore.playlistItems = []
  contentStore.detailPlaylistItems = []

  // 4. Putuskan linkedUser
  linkedUser.value = null
  localStorage.removeItem('sn_linked_user')

  // 5. Reset player history
  playerStore.history = []
  localStorage.removeItem('classos_player_history')
  localStorage.removeItem('classos_duration_cache')

  // 6. Tutup popup
  showTrackPopup.value = false

  // 7. Buka scanner untuk akun baru
  openScanner()

  playChime('/sounds/logout-teacher.mp3')
}

const showVerifyErrorModal = ref(false)
const verifyErrorModalMsg = ref('')

async function closeVerifyErrorModal(mode?: 'camera' | 'manual') {
  showVerifyErrorModal.value = false
  if (mode) scanMode.value = mode

  // Reset cooldown agar bisa scan lagi
  _lastScanTime.value = 0

  if (scanMode.value === 'camera') {
    await nextTick()
    startCamera()
  }
}

const showTrackPopup = ref(false)

const handleClickDetailMenuItem = (item: any) => {
  showTrackPopup.value = true

  const track = mapToPlayerTrack(item)
  const queueTracks = currentMenuItems.value
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.setItemPlay(track, queueTracks)
}

const handleClickDetailPlaylistItem = (item: any) => {
  showTrackPopup.value = true

  const track = mapToPlayerTrack(item)
  const queueTracks = contentStore.detailPlaylistItems
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.setItemPlay(track, queueTracks)
}

function disconnectTeacher() {
  // 1. Stop TTS jika ada
  if (typeof window.responsiveVoice !== 'undefined') {
    window.responsiveVoice.cancel()
  } else {
    window.speechSynthesis?.cancel()
  }

  // 2. Stop kamera scanner jika aktif
  closeScanner()

  // 3. Reset tab dan data konten
  activeMenuTab.value = 'favorit'
  loadedTabs.value.clear()
  selectedPlaylist.value = null
  contentStore.favoriteItems = []
  contentStore.playlistItems = []
  contentStore.detailPlaylistItems = []

  // 4. Putuskan linkedUser
  linkedUser.value = null
  localStorage.removeItem('sn_linked_user')

  // 5. Reset player history
  playerStore.history = []
  localStorage.removeItem('classos_player_history')
  localStorage.removeItem('classos_duration_cache')

  // 6. Tutup popup jika ada
  showTrackPopup.value = false
  showConfirmGanti.value = false

  playChime('/sounds/logout-teacher.mp3')
}

onMounted(() => {
  if (linkedUser.value) {
    contentStore.loadFavoriteContent(linkedUser.value.userId)
    loadedTabs.value.add('favorit')
  }

  // ✅ Update callback ke router halaman ini (bukan beranda lagi)
  playerStore.setNavigationCallback((path, query) => {
    router.push({ path, query })
  })

  // ✅ Bersihkan limit karena di halaman ini semua item sudah tampil
  playerStore.clearQueuePageMeta()
})

onUnmounted(() => {
  stopCamera()
  playerStore.setNavigationCallback(null as any)
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-lg font-extrabold dark:text-white text-gray-900 flex items-center gap-2">
          <i class="ri-heart-line text-red-400" />
          Favorit & History
        </h1>
        <p class="text-xs dark:text-gray-400 text-gray-500 mt-0.5">Konten dan lagu yang kamu sukai</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-5">
      <button v-for="tab in tabs" :key="tab.id"
        class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors" :class="activeTab === tab.id
          ? 'bg-brand-red dark:bg-brand-green text-white'
          : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:dark:bg-gray-700 hover:bg-gray-200'"
        @click="activeTab = tab.id">
        {{ tab.label }}
        <span v-if="tab.count" class="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- ── Favorite ─────────────────────────────────────────────────── -->
    <FavoriteSection v-if="activeTab === 'favorit'" :linked-user="linkedUser" :show-scanner="showScanner"
      :active-menu-tab="activeMenuTab" :current-menu-items="currentMenuItems" :selected-playlist="selectedPlaylist"
      :verify-error="verifyError" :scan-mode="scanMode" :manual-code="manualCode" :verifying="verifying"
      :camera-error="cameraError" :video-ref="videoRef" @open-scanner="openScanner" @close-scanner="closeScanner"
      @disconnect="disconnectTeacher" @show-confirm-ganti="showConfirmGanti = true"
      @update:active-menu-tab="activeMenuTab = $event" @update:scan-mode="scanMode = $event"
      @update:manual-code="manualCode = $event" @submit-manual="submitManual" @refresh-tab="refreshCurrentTab"
      @play-menu-item="playMenuItem" @click-detail-menu-item="handleClickDetailMenuItem"
      @play-playlist-item="playPlaylistItem" @click-detail-playlist-item="handleClickDetailPlaylistItem"
      @open-playlist-detail="openPlaylistDetail"
      @back-from-playlist="selectedPlaylist = null; contentStore.detailPlaylistItems = []">

      <template #camera-video>
        <video ref="videoRef" class="w-full h-full object-cover" autoplay playsinline muted />
      </template>
    </FavoriteSection>

    <!-- ── History Play ───────────────────────────────────────────────────── -->
    <HistorySection v-if="activeTab === 'history'" />

    <!-- Konfirmasi Ganti Akun -->
    <ConfirmChangeAccountModal v-model="showConfirmGanti" :linked-user-name="linkedUser?.name"
      @confirm="confirmGantiAkun" />

    <!-- Modal error verifikasi -->
    <ErrorVerificationAccountModal v-model="showVerifyErrorModal" :error-message="verifyErrorModalMsg"
      @retry="closeVerifyErrorModal" />

    <!-- Popup Detail -->
    <TrackDetailPopup v-model="showTrackPopup" />
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
  position: absolute;
  width: 100%;
  height: 100%;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.deco-emoji {
  animation: floatEmoji ease-in-out infinite;
}

@keyframes floatEmoji {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@keyframes floatOrb {
  0% {
    transform: translate(0, 0) scale(1);
  }

  33% {
    transform: translate(30px, -20px) scale(1.1);
  }

  66% {
    transform: translate(-20px, 15px) scale(0.95);
  }

  100% {
    transform: translate(0, 0) scale(1);
  }
}

.fade-item-enter-active,
.fade-item-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-item-enter-from,
.fade-item-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

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

.countdown-enter-active {
  transition: all 0.2s ease;
}

.countdown-enter-from {
  transform: scale(1.5);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
