<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { usePlayerStore } from '@/stores/player'
import { useContentStore } from '@/stores/content'
import { useAuthStore } from '@/stores/auth'
import { useContent, gradientFor, emojiFor } from '@/composables/useContent'
import { stikerNewsData, karakterData, getRandomItems } from '@/data/mockData'
import type { PlayerTrack, StepKey } from '@/types'
import jsQR from 'jsqr'
import TrackDetailPopup from '@/components/ui/TrackDetailPopup.vue'
import * as faceapi from 'face-api.js'
import { generateSessionId, sanitizeAiText } from '@/helpers'
import { useClassSessionStore } from '@/stores/classSession'
import BriefingModal from '@/components/beranda/BriefingModal.vue'
import ListeningModal from '@/components/beranda/ListeningModal.vue'
import SummaryModal from '@/components/beranda/SummaryModal.vue'
import EndClassModal from '@/components/beranda/EndClassModal.vue'
import ConfirmChangeAccountModal from '@/components/ui/ConfirmChangeAccountModal.vue'
import ErrorVerificationAccountModal from '@/components/ui/ErrorVerificationAccountModal.vue'
import ReportSessionModal from '@/components/beranda/ReportSessionModal.vue'
import HeroSlider from '@/components/beranda/HeroSlider.vue'
import EducationSongSection from '@/components/beranda/EducationSongSection.vue'
import StikerNewsRecommended from '@/components/beranda/StikerNewsRecommended.vue'
import TeacherModeSection from '@/components/beranda/TeacherModeSection.vue'
// import * as cocoSsd from '@tensorflow-models/coco-ssd'
// import '@tensorflow/tfjs'

const router = useRouter()
const themeStore = useThemeStore()
const playerStore = usePlayerStore()
const contentStore = useContentStore()
const classSession = useClassSessionStore()
const auth = useAuthStore()
const { playItem, setItem } = useContent()

async function switchChannel(channelId: number) {
  await contentStore.switchChannel(channelId, auth.userId)
}

// ── Fallback lokal ─────────────────────────────────────────────────────────
const localRandomNews = computed(() => getRandomItems(stikerNewsData, 5))

let _cachedDisplayed: typeof karakterData = []

// Di dalam setup()
if (!_cachedDisplayed.length) {
  _cachedDisplayed = karakterData
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
}
const displayed = _cachedDisplayed

// ✅ Simpan hasil random ke ref, hanya di-set saat data pertama kali masuk
const apiRandomItems = computed(() => {
  const items = contentStore.items
  if (!items.length) return []
  return items.slice(-5)
})


const orbs = computed(() => {
  const isDark = themeStore.mode === 'dark'
  return [
    {
      width: '260px',
      height: '260px',
      background: isDark
        ? 'radial-gradient(circle, rgba(29,185,84,0.18) 0%, rgba(29,185,84,0) 70%)'
        : 'radial-gradient(circle, rgba(220,38,38,0.18) 0%, rgba(220,38,38,0) 70%)',
      top: '-40px',
      right: '60px',
      animation: 'floatOrb 12s ease-in-out infinite',
    },
    {
      width: '200px',
      height: '200px',
      background: isDark
        ? 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)'
        : 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)',
      bottom: '-50px',
      right: '20px',
      animation: 'floatOrb 15s ease-in-out infinite',
      animationDelay: '-4s',
    },
  ]
})

// ── Hero slider — pakai data API ──────────────────────────────────────────
const heroItems = computed(() => {
  return contentStore.items.slice(0, 5)
})

const currentIndex = ref(0)
const currentItem = computed<any>(() => heroItems.value[currentIndex.value] ?? null)

function goTo(idx: number) {
  currentIndex.value = idx
  resetHeroTimer()
}

let heroTimer: ReturnType<typeof setInterval>

function resetHeroTimer() {
  clearInterval(heroTimer)
  heroTimer = setInterval(() => {
    if (!heroItems.value.length) return
    currentIndex.value = (currentIndex.value + 1) % heroItems.value.length
  }, 10000)
}

function mapToPlayerTrack(item: any): PlayerTrack {
  console.log('[mapToPlayerTrack]', {
    id: item.id_lonceng,
    durasi: item.durasi,
    podcast_durasi: item.podcast_durasi,
    audio_url: item.audio_url,
  })

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

// Sesuaikan playHero dengan field API
function playHero(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return

  const track = mapToPlayerTrack(item)
  const queueTracks = heroItems.value
    ?.filter(i => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'StikerNews Hari Ini'
  playerStore.playWithQueue(track, queueTracks)
}

function playStikerRandom(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return

  const track = mapToPlayerTrack(item)
  const queueTracks = apiRandomItems.value
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.queueListName = 'StikerNews Pilihan'
  playerStore.playWithQueue(track, queueTracks)
}

// Ambil lagu edukasi pertama dari store
const todayEdukasiSong = computed(() => {
  return contentStore.edukasiSongs?.[0] ?? null
})

// Track ini yang sedang AKTIF (baik playing maupun paused)
const isEdukasiActive = computed(() =>
  playerStore.currentTrack?.link === todayEdukasiSong.value?.url_audio?.trim()
)

// Track ini sedang BENAR-BENAR playing
const isEdukasiPlaying = computed(() =>
  isEdukasiActive.value && playerStore.isPlaying
)

function playEdukasiSong() {
  const song = todayEdukasiSong.value
  if (!song) return

  // ✅ Selalu clear preview state sebelum apapun
  playerStore.clearPreview()

  if (isEdukasiActive.value) {
    playerStore.togglePlay()
    return
  }

  playerStore.play({
    id: `${song.id}`,
    title: song.judul ?? 'Lagu Edukasi',
    subtitle: song.isi ?? 'StikerNews Pelajar',
    emoji: '🎵',
    duration: (song as any)?.durasi,
    duration_podcast: '',
    audio_url: song.url_audio,
    channel_name: 'lagu',
    type: 'lagu',
    podcast_url: '',
    image_url: song.img_url,
    isi: '',
    currentTime: 0,
    isPlaying: true,
    isFavorite: false,
    link: song.url_audio?.trim(),
  })

  playerStore.setNullQueue()
}


const isEdukasiSeeking = ref(false)

function onEdukasiSeekStart() {
  isEdukasiSeeking.value = true
}

function seekEdukasi(e: MouseEvent) {
  const bar = e.currentTarget as HTMLElement
  const ratio = e.offsetX / bar.offsetWidth
  playerStore.seekTo(ratio * totalSeconds.value)

  nextTick(() => {
    setTimeout(() => { isEdukasiSeeking.value = false }, 50)
  })
}

// ── Player helpers ─────────────────────────────────────────────────────────
// const progressPercent = computed(() => {
//   const dur = parseDuration(todayApiItem.value?.durasi ?? '0:00')
//   if (!dur) return 0
//   return Math.min(100, (playerStore.currentTime / dur) * 100)
// })
const progressPercent = computed(() => {
  if (!totalSeconds.value) return 0
  return Math.min(100, (playerStore.currentTime / totalSeconds.value) * 100)
})

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseDuration(dur: string): number {
  const [m, s] = dur.split(':').map(Number)
  return (m ?? 0) * 60 + (s ?? 0)
}

function playFavorite(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return

  const track = mapToPlayerTrack(item)
  const queueTracks = contentStore.favoriteItems
    ?.filter(i => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack) ?? []

  playerStore.queueListName = 'Favorit Saya'
  playerStore.playWithQueue(track, queueTracks)

  // ✅ Set metadata: tampil 5 di beranda, navigasi ke /favorite saat next ke index 5+
  playerStore.setQueuePageMeta(5, '/favorite', { type: 'favorit' })
}

function playPlaylist(item: any) {
  if (!item?.audio_url && !item?.podcast_url) return

  const track = mapToPlayerTrack(item)
  const queueTracks = contentStore.detailPlaylistItems
    ?.filter(i => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack) ?? []

  playerStore.queueListName = 'Playlist Saya'
  playerStore.playWithQueue(track, queueTracks)

  // ✅ Set metadata: navigasi ke /favorite saat next melewati item yang ditampilkan
  playerStore.setQueuePageMeta(
    contentStore.detailPlaylistItems.length,
    '/favorite',
    { type: 'playlist' }
  )
}

function formatWaktu(waktu: string): string {
  if (!waktu) return '—'
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const [tanggal] = waktu.split(' ')
  const [dd, mm]: any = tanggal?.split('-')
  return `${parseInt(dd)} ${bulan[parseInt(mm) - 1]}`
}

// ── QR / Favorit ───────────────────────────────────────────────────────────
interface LinkedUser { name: string; token: string; userId: string, photo: string }

const linkedUser = ref<LinkedUser | null>(
  JSON.parse(localStorage.getItem('sn_linked_user') ?? 'null')
)
const favoriteItems = ref<any[]>([])
const favLoading = ref(false)
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

let _recognition: any = null
let _transcriptLog: string[] = []

function cancelSession() {
  sessionStarted.value = false
  stepStatus.value = { briefing: 'locked', listening: 'locked', summary: 'locked', endclass: 'locked' }

  localStorage.removeItem(LISTENING_KEY)
  localStorage.removeItem(TRANSCRIPT_KEY)
  listeningElapsed.value = 0
  listeningStartTime.value = null
  listeningStopTime.value = null
  _transcriptLog = []

  // Reset state end class
  capturedPhoto.value = null
  faceCount.value = null
  endClassNote.value = ''
  showEndClassPopup.value = false

  classSession.resetSession()
  saveSessionState()
}

function disconnect() {
  linkedUser.value = null
  favoriteItems.value = []
  localStorage.removeItem('sn_linked_user')

  activeMenuTab.value = 'favorit'
  loadedTabs.value.clear()

  contentStore.favoriteItems = []
  contentStore.playlistItems = []
  selectedPlaylist.value = null
  contentStore.detailPlaylistItems = []

  playerStore.history = []
  localStorage.removeItem('classos_duration_cache')
  localStorage.removeItem('classos_player_history')
  localStorage.removeItem('classos_session_state')

  cancelSession()
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
    // ← 720p sudah cukup untuk QR scan, tidak perlu 1080p
    { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } },
    { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' } },
    { video: { facingMode: 'environment' } },
    { video: true },
  ]

  for (const constraint of constraints) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia(constraint)

      if (videoRef.value) {
        videoRef.value.srcObject = cameraStream
        await new Promise<void>((resolve) => {
          videoRef.value!.onloadedmetadata = () => {
            videoRef.value!.play().then(() => resolve()).catch(() => resolve())
          }
        })
        await new Promise(r => setTimeout(r, 300)) // ← turunkan dari 500ms ke 300ms
      }

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

  // Terminate worker saat scanner ditutup
  if (_qrWorker) {
    _qrWorker.terminate()
    _qrWorker = null
    _workerBusy = false
  }
}

let _qrWorker: Worker | null = null
let _workerBusy = false

function startQrScan() {
  if (qrInterval) { clearInterval(qrInterval); qrInterval = null }

  // Init worker
  if (!_qrWorker) {
    _qrWorker = new Worker('/qr-worker.js')
    _qrWorker.onmessage = (e) => {
      _workerBusy = false
      const result = e.data.result
      if (!result) return

      const now = Date.now()
      if (result === _lastQrResult && now - _lastQrTime < 3000) return

      _lastQrResult = result
      _lastQrTime = now

      clearInterval(qrInterval!)
      qrInterval = null
      verifyCode(result)
    }
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })!

  // Interval lebih lambat — worker yang kerja keras, bukan main thread
  qrInterval = setInterval(() => {
    const video = videoRef.value
    if (!video || video.readyState < 2 || video.videoWidth === 0) return
    if (_workerBusy) return // skip kalau worker masih proses frame sebelumnya

    // Downscale ke 400px — cukup untuk jsQR, lebih ringan
    const maxW = 400
    const scale = Math.min(1, maxW / video.videoWidth)
    canvas.width = Math.floor(video.videoWidth * scale)
    canvas.height = Math.floor(video.videoHeight * scale)

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    _workerBusy = true
    // Transfer buffer ke worker — zero-copy, tidak berat
    _qrWorker!.postMessage(
      { data: imageData.data, width: canvas.width, height: canvas.height },
      [imageData.data.buffer]
    )
  }, 250) // interval lebih santai karena worker async
}

let _lastQrResult = ''
let _lastQrTime = 0

async function submitManual() {
  if ((manualCode.value?.length ?? 0) < 6 || verifying.value) return
  await verifyCode(manualCode.value)
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

async function loadFavorites() {
  if (!linkedUser.value) return
  favLoading.value = true
  try {
    // Ganti dengan endpoint API StikerNews yang sebenarnya:
    // const res  = await fetch('/api/stikernews/favorites', {
    //   headers: { Authorization: `Bearer ${linkedUser.value.token}` }
    // })
    // favoriteItems.value = await res.json()

    // Simulasi — hapus setelah integrasi API nyata
    // await new Promise(r => setTimeout(r, 800))
    // favoriteItems.value = heroItems.value
  } catch {
    console.error('Gagal memuat favorit')
  } finally {
    favLoading.value = false
  }
}

// Stop kamera saat pindah ke tab manual
watch(scanMode, (val) => {
  if (val !== 'camera') stopCamera()
  else startCamera()
})

const currentTrack = computed(() => playerStore.currentTrack)
const totalSeconds = computed(() => parseDuration(currentTrack.value?.duration ?? '0:00'))

const channelItems: any = {
  7: "SD",
  8: "SMP",
  9: "SMA",
  10: "SMK",
}

// State untuk step flow
const listeningStatus = ref(false)
const showSummaryPopup = ref(false)
const showBriefingPopup = ref(false)
const showEndClassPopup = ref(false)

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

// End class - kamera
const capturedPhoto = ref<string | null>(null)
const countdown = ref(0)
const showFlash = ref(false)
let _stream: MediaStream | null = null
let _countdownTimer: ReturnType<typeof setInterval> | null = null

const faceCount = ref<number | null>(null)
// const isDetecting = ref(false)
// const faceModelLoaded = ref(false)
// let _detectInterval: ReturnType<typeof setInterval> | null = null

const endClassModalRef = ref<InstanceType<typeof EndClassModal> | null>(null)

async function openEndClass() {
  if (stepStatus.value.endclass === 'done') {
    showSessionReportPopup.value = true
    return
  }

  showEndClassPopup.value = true
  if (capturedPhoto.value) return

  countdown.value = 0
  faceCount.value = null
  endClassNote.value = ''

  await nextTick()

  loadPersonModel().catch(e => console.warn('[person-detection] load gagal:', e))

  try {
    let stream: MediaStream | null = null

    const constraints = [
      { video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } },
      { video: { width: { min: 640 }, height: { min: 480 }, facingMode: 'environment' } },
      { video: true },
    ]

    for (const constraint of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint)
        break
      } catch {
        continue
      }
    }

    if (!stream) throw new Error('Tidak ada kamera yang tersedia')
    _stream = stream

    const track = stream.getVideoTracks()[0]
    const settings = track?.getSettings()
    console.log('[camera] resolusi:', settings?.width, 'x', settings?.height)

    const videoEl = endClassModalRef.value?.videoEndClassRef
    if (videoEl) {
      videoEl.srcObject = stream
      await new Promise<void>((resolve) => {
        videoEl.onloadedmetadata = () => {
          videoEl.play().then(() => resolve()).catch(() => resolve())
        }
      })
    }

    await new Promise(r => setTimeout(r, 300))
    startLiveDetection() // ← aktifkan
  } catch (err) {
    console.error('Kamera tidak bisa diakses', err)
  }
}

// ✅ Model custom deteksi orang (YOLOv8 → TFJS graph model), ditaruh guru di
// public/models/classos-person-detection/. Signature model: input "images"
// [1,640,640,3] float32 dinormalisasi 0-1; output [1,5,8400] = (cx,cy,w,h,conf)
// per anchor, 1 kelas saja (person) — bukan format coco-ssd/BlazeFace, jadi
// decode box + NMS dilakukan manual di bawah.
const PERSON_MODEL_URL = '/models/classos-person-detection/model.json'
const PERSON_CONF_THRESHOLD = 0.4
const PERSON_IOU_THRESHOLD = 0.45

let _personModel: any | null = null
let _detectInterval: ReturnType<typeof setInterval> | null = null
const isDetecting = ref(false)

let _tfScriptLoaded = false

async function loadTfScript(): Promise<void> {
  if (_tfScriptLoaded || (window as any).tf) { _tfScriptLoaded = true; return }
  await new Promise<void>((resolve, reject) => {
    const tfScript = document.createElement('script')
    tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js'
    tfScript.onload = () => { _tfScriptLoaded = true; resolve() }
    tfScript.onerror = reject
    document.head.appendChild(tfScript)
  })
}

async function loadPersonModel() {
  if (_personModel) return

  isDetecting.value = true
  try {
    await loadTfScript()
    const tf = (window as any).tf
    if (!tf) throw new Error('TensorFlow belum dimuat')

    _personModel = await tf.loadGraphModel(PERSON_MODEL_URL)
  } finally {
    isDetecting.value = false
  }
}

interface DetBox { x: number; y: number; w: number; h: number; score: number }

// Greedy NMS sederhana — buang box yang overlap tinggi (IoU) dengan box berskor lebih tinggi
function nmsBoxes(boxes: DetBox[], iouThreshold: number): DetBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score)
  const kept: DetBox[] = []

  const iou = (a: DetBox, b: DetBox) => {
    const interX1 = Math.max(a.x, b.x)
    const interY1 = Math.max(a.y, b.y)
    const interX2 = Math.min(a.x + a.w, b.x + b.w)
    const interY2 = Math.min(a.y + a.h, b.y + b.h)
    const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1)
    const unionArea = a.w * a.h + b.w * b.h - interArea
    return unionArea <= 0 ? 0 : interArea / unionArea
  }

  for (const box of sorted) {
    if (!kept.some(k => iou(k, box) > iouThreshold)) kept.push(box)
  }
  return kept
}

async function startLiveDetection() {
  if (!_personModel) await loadPersonModel()

  _detectInterval = setInterval(async () => {
    const video = endClassModalRef.value?.videoEndClassRef
    const canvas = endClassModalRef.value?.overlayCanvasRef
    const tf = (window as any).tf
    if (!video || !canvas || capturedPhoto.value || !_personModel || !tf) return

    try {
      const inputTensor = tf.tidy(() => {
        const img = tf.browser.fromPixels(video)
        const resized = tf.image.resizeBilinear(img, [640, 640])
        return resized.toFloat().div(255).expandDims(0)
      })

      const output = await _personModel.executeAsync(inputTensor)
      inputTensor.dispose()

      const outputTensor = Array.isArray(output) ? output[0] : output
      const data: Float32Array = await outputTensor.data()
      if (Array.isArray(output)) output.forEach((t: any) => t.dispose())
      else output.dispose()

      // Output layout [1,5,8400]: baris 0-3 = cx,cy,w,h (dalam skala 640), baris 4 = confidence
      const numAnchors = 8400
      const scaleX = video.videoWidth / 640
      const scaleY = video.videoHeight / 640

      const candidates: DetBox[] = []
      for (let i = 0; i < numAnchors; i++) {
        const score = data[4 * numAnchors + i]!
        if (score < PERSON_CONF_THRESHOLD) continue
        const cx = data[0 * numAnchors + i]!
        const cy = data[1 * numAnchors + i]!
        const w = data[2 * numAnchors + i]!
        const h = data[3 * numAnchors + i]!
        candidates.push({
          x: (cx - w / 2) * scaleX,
          y: (cy - h / 2) * scaleY,
          w: w * scaleX,
          h: h * scaleY,
          score,
        })
      }

      const persons = nmsBoxes(candidates, PERSON_IOU_THRESHOLD)
      faceCount.value = persons.length

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.clientWidth
      canvas.height = video.clientHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ✅ Hitung offset object-cover agar box pas
      const videoAspect = video.videoWidth / video.videoHeight
      const displayAspect = video.clientWidth / video.clientHeight

      let dScaleX: number, dScaleY: number, offsetX: number, offsetY: number

      if (videoAspect > displayAspect) {
        dScaleY = video.clientHeight / video.videoHeight
        dScaleX = dScaleY
        offsetX = (video.clientWidth - video.videoWidth * dScaleX) / 2
        offsetY = 0
      } else {
        dScaleX = video.clientWidth / video.videoWidth
        dScaleY = dScaleX
        offsetX = 0
        offsetY = (video.clientHeight - video.videoHeight * dScaleY) / 2
      }

      persons.forEach((person, i) => {
        const sx = person.x * dScaleX + offsetX
        const sy = person.y * dScaleY + offsetY
        const sw = person.w * dScaleX
        const sh = person.h * dScaleY
        const score = Math.round(person.score * 100)

        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 2
        ctx.strokeRect(sx, sy, sw, sh)

        const c = 14
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(sx, sy + c); ctx.lineTo(sx, sy); ctx.lineTo(sx + c, sy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(sx + sw - c, sy); ctx.lineTo(sx + sw, sy); ctx.lineTo(sx + sw, sy + c); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(sx, sy + sh - c); ctx.lineTo(sx, sy + sh); ctx.lineTo(sx + c, sy + sh); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(sx + sw - c, sy + sh); ctx.lineTo(sx + sw, sy + sh); ctx.lineTo(sx + sw, sy + sh - c); ctx.stroke()

        ctx.fillStyle = '#22c55e'
        ctx.fillRect(sx, sy - 20, 72, 20)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText(`#${i + 1} ${score}%`, sx + 4, sy - 5)
      })
    } catch (e) {
      console.warn('[person-detection] error:', e)
    }
  }, 500)
}

function stopLiveDetection() {
  if (_detectInterval) { clearInterval(_detectInterval); _detectInterval = null }

  const canvas = endClassModalRef.value?.overlayCanvasRef
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }
}

function playSound(src: string, volume = 0.7): void {
  const audio = new Audio(src)
  audio.volume = volume
  audio.play().catch(() => { })
}

function startCountdown() {
  // ← Stop live detection saat countdown mulai
  // faceCount yang terakhir terdeteksi akan dipakai sebagai hasil final
  stopLiveDetection()

  countdown.value = 5
  playSound('/sounds/countdown-beep.mp3')

  _countdownTimer = setInterval(() => {
    countdown.value--

    if (countdown.value <= 0) {
      clearInterval(_countdownTimer!)
      _countdownTimer = null
      takePhoto()
    } else {
      playSound('/sounds/countdown-beep.mp3')
    }
  }, 1000)
}

async function takePhoto() {
  const video = endClassModalRef.value?.videoEndClassRef
  const canvas = endClassModalRef.value?.canvasRef
  if (!video || !canvas) return

  const ctx = canvas.getContext('2d')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

  playSound('/sounds/camera-shutter.mp3', 0.8)
  showFlash.value = true
  setTimeout(() => showFlash.value = false, 300)

  capturedPhoto.value = canvas.toDataURL('image/jpeg', 0.92)
  _stream?.getTracks().forEach(t => t.stop())
  _stream = null

  // ← faceCount tidak di-reset, pakai hasil deteksi terakhir sebelum countdown
  saveSessionState(localStorage.getItem(SESSION_ID_KEY) as string)
}

function retakePhoto() {
  if (_countdownTimer) {
    clearInterval(_countdownTimer)
    _countdownTimer = null
  }
  capturedPhoto.value = null
  faceCount.value = null

  saveSessionState(localStorage.getItem(SESSION_ID_KEY) as string)

  openEndClass() // buka kamera lagi + startLiveDetection jalan lagi
}

function closeEndClass() {
  if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null }
  stopLiveDetection() // ← tambahkan
  stopNoteRecordingIfActive()
  showEndClassPopup.value = false
  countdown.value = 0
  showFlash.value = false
  _stream?.getTracks().forEach(t => t.stop())
  _stream = null
}

let _mediaStream: MediaStream | null = null

const synth = window.speechSynthesis
const isSpeaking = ref(false)
const isPaused = ref(false)

// const briefingText = `Selamat datang pada sesi pembelajaran hari ini. Pada kegiatan ini,siswa akan mempelajari materi yang telah disiapkan melalui berbagai aktivitas interaktif yang tersedia di aplikasi. Perhatikan setiap penjelasan dengan baik, ikuti instruksi yang diberikan, dan manfaatkan kesempatan ini untuk meningkatkan pemahaman serta keterampilan belajar secara aktif dan menyenangkan.`
const briefingText = computed(() => sanitizeAiText(classSession.brief.text))

// const summaryText = `Berdasarkan hasil kegiatan pembelajaran yang telah dilakukan, siswa menunjukkan pemahaman yang baik terhadap materi yang dipelajari. Melalui aktivitas mendengarkan, mengamati, dan menjawab pertanyaan yang tersedia pada aplikasi, siswa mampu mengenali konsep-konsep utama serta menerapkan informasi yang diperoleh dalam konteks yang sesuai. Hasil rekaman aktivitas pembelajaran menunjukkan adanya peningkatan partisipasi dan kemampuan memahami materi. Secara keseluruhan, tujuan pembelajaran pada sesi ini telah tercapai dengan baik, dan siswa diharapkan dapat menerapkan pengetahuan yang diperoleh pada kegiatan belajar berikutnya maupun dalam kehidupan sehari-hari.`
const summaryText = computed(() => sanitizeAiText(classSession.summarize.text))

function getBestFemaleVoice() {
  const voices = synth.getVoices()
  const femaleKeywords = ['female', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'fiona']
  return (
    voices.find(v => v.lang.startsWith('id')) ||
    voices.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k))) ||
    voices[0]
  )
}

const speakingStep = ref<StepKey | null>(null)

const showTrackPopup = ref(false)

const handleClickDetailHero = (item: any) => {
  showTrackPopup.value = true

  const track = mapToPlayerTrack(item)
  const queueTracks = heroItems.value
    ?.filter(i => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.setItemPlay(track, queueTracks)
}

const handleClickDetailChoose = (item: any) => {
  showTrackPopup.value = true

  const track = mapToPlayerTrack(item)
  const queueTracks = apiRandomItems.value
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.setItemPlay(track, queueTracks)
}

const activeMenuTab = ref<'favorit' | 'playlist'>('favorit')

const loadedTabs = ref<Set<string>>(new Set())

watch(activeMenuTab, async (tab) => {
  if (!linkedUser.value?.userId) return

  // Hanya request kalau belum pernah di-load sebelumnya
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

function goToFullList() {
  router.push({
    path: '/favorite',
    query: {
      type: activeMenuTab.value,
    }
  })
}

const selectedPlaylist = ref<null | { id: number; name: string; content_count: number; thumbnail_url?: string; thumbnail_title?: string }>(null)

async function openPlaylistDetail(playlist: typeof selectedPlaylist.value) {
  selectedPlaylist.value = playlist
  localStorage.setItem('playlist_selected', JSON.stringify(playlist))
  await contentStore.loadDetailPlaylistContent(String(playlist!.id))

  // ✅ Set sebagai playlist sesi
  selectedSessionPlaylist.value = playlist
}

const showConfirmGanti = ref(false)

function confirmGantiAkun() {
  showConfirmGanti.value = false

  // Reset session state dulu sebelum disconnect
  sessionStarted.value = false
  stepStatus.value = { briefing: 'locked', listening: 'locked', summary: 'locked', endclass: 'locked' }
  selectedSessionPlaylist.value = null
  selectedPlaylist.value = null
  contentStore.detailPlaylistItems = []
  clearSessionState()
  classSession.resetSession()

  disconnect() // di dalam disconnect sudah ada reset favoriteItems, playlistItems, history, dll
  openScanner()

  playChime('/sounds/logout-teacher.mp3')
}

function closeBriefing() {
  // synth.cancel()
  // isSpeaking.value = false
  // isPaused.value = false
  classSession.stopBrief()
  showBriefingPopup.value = false
}

function closeSummary() {
  // synth.cancel()
  // isSpeaking.value = false
  // isPaused.value = false
  showSummaryPopup.value = false
}

const showListeningPopup = ref(false)
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

// ── Session flow (step berurutan) ──────────────────────────────────────────
const sessionStarted = ref(false)
// const selectedPlaylistId = ref('')
const selectedSessionPlaylist = ref<typeof selectedPlaylist.value>(null)

type StepStatusVal = 'locked' | 'active' | 'done'

const stepStatus = ref<Record<StepKey, StepStatusVal>>({
  briefing: 'locked',
  listening: 'locked',
  summary: 'locked',
  endclass: 'locked',
})

const currentStep = computed<StepKey | null>(() => {
  const order: StepKey[] = ['briefing', 'listening', 'summary', 'endclass']
  return order.find(k => stepStatus.value[k] === 'active') ?? null
})

function stepClass(key: StepKey) {
  const s = stepStatus.value[key]
  if (s === 'done') return 'dark:bg-zinc-800 bg-gray-50 dark:text-gray-300 text-gray-600 cursor-pointer hover:dark:bg-zinc-700 hover:bg-gray-100 border dark:border-zinc-700 border-gray-200 transition-colors'
  if (s === 'active') return 'bg-brand-red dark:bg-brand-green text-white hover:opacity-90 cursor-pointer'
  return 'dark:bg-zinc-800/50 bg-gray-50 dark:text-gray-600 text-gray-300 cursor-not-allowed opacity-60'
}

function stepNumClass(key: StepKey) {
  const s = stepStatus.value[key]
  if (s === 'done') return 'bg-brand-red/15 dark:bg-brand-green/20 text-brand-red dark:text-brand-green'
  if (s === 'active') return 'bg-white/20 text-white'
  return 'dark:bg-zinc-700 bg-gray-200 dark:text-gray-500 text-gray-400'
}

function playSessionPlaylist() {
  if (!contentStore.detailPlaylistItems.length) return
  const tracks = contentStore.detailPlaylistItems
    .filter(i => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)
  if (!tracks.length) return

  playerStore.queueListName = selectedSessionPlaylist.value?.name ?? 'Playlist Sesi'
  playerStore.playWithQueue(tracks[0]!, tracks)
}

const SESSION_STATE_KEY = 'classos_session_state'
const SESSION_ID_KEY = 'classos_id_state'

interface SessionState {
  sessionStarted: boolean
  selectedSessionPlaylist: { id: number; name: string; content_count: number; thumbnail_url?: string; thumbnail_title?: string } | null
  stepStatus: Record<StepKey, 'active' | 'locked' | 'done'>
  summarize?: { text: string; done: boolean }
  brief?: { text: string; done: boolean }
  // ✅ Tambahan untuk laporan sesi
  listeningStartTime?: string | null
  listeningStopTime?: string | null
  capturedPhoto?: string | null
  faceCount?: number | null
  endClassNote?: string
  sessionScore?: number
  sessionScoreReason?: string
}

function saveSessionState(sessionId?: string) {
  const state: SessionState = {
    sessionStarted: sessionStarted.value,
    selectedSessionPlaylist: selectedSessionPlaylist.value,
    stepStatus: stepStatus.value,
    listeningStartTime: listeningStartTime.value,
    listeningStopTime: listeningStopTime.value,
    capturedPhoto: capturedPhoto.value,
    faceCount: faceCount.value,
    endClassNote: endClassNote.value,
    sessionScore: sessionScore.value,
    sessionScoreReason: sessionScoreReason.value,
  }

  if (classSession.summarize.text) state['summarize'] = { text: classSession.summarize.text, done: classSession.summarize.done }
  if (classSession.brief.text) state['brief'] = { text: classSession.brief.text, done: classSession.brief.done }

  localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(state))
  if (sessionId) localStorage.setItem(SESSION_ID_KEY, sessionId)
}

async function restoreSessionState() {
  try {
    const saved = localStorage.getItem(SESSION_STATE_KEY)
    if (!saved) return

    const state: SessionState = JSON.parse(saved)
    sessionStarted.value = state.sessionStarted
    selectedSessionPlaylist.value = state.selectedSessionPlaylist

    if (selectedSessionPlaylist.value) {
      const savedPlaylistLocal = localStorage.getItem('playlist_selected')
      if (savedPlaylistLocal) {
        selectedPlaylist.value = JSON.parse(savedPlaylistLocal)
        await contentStore.loadDetailPlaylistContent(String(selectedPlaylist.value!.id))
      }
      activeMenuTab.value = 'playlist'
    }

    if (state.stepStatus) stepStatus.value = state.stepStatus

    // ✅ Restore brief — pakai yang tersimpan, tidak perlu request ulang
    if (state.brief?.text) {
      classSession.brief.text = state.brief.text
      classSession.brief.done = state.brief.done ?? false
      classSession.brief.loading = false
    }

    // ✅ Restore summary
    if (state.summarize?.text) {
      classSession.summarize.text = state.summarize.text
      classSession.summarize.done = state.summarize.done ?? false
      classSession.summarize.loading = false
    }

    // Restore data laporan sesi
    listeningStartTime.value = state.listeningStartTime ?? null
    listeningStopTime.value = state.listeningStopTime ?? null
    capturedPhoto.value = state.capturedPhoto ?? null
    faceCount.value = state.faceCount ?? null
    endClassNote.value = state.endClassNote ?? ''
    sessionScore.value = state.sessionScore ?? 0
    sessionScoreReason.value = state.sessionScoreReason ?? ''

    if (state.stepStatus?.endclass === 'done' && state.sessionScore !== undefined) {
      animatedScoreDisplay.value = state.sessionScore
      scoreAnimating.value = false
      showScoreReason.value = true
    }
  } catch {
    localStorage.removeItem(SESSION_STATE_KEY)
  }
}

function clearSessionState() {
  localStorage.removeItem(SESSION_STATE_KEY)
}

watch([sessionStarted, selectedSessionPlaylist, stepStatus], () => {
  if (sessionStarted.value) {
    saveSessionState(localStorage.getItem(SESSION_ID_KEY) as string)
  }
}, { deep: true })

async function startSession() {
  if (!selectedSessionPlaylist.value) return
  sessionStarted.value = true
  stepStatus.value = { briefing: 'active', listening: 'locked', summary: 'locked', endclass: 'locked' }

  const sessionId = generateSessionId()
  classSession.setSessionId(sessionId)
  saveSessionState(sessionId)

  speak(`Sesi mengajar dimulai. Playlist ${selectedSessionPlaylist.value.name} telah dipilih. Silakan mulai dengan langkah pertama, Briefing.`)

  // ❌ Hapus guard ini — selalu request briefing untuk sesi baru
  // if (classSession.brief.text) return

  await classSession.runBrief(
    String(selectedSessionPlaylist.value.id),
    String(linkedUser.value?.userId)
  )

  if (classSession.brief.error) {
    console.error('Gagal ambil briefing:', classSession.brief.error)
  }
}

const LISTENING_KEY = 'classos_listening'
const TRANSCRIPT_KEY = 'classos_transcript_log'


function openStep(key: StepKey) {
  // Locked tidak bisa dibuka sama sekali
  if (stepStatus.value[key] === 'locked') return

  if (key === 'briefing') showBriefingPopup.value = true
  if (key === 'listening') showListeningPopup.value = true
  if (key === 'summary') showSummaryPopup.value = true
  if (key === 'endclass') { openEndClass() }
}

function unlockNext(current: StepKey) {
  const order: StepKey[] = ['briefing', 'listening', 'summary', 'endclass']
  const idx = order.indexOf(current)
  stepStatus.value[current] = 'done'
  if (idx + 1 < order.length) {
    stepStatus.value[order[idx + 1]!] = 'active'
  }
  saveSessionState(localStorage.getItem(SESSION_ID_KEY) as string) // ← simpan setiap step selesai
}

function completeBriefing() {
  // synth.cancel()
  // isSpeaking.value = false
  // isPaused.value = false
  showBriefingPopup.value = false
  stepStatus.value.briefing = 'done'
  stepStatus.value.listening = 'active'
  unlockNext('briefing')
}

// Timer listening (durasi berjalan)
const listeningElapsed = ref(0)
let listeningTimer: ReturnType<typeof setInterval> | null = null

function formatListeningTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Override handleListeningClick lama agar juga jalankan timer
// (Hapus/replace fungsi handleListeningClick yang sudah ada dengan versi ini)
const listeningStartTime = ref<string | null>(null)

async function handleListeningClickWithTimer() {
  if (listeningStatus.value) {
    _mediaStream?.getTracks().forEach(t => t.stop())
    _mediaStream = null
    listeningStatus.value = false
    _recognition?.stop()
    _recognition = null
    if (listeningTimer) { clearInterval(listeningTimer); listeningTimer = null }

    localStorage.setItem(LISTENING_KEY, JSON.stringify({
      elapsed: listeningElapsed.value,
      startedAt: null,
      listeningStartTime: listeningStartTime.value // ← ikut disimpan
    }))
  } else {
    try {
      _mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      listeningStatus.value = true

      // ✅ Catat waktu mulai HANYA sekali (saat pertama kali mulai, bukan tiap resume)
      if (!listeningStartTime.value) {
        listeningStartTime.value = new Date().toISOString()
      }

      localStorage.setItem(LISTENING_KEY, JSON.stringify({
        elapsed: listeningElapsed.value,
        startedAt: Date.now(),
        listeningStartTime: listeningStartTime.value
      }))

      listeningTimer = setInterval(() => {
        listeningElapsed.value++
        localStorage.setItem(LISTENING_KEY, JSON.stringify({
          elapsed: listeningElapsed.value,
          startedAt: Date.now(),
          listeningStartTime: listeningStartTime.value
        }))
      }, 1000)

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        _recognition = new SpeechRecognition()
        _recognition.lang = 'id-ID'
        _recognition.continuous = true
        _recognition.interimResults = false
        _recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              _transcriptLog.push(event.results[i][0].transcript)
              localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(_transcriptLog))
            }
          }
        }
        _recognition.onend = () => { if (listeningStatus.value) _recognition?.start() }
        _recognition.start()
      }
    } catch {
      console.error('Mikrofon tidak bisa diakses')
    }
  }
}


const submittingListening = ref(false) // untuk disable tombol saat request jalan

const listeningStopTime = ref<string | null>(null) // ← tambahan, isi saat completeListening
const submittingEndClass = ref(false)

const showSessionReportPopup = ref(false)
const sessionScore = ref<number>(0)
const sessionScoreReason = ref<string>('')
const animatedScoreDisplay = ref(0)
const scoreAnimating = ref(false)
const showScoreReason = ref(false)

async function completeListening() {
  if (listeningStatus.value) handleListeningClickWithTimer()

  submittingListening.value = true

  const stopTime = new Date().toISOString()
  listeningStopTime.value = stopTime
  saveSessionState(localStorage.getItem(SESSION_ID_KEY) as string)
  const transcriptText = _transcriptLog.join(' ')

  await classSession.saveListening({
    listening_start_time: listeningStartTime.value ?? stopTime,
    listening_stop_time: stopTime,
    listening_text: transcriptText,
  })

  submittingListening.value = false

  showListeningPopup.value = false
  unlockNext('listening')

  localStorage.removeItem(LISTENING_KEY)
  localStorage.removeItem(TRANSCRIPT_KEY)
  // ❌ HAPUS baris ini: listeningStartTime.value = null
  // Biarkan tetap ada, supaya laporan sesi (dan watcher yang jalan belakangan) tetap dapat nilai yang benar

  classSession.runSummarize(transcriptText || 'Tidak ada percakapan yang tercatat selama sesi listening.')

  _transcriptLog = []
}

// ── Summary generation (placeholder API) ────────────────────────────────

function completeSummary() {
  // synth.cancel()
  // isSpeaking.value = false
  // isPaused.value = false
  showSummaryPopup.value = false
  unlockNext('summary')
}

// ── End class submit (ganti savePhoto lama) ─────────────────────────────
const endClassNote = ref('')

type ScoreTier = 'low' | 'mid' | 'high'

const scoreTier = computed<ScoreTier>(() => {
  if (sessionScore.value < 40) return 'low'
  if (sessionScore.value <= 70) return 'mid'
  return 'high'
})

// ⚠️ Ganti path ini nanti sesuai file audio yang anda siapkan
const SCORE_SOUNDS: Record<ScoreTier, string> = {
  low: '/sounds/score-low.mp3',
  mid: '/sounds/score-mid.mp3',
  high: '/sounds/score-high.mp3',
}

function startScoreAnimation() {
  scoreAnimating.value = true
  showScoreReason.value = false
  animatedScoreDisplay.value = 0

  const duration = 10000
  const target = sessionScore.value
  const startedAt = Date.now()
  let rafId: number

  function tick() {
    const elapsed = Date.now() - startedAt
    const progress = Math.min(elapsed / duration, 1)

    if (progress < 0.8) {
      animatedScoreDisplay.value = Math.floor(Math.random() * 100)
    } else {
      const settleProgress = (progress - 0.8) / 0.2
      const noise = Math.floor((1 - settleProgress) * (Math.random() * 30))
      animatedScoreDisplay.value = Math.min(100, target + noise)
    }

    if (progress < 1) {
      rafId = requestAnimationFrame(tick)
    } else {
      animatedScoreDisplay.value = target
      scoreAnimating.value = false

      // ✅ Mainkan audio sesuai tier begitu angka final settle
      playSound(SCORE_SOUNDS[scoreTier.value], 0.8)

      setTimeout(() => { showScoreReason.value = true }, 400)
    }
  }

  rafId = requestAnimationFrame(tick)
}

function closeSessionReport() {
  showSessionReportPopup.value = false
  // resetAllSessionData()
  // sessionStarted.value = false
  // selectedSessionPlaylist.value = null
  // stepStatus.value = { briefing: 'locked', listening: 'locked', summary: 'locked', endclass: 'locked' }
  // clearSessionState()
  // classSession.resetSession()
}

async function submitEndClass() {
  stopNoteRecordingIfActive()
  submittingEndClass.value = true

  // Konversi base64 capturedPhoto ke File
  const blob = await (await fetch(capturedPhoto.value!)).blob()
  const file = new File([blob], `endclass_${Date.now()}.jpg`, { type: 'image/jpeg' })

  await classSession.uploadEndClassPhoto({
    file,
    studentCounting: faceCount.value ?? 0,
  })

  if (classSession.stopClassState.error) {
    console.error('Gagal upload foto:', classSession.stopClassState.error)
    // opsional: tampilkan toast error
  }

  // Lanjut evaluate seperti sebelumnya
  await classSession.evaluateClass(endClassNote.value)

  submittingEndClass.value = false

  if (classSession.evaluate.error) {
    console.error('Gagal evaluate:', classSession.evaluate.error)
    return
  }

  const result = classSession.evaluate.result
  const data = result?.data ?? result

  sessionScore.value = Number(data?.skor ?? data?.score ?? 0)
  sessionScoreReason.value = data?.evaluasi ?? data?.reason ?? data?.feedback ?? data?.alasan ?? ''

  showEndClassPopup.value = false
  unlockNext('endclass')

  saveSessionState(localStorage.getItem(SESSION_ID_KEY) as string)

  showSessionReportPopup.value = true
  startScoreAnimation()
}

function stopTTS() {
  if (typeof responsiveVoice !== 'undefined') {
    responsiveVoice.cancel()
  } else {
    synth.cancel()
  }
  isSpeaking.value = false
  isPaused.value = false
  speakingStep.value = null
}

function startBriefingTTS() {
  const useRV = typeof responsiveVoice !== 'undefined'

  // Kalau sedang speak step lain → stop dulu
  if (speakingStep.value !== null && speakingStep.value !== 'briefing') {
    stopTTS()
  } else if (isSpeaking.value) {
    // ✅ Kalau sedang speaking briefing → stop saja, tidak pause
    // karena pause tidak reliable di smartboard/webview
    stopTTS()
    return
  }

  // Mulai briefing dari awal
  if (useRV) {
    responsiveVoice.cancel()
    responsiveVoice.speak(briefingText.value, 'Indonesian Female', {
      rate: 1.1, pitch: 1.1, volume: 0.8,
      onstart: () => { isSpeaking.value = true; isPaused.value = false; speakingStep.value = 'briefing' },
      onend: () => { isSpeaking.value = false; isPaused.value = false; speakingStep.value = null },
      onerror: () => { isSpeaking.value = false; isPaused.value = false; speakingStep.value = null },
    })
    return
  }

  synth.cancel()
  const utt = new SpeechSynthesisUtterance(briefingText.value)
  utt.voice = getBestFemaleVoice() ?? null
  utt.rate = 0.95
  utt.pitch = 1.08
  utt.onstart = () => { isSpeaking.value = true; isPaused.value = false; speakingStep.value = 'briefing' }
  utt.onend = utt.onerror = () => { isSpeaking.value = false; isPaused.value = false; speakingStep.value = null }
  synth.speak(utt)
}

function startSummaryTTS() {
  const useRV = typeof responsiveVoice !== 'undefined'

  if (speakingStep.value !== null && speakingStep.value !== 'summary') {
    stopTTS()
  } else if (isSpeaking.value) {
    stopTTS()
    return
  }

  if (useRV) {
    responsiveVoice.cancel()
    responsiveVoice.speak(summaryText.value, 'Indonesian Female', {
      rate: 1.1, pitch: 1.1, volume: 0.8,
      onstart: () => { isSpeaking.value = true; isPaused.value = false; speakingStep.value = 'summary' },
      onend: () => { isSpeaking.value = false; isPaused.value = false; speakingStep.value = null },
      onerror: () => { isSpeaking.value = false; isPaused.value = false; speakingStep.value = null },
    })
    return
  }

  synth.cancel()
  const utt = new SpeechSynthesisUtterance(summaryText.value)
  utt.voice = getBestFemaleVoice() ?? null
  utt.rate = 0.95
  utt.pitch = 1.08
  utt.onstart = () => { isSpeaking.value = true; isPaused.value = false; speakingStep.value = 'summary' }
  utt.onend = utt.onerror = () => { isSpeaking.value = false; isPaused.value = false; speakingStep.value = null }
  synth.speak(utt)
}

function restartBriefingTTS() {
  // Stop dulu apapun yang sedang berjalan
  if (typeof responsiveVoice !== 'undefined') {
    responsiveVoice.cancel()
  } else {
    synth.cancel()
  }

  isSpeaking.value = false
  isPaused.value = false

  // Langsung mulai dari awal
  stopTTS()
  nextTick(() => startBriefingTTS())
}

function restartSummaryTTS() {
  // Stop dulu apapun yang sedang berjalan
  if (typeof responsiveVoice !== 'undefined') {
    responsiveVoice.cancel()
  } else {
    synth.cancel()
  }

  isSpeaking.value = false
  isPaused.value = false

  // Langsung mulai dari awal
  stopTTS()
  nextTick(() => startSummaryTTS())
}

function resetSession() {
  sessionStarted.value = false
  stepStatus.value = { briefing: 'active', listening: 'locked', summary: 'locked', endclass: 'locked' }

  selectedSessionPlaylist.value = null
  selectedPlaylist.value = null
  contentStore.detailPlaylistItems = []

  if (listeningStatus.value) handleListeningClickWithTimer()
  listeningElapsed.value = 0
  listeningStartTime.value = null
  listeningStopTime.value = null
  localStorage.removeItem(LISTENING_KEY)
  localStorage.removeItem(TRANSCRIPT_KEY)
  _transcriptLog = []

  stopTTS()

  // ✅ Reset brief dan summary di classSession
  classSession.resetSession()

  // ✅ Hapus cache brief dan summarize agar sesi baru selalu request ulang
  localStorage.removeItem('classos_brief_cache')
  localStorage.removeItem('classos_summarize_cache')

  showBriefingPopup.value = false
  showListeningPopup.value = false
  showSummaryPopup.value = false
  showEndClassPopup.value = false
  capturedPhoto.value = null
  faceCount.value = null
  sessionScore.value = 0
  sessionScoreReason.value = ''
  animatedScoreDisplay.value = 0
  scoreAnimating.value = false
  showScoreReason.value = false

  if (_countdownTimer) {
    clearInterval(_countdownTimer)
    _countdownTimer = null
  }
  _stream?.getTracks().forEach(t => t.stop())
  _stream = null

  clearSessionState()
}

const photoError = ref(false)

watch(() => linkedUser.value?.photo, () => {
  photoError.value = false
})

const isRecordingNote = ref(false)
let _noteRecognition: any = null

function toggleNoteRecording() {
  if (isRecordingNote.value) {
    _noteRecognition?.stop()
    _noteRecognition = null
    isRecordingNote.value = false
    return
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    console.warn('SpeechRecognition tidak didukung di browser ini')
    return
  }

  _noteRecognition = new SpeechRecognition()
  _noteRecognition.lang = 'id-ID'
  _noteRecognition.continuous = true
  _noteRecognition.interimResults = false // ← matikan interim

  _noteRecognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const text = event.results[i][0].transcript.trim()
        endClassNote.value = endClassNote.value
          ? endClassNote.value + ' ' + text
          : text
      }
    }
  }

  _noteRecognition.onerror = (e: any) => {
    console.error('Speech recognition error (note):', e.error)
    isRecordingNote.value = false
  }

  _noteRecognition.onend = () => {
    if (isRecordingNote.value) _noteRecognition?.start()
  }

  _noteRecognition.start()
  isRecordingNote.value = true
}

function stopNoteRecordingIfActive() {
  if (isRecordingNote.value) {
    _noteRecognition?.stop()
    _noteRecognition = null
    isRecordingNote.value = false
  }
}

const handleClickDetailFavorite = (item: any) => {
  showTrackPopup.value = true

  const track = mapToPlayerTrack(item)
  const queueTracks = contentStore.favoriteItems
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.setItemPlay(track, queueTracks)
}

const handleClickDetailPlaylist = (item: any) => {
  showTrackPopup.value = true

  const track = mapToPlayerTrack(item)
  const queueTracks = contentStore.detailPlaylistItems
    ?.filter((i: any) => i?.audio_url || i?.podcast_url)
    .map(mapToPlayerTrack)

  playerStore.setItemPlay(track, queueTracks)
}

// function retrySummary() {
//   classSession.runSummarize(_transcriptLog.join(' ') || 'Tidak ada percakapan yang tercatat selama sesi listening.')
// }

function retrySummary() {
  localStorage.removeItem('classos_summarize_cache')
  classSession.summarize.text = ''
  classSession.summarize.done = false

  classSession.runSummarize(_transcriptLog.join(' ') || 'Tidak ada percakapan yang tercatat selama sesi listening.')
}

function disconnectTeacher() {
  // 1. Stop TTS yang mungkin sedang berjalan
  stopTTS()

  // 2. Stop listening jika aktif
  if (listeningStatus.value) {
    _mediaStream?.getTracks().forEach(t => t.stop())
    _mediaStream = null
    listeningStatus.value = false
    _recognition?.stop()
    _recognition = null
    if (listeningTimer) { clearInterval(listeningTimer); listeningTimer = null }
  }

  // 3. Stop note recording jika aktif
  stopNoteRecordingIfActive()

  // 4. Stop kamera end class jika aktif
  closeEndClass()

  // 5. Reset semua session state
  sessionStarted.value = false
  stepStatus.value = { briefing: 'locked', listening: 'locked', summary: 'locked', endclass: 'locked' }
  selectedSessionPlaylist.value = null
  selectedPlaylist.value = null
  listeningElapsed.value = 0
  listeningStartTime.value = null
  listeningStopTime.value = null
  capturedPhoto.value = null
  faceCount.value = null
  endClassNote.value = ''
  sessionScore.value = 0
  sessionScoreReason.value = ''
  animatedScoreDisplay.value = 0
  scoreAnimating.value = false
  showScoreReason.value = false
  _transcriptLog = []

  // 6. Tutup semua popup yang mungkin terbuka
  showBriefingPopup.value = false
  showListeningPopup.value = false
  showSummaryPopup.value = false
  showEndClassPopup.value = false
  showSessionReportPopup.value = false

  // 7. Bersihkan localStorage sesi
  localStorage.removeItem(LISTENING_KEY)
  localStorage.removeItem(TRANSCRIPT_KEY)
  localStorage.removeItem('playlist_selected')
  clearSessionState()

  // 8. Reset classSession store
  classSession.resetSession()

  // 9. Reset tab dan data konten
  activeMenuTab.value = 'favorit'
  loadedTabs.value.clear()
  contentStore.favoriteItems = []
  contentStore.playlistItems = []
  contentStore.detailPlaylistItems = []

  // 10. Putuskan linkedUser
  linkedUser.value = null
  favoriteItems.value = []
  localStorage.removeItem('sn_linked_user')

  // 11. Reset player history
  playerStore.history = []
  localStorage.removeItem('classos_duration_cache')
  localStorage.removeItem('classos_player_history')
  localStorage.removeItem('classos_session_state')

  playChime('/sounds/logout-teacher.mp3')
}

const showFaceConfirmPopup = ref(false)

function requestConfirmDetection() {
  stopLiveDetection() // freeze jumlah wajah & hapus box, sesuai perbaikan sebelumnya
  showFaceConfirmPopup.value = true
}

function confirmDetectionYes() {
  showFaceConfirmPopup.value = false
  startCountdown()
}

function confirmDetectionNo() {
  showFaceConfirmPopup.value = false
  startLiveDetection() // lanjutkan deteksi lagi
}

async function retryBriefing() {
  // Hapus cache lama agar tidak pakai yang terpotong
  localStorage.removeItem('classos_brief_cache')
  classSession.brief.text = ''
  classSession.brief.done = false

  await classSession.runBrief(
    String(selectedSessionPlaylist.value?.id),
    String(linkedUser.value?.userId)
  )
}

onMounted(() => {
  resetHeroTimer()
  if (linkedUser.value) {
    loadFavorites()
    // Pre-load model kalau guru sudah login sebelumnya
    // loadPersonModel().catch(e => console.warn('[person-detection] preload gagal:', e))
  }

  // ✅ Daftarkan callback navigasi ke store
  playerStore.setNavigationCallback((path, query) => {
    router.push({ path, query })
  })

  const saved = localStorage.getItem(LISTENING_KEY)
  if (saved) {
    try {
      const { elapsed, startedAt, listeningStartTime: savedStartTime } = JSON.parse(saved)
      if (startedAt) {
        const extra = Math.floor((Date.now() - startedAt) / 1000)
        listeningElapsed.value = elapsed + extra
      } else {
        listeningElapsed.value = elapsed ?? 0
      }
      listeningStartTime.value = savedStartTime ?? null // ← tambahan
    } catch {
      listeningElapsed.value = 0
    }
  }

  const savedTranscript = localStorage.getItem(TRANSCRIPT_KEY)
  if (savedTranscript) {
    try {
      _transcriptLog = JSON.parse(savedTranscript)
    } catch {
      _transcriptLog = []
    }
  }

  restoreSessionState()

  const sessionId = localStorage.getItem(SESSION_ID_KEY)
  if (sessionId) {
    classSession.setSessionId(sessionId)
  }
})

onUnmounted(() => {
  clearInterval(heroTimer)
  stopCamera()
  closeEndClass()
  stopLiveDetection() // ← tambahkan
  _mediaStream?.getTracks().forEach(t => t.stop())
  synth.cancel()
  playerStore.setNavigationCallback(null as any)
  playerStore.clearQueuePageMeta()
})
</script>

<template>
  <div>
    <!-- Hero Slider -->
    <HeroSlider :hero-items="heroItems" :current-index="currentIndex" :current-item="currentItem"
      :loading="contentStore.loading" :orbs="orbs" @go-to="goTo" @play="playHero" @detail="handleClickDetailHero" />

    <!-- Loading Skeleton -->
    <div v-if="contentStore.loading && !contentStore.items.length" class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      <div v-for="i in 5" :key="i"
        class="dark:bg-[#1e1e1e] bg-white rounded-xl overflow-hidden border dark:border-gray-800 border-gray-100 animate-pulse">
        <div class="aspect-video dark:bg-gray-700 bg-gray-200"></div>
        <div class="p-2.5 space-y-1.5">
          <div class="h-3 dark:bg-gray-700 bg-gray-200 rounded w-3/4"></div>
          <div class="h-2 dark:bg-gray-700 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Error notice (non-blocking) -->
    <div v-if="contentStore.error && !contentStore.items.length"
      class="mb-4 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
      <span>⚠️</span>
      <p class="text-xs dark:text-yellow-300 text-yellow-700">Koneksi API gagal — menampilkan data lokal.</p>
    </div>

    <!-- Lagu + Karakter -->
    <EducationSongSection :today-edukasi-song="todayEdukasiSong" :is-edukasi-active="isEdukasiActive"
      :is-edukasi-playing="isEdukasiPlaying" :progress-percent="progressPercent" :displayed="displayed"
      @play="playEdukasiSong" @seek="seekEdukasi" @seek-start="onEdukasiSeekStart" />

    <!-- Channel Switcher (tampil jika ada channels dari API) -->
    <div v-if="contentStore.channels.length" class="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
      <button v-for="ch in contentStore.channels" :key="ch.id_channel"
        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap" :class="contentStore.activeChannelId === ch.id_channel
          ? 'bg-brand-green text-white'
          : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:dark:bg-gray-700'"
        @click="switchChannel(ch.id_channel)">
        {{ ch.nama_channel }}
      </button>
    </div>

    <!-- StikerNews Pilihan -->
    <StikerNewsRecommended :api-random-items="apiRandomItems" :local-random-news="localRandomNews"
      :loading="contentStore.loading" :channel-items="channelItems" @play="playStikerRandom"
      @detail="handleClickDetailChoose" />

    <!-- Playlist dari API / lokal -->
    <TeacherModeSection :linked-user="linkedUser" :photo-error="photoError" :show-scanner="showScanner"
      :scan-mode="scanMode" :scan-tabs="scanTabs" :manual-code="manualCode" :verifying="verifying"
      :verify-error="verifyError" :camera-error="cameraError" :active-menu-tab="activeMenuTab"
      :selected-playlist="selectedPlaylist" :selected-session-playlist="selectedSessionPlaylist"
      :session-started="sessionStarted" :step-status="stepStatus" :is-speaking="isSpeaking" :is-paused="isPaused"
      :speaking-step="speakingStep" :listening-status="listeningStatus" :listening-elapsed="listeningElapsed"
      :show-session-report-popup="showSessionReportPopup" :channel-items="channelItems" @disconnect="disconnectTeacher"
      @open-scanner="openScanner" @close-scanner="closeScanner" @confirm-ganti="showConfirmGanti = true"
      @set-scan-mode="scanMode = $event" @set-manual-code="manualCode = $event" @submit-manual="submitManual"
      @set-active-tab="activeMenuTab = $event" @refresh-tab="refreshCurrentTab" @play-favorite="playFavorite"
      @detail-favorite="handleClickDetailFavorite" @go-to-full-list="goToFullList"
      @open-playlist-detail="openPlaylistDetail"
      @back-playlist="selectedPlaylist = null; contentStore.detailPlaylistItems = []" @play-playlist="playPlaylist"
      @detail-playlist="handleClickDetailPlaylist" @open-step="openStep" @start-session="startSession"
      @cancel-session="cancelSession" @reset-session="resetSession"
      @clear-session-playlist="selectedSessionPlaylist = null; selectedPlaylist = null; contentStore.detailPlaylistItems = []"
      @set-photo-error="photoError = $event">
      <template #camera-video>
        <video ref="videoRef" class="w-full h-full object-cover" autoplay playsinline muted />
      </template>
    </TeacherModeSection>

    <BriefingModal v-model="showBriefingPopup" :briefing-text="briefingText" :loading="classSession.brief.loading"
      :error="classSession.brief.error" :is-speaking="isSpeaking" :is-paused="isPaused" :speaking-step="speakingStep"
      :briefing-done="classSession.brief.done" @close="closeBriefing" @restart-tts="restartBriefingTTS"
      @toggle-tts="startBriefingTTS" @complete="completeBriefing" @retry="retryBriefing" />

    <ListeningModal v-model="showListeningPopup" :listening-elapsed="listeningElapsed"
      :listening-status="listeningStatus" :step-status="stepStatus.listening ?? 'locked'"
      :submitting-listening="submittingListening" :format-listening-time="formatListeningTime"
      @toggle="handleListeningClickWithTimer" @complete="completeListening" />

    <SummaryModal v-model="showSummaryPopup" :summary-text="summaryText" :loading="classSession.summarize.loading"
      :error="classSession.summarize.error" :is-speaking="isSpeaking" :is-paused="isPaused"
      :speaking-step="speakingStep" :summary-done="classSession.brief.done" @close="closeSummary"
      @restart-tts="restartSummaryTTS" @toggle-tts="startSummaryTTS" @complete="completeSummary"
      @retry="retrySummary" />

    <EndClassModal ref="endClassModalRef" v-model="showEndClassPopup" :captured-photo="capturedPhoto"
      :is-detecting="isDetecting" :face-count="faceCount" :countdown="countdown" :show-flash="showFlash"
      :end-class-note="endClassNote" :is-recording-note="isRecordingNote" :submitting-end-class="submittingEndClass"
      :show-face-confirm="showFaceConfirmPopup" @update:end-class-note="endClassNote = $event" @close="closeEndClass"
      @toggle-note-recording="toggleNoteRecording" @request-confirm="requestConfirmDetection"
      @confirm-yes="confirmDetectionYes" @confirm-no="confirmDetectionNo" @retake="retakePhoto"
      @submit="submitEndClass" />

    <!-- Konfirmasi Ganti Akun -->
    <ConfirmChangeAccountModal v-model="showConfirmGanti" :linked-user-name="linkedUser?.name"
      @confirm="confirmGantiAkun" />

    <!-- Modal error verifikasi -->
    <ErrorVerificationAccountModal v-model="showVerifyErrorModal" :error-message="verifyErrorModalMsg"
      @retry="closeVerifyErrorModal" />

    <ReportSessionModal v-model="showSessionReportPopup" :captured-photo="capturedPhoto" :face-count="faceCount"
      :listening-start-time="listeningStartTime" :listening-stop-time="listeningStopTime" :summary-text="summaryText"
      :end-class-note="endClassNote" :animated-score-display="animatedScoreDisplay"
      :session-score-reason="sessionScoreReason" :score-animating="scoreAnimating" :show-score-reason="showScoreReason"
      :scoreTier="scoreTier" @close="closeSessionReport" />

    <!-- Popup Detail -->
    <TrackDetailPopup v-model="showTrackPopup" />
  </div>
</template>
