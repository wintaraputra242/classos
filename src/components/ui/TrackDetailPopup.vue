<!-- components/TrackDetailPopup.vue -->
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import type { PlayerTrack, ContentQuestion, ContentQuiz } from '@/types';
import ReportKontenModal from '@/components/ui/ReportKontenModal.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const playerStore = usePlayerStore()

const activeTab = ref<'insight' | 'podcast'>(playerStore.isPlayingFrom ?? 'insight')

const isPreviewMode = computed(() => playerStore.isPreview)

const currentTrack = computed(() => {
  if (playerStore.isPreview && playerStore.previewTrack) {
    return playerStore.previewTrack
  }
  return playerStore.currentTrack
})

const close = () => emit('update:modelValue', false)

// ✅ Report Konten
const showReportModal = ref(false)

// ✅ Tools Konten: Question / Quiz / Slide / Projek — panel di overlay showImagePreview
type ToolPanel = 'question' | 'quiz' | 'slide' | 'projek' | null
const activeToolPanel = ref<ToolPanel>(null)

const toolButtons: { key: Exclude<ToolPanel, null>; label: string; icon: string }[] = [
  { key: 'question', label: 'Question', icon: 'ri-question-line' },
  { key: 'quiz', label: 'Quiz', icon: 'ri-list-check-3' },
  { key: 'slide', label: 'Slide', icon: 'ri-image-2-line' },
  { key: 'projek', label: 'Projek', icon: 'ri-flag-line' },
]

function toggleToolPanel(panel: ToolPanel) {
  activeToolPanel.value = activeToolPanel.value === panel ? null : panel
}

// ✅ Panel tools jadi konten utama & gambar default otomatis mengecil ke pojok kanan atas
const isToolPanelOpen = computed(() => activeToolPanel.value !== null)

// ✅ Text-to-speech per item (Question: pertanyaan & jawaban terpisah, Quiz: soal + pilihan jawaban)
// Reuse pola dari startBriefingTTS() di BerandaView.vue — responsiveVoice kalau ada, fallback native
const speakingKey = ref<string | null>(null)

function stopSpeak() {
  responsiveVoice?.cancel()
  window.speechSynthesis?.cancel()
  speakingKey.value = null
}

function speak(key: string, text: string) {
  if (!text) return

  // Toggle: klik lagi tombol yang sama saat masih bicara → stop
  if (speakingKey.value === key) {
    stopSpeak()
    return
  }

  stopSpeak() // stop suara lain yang mungkin masih jalan

  if (responsiveVoice) {
    speakingKey.value = key
    responsiveVoice.speak(text, 'Indonesian Female', {
      onend: () => { if (speakingKey.value === key) speakingKey.value = null },
    })
    return
  }

  if (window.speechSynthesis) {
    speakingKey.value = key
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'id-ID'
    utt.onend = utt.onerror = () => { if (speakingKey.value === key) speakingKey.value = null }
    window.speechSynthesis.speak(utt)
  }
}

function quizSpeechText(q: ContentQuiz): string {
  const opts = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join(', ')
  return `${q.question}. Pilihan jawaban: ${opts}`
}

// Reveal jawaban per pertanyaan (accordion), reset tiap kali panel dibuka
const revealedAnswers = ref<Set<number>>(new Set())
function toggleAnswer(index: number) {
  const next = new Set(revealedAnswers.value)
  next.has(index) ? next.delete(index) : next.add(index)
  revealedAnswers.value = next
}

// Pilihan jawaban quiz per soal (index soal -> index opsi dipilih)
const quizSelected = ref<Record<number, number>>({})
function selectQuizOption(qIndex: number, optIndex: number) {
  if (quizSelected.value[qIndex] !== undefined) return // sudah dijawab, kunci
  quizSelected.value = { ...quizSelected.value, [qIndex]: optIndex }
}

// State tiap opsi quiz (buat nentuin warna tombol & badge lingkaran A/B/C/D)
function quizOptionState(qIndex: number, optIndex: number, correctIndex: number): 'default' | 'correct' | 'wrong' | 'other' {
  const selected = quizSelected.value[qIndex]
  if (selected === undefined) return 'default'
  if (optIndex === correctIndex) return 'correct'
  if (optIndex === selected) return 'wrong'
  return 'other'
}

const quizOptionClasses: Record<string, string> = {
  default: 'dark:bg-indigo-900/40 dark:border-indigo-700/50 dark:text-indigo-100 border-gray-300 text-gray-600 hover:dark:bg-indigo-800/50 hover:bg-gray-100',
  correct: 'dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-500 text-emerald-600 dark:text-emerald-300 font-bold',
  wrong: 'dark:bg-red-900/40 border-red-400 dark:border-red-500 text-red-600 dark:text-red-300 font-bold',
  other: 'dark:bg-indigo-950/30 border-gray-200 dark:border-indigo-900/40 text-gray-400 dark:text-indigo-300/40',
}

const quizBadgeClasses: Record<string, string> = {
  default: 'dark:border-indigo-400 border-gray-400 dark:text-indigo-200 text-gray-500',
  correct: 'dark:border-emerald-400 border-emerald-500 dark:text-emerald-300 text-emerald-600 dark:bg-emerald-500/20',
  wrong: 'dark:border-red-400 border-red-500 dark:text-red-300 text-red-600 dark:bg-red-500/20',
  other: 'dark:border-indigo-800 border-gray-300 dark:text-indigo-500/50 text-gray-400',
}

// Navigasi slide di panel Slide — mirip slider gambar utama, state terpisah
const currentSlideIndex = ref(0)
function nextSlide() {
  if (!displaySlides.value.length) return
  currentSlideIndex.value = (currentSlideIndex.value + 1) % displaySlides.value.length
}
function prevSlide() {
  if (!displaySlides.value.length) return
  currentSlideIndex.value = (currentSlideIndex.value - 1 + displaySlides.value.length) % displaySlides.value.length
}

watch(activeToolPanel, () => {
  revealedAnswers.value = new Set()
  quizSelected.value = {}
  currentSlideIndex.value = 0
  stopSpeak()
})

// ⚠️ SEMENTARA — dummy data untuk uji coba tampilan Question/Quiz/Slide/Projek selama
// backend belum kirim field ini di response konten. Begitu backend sudah mengirim
// questions/quiz/slides/project asli, computed di bawah otomatis pakai data asli
// (dummy hanya jadi fallback saat field-nya kosong/undefined) — hapus blok ini &
// fallback-nya kalau sudah tidak diperlukan lagi.
const DUMMY_QUESTIONS: ContentQuestion[] = [
  { question: 'Apa yang menyebabkan pelangi muncul setelah hujan?', answer: 'Cahaya matahari yang dibiaskan dan dipantulkan oleh tetesan air hujan sehingga terurai menjadi warna-warna spektrum.' },
  { question: 'Kenapa air mendidih pada suhu 100°C di permukaan laut?', answer: 'Karena pada suhu itu tekanan uap air sama dengan tekanan udara sekitar (1 atm), sehingga air berubah menjadi uap.' },
]

const DUMMY_QUIZ: ContentQuiz[] = [
  { question: 'Berapa jumlah warna dalam pelangi?', options: ['5', '6', '7', '8'], correct_index: 2 },
  { question: 'Proses berubahnya air menjadi uap disebut?', options: ['Kondensasi', 'Evaporasi', 'Presipitasi', 'Sublimasi'], correct_index: 1 },
]

const DUMMY_PROJECT = 'Buatlah percobaan sederhana membuat pelangi menggunakan gelas berisi air dan senter, lalu dokumentasikan hasilnya dalam bentuk foto beserta penjelasan singkat tentang proses pembiasan cahaya yang terjadi.'

const displayQuestions = computed(() => currentTrack.value?.questions ?? DUMMY_QUESTIONS)
const displayQuiz = computed(() => currentTrack.value?.quiz ?? DUMMY_QUIZ)
const displaySlides = computed(() => {
  if (currentTrack.value?.slides?.length) return currentTrack.value.slides
  // fallback dummy: Slide selalu berisi 4 gambar square (spec dari bos) — pakai gambar
  // konten yang sama berulang, cuma untuk uji coba tampilan sebelum data asli tersedia
  return currentTrack.value?.image_url ? Array(4).fill(currentTrack.value.image_url) : []
})
const displayProject = computed(() => currentTrack.value?.project ?? DUMMY_PROJECT)

const isiWords = computed(() => {
  const isi = currentTrack.value?.isi
  if (!isi) return []
  return isi.split(/\s+/)
})

const audioDurationSeconds = computed(() => {
  if (playerStore.isPlayingPodcast) return
  const durasi = currentTrack.value?.duration ?? '00:00'
  const [mins, secs] = durasi.split(':').map(Number)
  return (mins ?? 0) * 60 + (secs ?? 0)
})

const lastHighlightedIndex = ref(-1)

// const currentWordIndex = computed(() => {
//   if (playerStore.isPlayingPodcast) return -1
//   const total = audioDurationSeconds.value
//   if (!total || !isiWords.value.length) return -1
//   const progress = playerStore.currentTime / total
//   return Math.floor(progress * isiWords.value.length)
// })

const currentWordIndex = computed(() => {
  if (playerStore.isPlayingPodcast) return -1
  if (playerStore.isPreview) return -1          // ← tambahkan ini
  if (!playerStore.isPlaying) return -1         // ← tambahkan ini
  const total = audioDurationSeconds.value
  if (!total || !isiWords.value.length) return -1
  const progress = playerStore.currentTime / total
  return Math.floor(progress * isiWords.value.length)
})

watch(currentWordIndex, (newIndex) => {
  if (newIndex > lastHighlightedIndex.value) {
    lastHighlightedIndex.value = newIndex
  }
  // Reset saat audio diulang dari awal
  if (newIndex < lastHighlightedIndex.value - 5) {
    lastHighlightedIndex.value = newIndex
  }
})

function parseDuration(dur: string): number {
  const parts = dur.split(':')
  const m = parseInt(parts[0] ?? '0', 10)
  const s = parseInt(parts[1] ?? '0', 10)
  return m * 60 + s
}

const totalSeconds = computed(() => {
  if (playerStore.isPlayingPodcast) {
    return parseDuration(currentTrack.value?.duration_podcast ?? '0:00')
  }
  return parseDuration(currentTrack.value?.duration ?? '0:00')
})

const progressPercent = computed(() => {
  if (!totalSeconds.value) return 0
  return Math.min(100, (playerStore.currentTime / totalSeconds.value) * 100)
})

const isSeeking = ref(false)

function onSeekStart() {
  isSeeking.value = true
}

function seek(e: MouseEvent) {
  const bar = e.currentTarget as HTMLElement
  const ratio = e.offsetX / bar.offsetWidth
  const durationStr = activeTab.value === 'podcast'
    ? currentTrack.value?.duration_podcast
    : currentTrack.value?.duration
  const duration = parseDuration(durationStr ?? '')
  playerStore.seekTo(ratio * duration)

  nextTick(() => {
    setTimeout(() => { isSeeking.value = false }, 50)
  })
}

async function downloadImage() {
  const url = currentTrack.value?.image_url
  if (!url) return

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${currentTrack.value?.title ?? 'image'}.jpg`
        link.click()
        URL.revokeObjectURL(link.href)
      }, 'image/jpeg', 0.95)
    }

    img.onerror = () => {
      // Fallback: buka di tab baru
      window.open(url, '_blank')
    }

    img.src = url
  } catch {
    window.open(url, '_blank')
  }
}

// Ganti watch currentTrack
// watch(currentTrack, (track) => {
//   if (!track) return
//   // Default ke insight jika ada audio_url, jika tidak ada baru podcast
//   activeTab.value = track.audio_url ? 'insight' : 'podcast'
// }, { immediate: true })

// Tambah watch activeTab untuk switch audio

watch(
  [() => playerStore.isPlayingFrom, () => playerStore.currentTrack, () => playerStore.previewTrack],
  ([newMode, newTrack, newPreview]) => {
    console.log('[watch triggered]', {
      isPreview: playerStore.isPreview,
      newMode,
      newPreviewId: newPreview?.id,
      newTrackId: newTrack?.id,
      activeTab: activeTab.value
    })

    if (playerStore.isPreview && newPreview) {
      activeTab.value = newPreview.audio_url ? 'insight' :
        newPreview.podcast_url ? 'podcast' : 'insight'
      return
    }

    if (!newTrack) return
    if (newMode === 'insight') {
      activeTab.value = newTrack.audio_url ? 'insight' : 'podcast'
    } else {
      activeTab.value = newTrack.podcast_url ? 'podcast' : 'insight'
    }
  },
  { immediate: true }
)

// Reset activeTab ke insight saat popup dibuka dalam kondisi preview
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    // ✅ Reset saat popup ditutup
    isUserTabSwitch.value = false
    return
  }

  if (playerStore.isPreview && playerStore.previewTrack) {
    activeTab.value = playerStore.previewTrack.audio_url ? 'insight' :
      playerStore.previewTrack.podcast_url ? 'podcast' : 'insight'
  }
})

const lyricsContainer = ref<HTMLElement | null>(null)
const activeWordEl = ref<HTMLElement | null>(null)

watch(currentWordIndex, () => {
  nextTick(() => {
    if (!activeWordEl.value || !lyricsContainer.value) return
    activeWordEl.value.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  })
})

const isUserTabSwitch = ref(false)

watch(activeTab, (tab, oldTab) => {
  console.log('[activeTab changed]', {
    from: oldTab,
    to: tab,
    isUserTabSwitch: isUserTabSwitch.value,
    isPreview: playerStore.isPreview
  })

  if (!isUserTabSwitch.value) return
  if (playerStore.isPreview) {
    isUserTabSwitch.value = false
    return
  }

  isUserTabSwitch.value = false
  if (!currentTrack.value) return
  if (tab === 'podcast') {
    playerStore.playPodcast(currentTrack.value)
  } else {
    playerStore.playInsight(currentTrack.value)
  }
})

const showImagePreview = ref(false)

const canvasPreviewRef = ref<HTMLCanvasElement | null>(null)
const bgImage = ref<HTMLImageElement | null>(null)
const isDrawing = ref(false)
const drawingMode = ref<'draw' | 'erase'>('draw')
const selectedColor = ref('#ef4444')
const selectedSize = ref(4)
const history = ref<ImageData[]>([])

const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#000000']
const brushSizes = [2, 4, 8, 14]

function getCtx() {
  return canvasPreviewRef.value?.getContext('2d') ?? null
}

function onImageLoad() {
  const canvas = canvasPreviewRef.value
  const container = canvas?.parentElement
  if (!canvas || !container) return

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
  canvas.style.width = container.clientWidth + 'px'
  canvas.style.height = container.clientHeight + 'px'

  console.log('canvas size:', canvas.width, canvas.height) // ← cek ini tidak 0
}

function saveHistory() {
  const ctx = getCtx()
  const canvas = canvasPreviewRef.value
  if (!ctx || !canvas) return
  history.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
  if (history.value.length > 30) history.value.shift()
}

function startDraw(e: MouseEvent) {
  const ctx = getCtx()
  const canvas = canvasPreviewRef.value
  if (!ctx || !canvas) return
  saveHistory()
  isDrawing.value = true
  const rect = canvas.getBoundingClientRect()

  applyStyle(ctx)
  ctx.beginPath()
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

function draw(e: MouseEvent) {
  if (!isDrawing.value) return
  const ctx = getCtx()
  const canvas = canvasPreviewRef.value
  if (!ctx || !canvas) return
  const rect = canvas.getBoundingClientRect()

  applyStyle(ctx) // ← pindah ke sini juga
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.stroke()

  // Mulai path baru dari posisi sekarang agar tidak ada gap
  ctx.beginPath()
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

function startDrawTouch(e: TouchEvent) {
  const ctx = getCtx()
  const canvas = canvasPreviewRef.value
  if (!ctx || !canvas) return
  saveHistory()
  isDrawing.value = true
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]

  applyStyle(ctx)
  ctx.beginPath()
  ctx.moveTo((touch as any)?.clientX - rect.left, (touch as any)?.clientY - rect.top)
}

function drawTouch(e: TouchEvent) {
  if (!isDrawing.value) return
  const ctx = getCtx()
  const canvas = canvasPreviewRef.value
  if (!ctx || !canvas) return
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]

  applyStyle(ctx)
  ctx.lineTo((touch as any)?.clientX - rect.left, (touch as any)?.clientY - rect.top)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo((touch as any)?.clientX - rect.left, (touch as any)?.clientY - rect.top)
}

function stopDraw() {
  isDrawing.value = false
}

function applyStyle(ctx: CanvasRenderingContext2D) {
  if (drawingMode.value === 'erase') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = selectedSize.value * 4
    ctx.strokeStyle = 'rgba(0,0,0,1)' // ← wajib ada saat erase
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = selectedColor.value
    ctx.lineWidth = selectedSize.value
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function clearCanvas() {
  const ctx = getCtx()
  const canvas = canvasPreviewRef.value
  if (!ctx || !canvas) return
  saveHistory()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function undoCanvas() {
  const ctx = getCtx()
  const canvas = canvasPreviewRef.value
  if (!ctx || !canvas || !history.value.length) return
  ctx.putImageData(history.value.pop()!, 0, 0)
}

// Reset canvas saat gambar berubah
watch(showImagePreview, (val) => {
  if (!val) {
    history.value = []
    const ctx = getCtx()
    const canvas = canvasPreviewRef.value
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
})

function resizeCanvas() {
  const canvas = canvasPreviewRef.value
  const container = canvas?.parentElement
  if (!canvas || !container) return

  // Simpan coretan sebelum resize
  const ctx = getCtx()
  const snapshot = ctx?.getImageData(0, 0, canvas.width, canvas.height)

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight

  // Restore coretan setelah resize
  if (snapshot) ctx?.putImageData(snapshot, 0, 0)
}

function downloadCanvas() {
  const canvas = canvasPreviewRef.value
  const img = bgImage.value
  if (!canvas || !img) return

  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height

  // Load ulang gambar dengan crossOrigin anonymous
  const crossImg = new Image()
  crossImg.crossOrigin = 'anonymous'
  crossImg.src = img.src

  crossImg.onload = () => {
    // 1. Background putih
    tempCtx.fillStyle = '#ffffff'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // 2. Gambar di posisi yang sama dengan render aslinya
    const imgRect = img.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()
    const offsetX = imgRect.left - canvasRect.left
    const offsetY = imgRect.top - canvasRect.top
    tempCtx.drawImage(crossImg, offsetX, offsetY, imgRect.width, imgRect.height)

    // 3. Coretan canvas di atas
    tempCtx.drawImage(canvas, 0, 0)

    // 4. Download
    const link = document.createElement('a')
    link.download = `${currentTrack.value?.title ?? 'image'}-annotated.png`
    link.href = tempCanvas.toDataURL('image/png')
    link.click()
  }

  crossImg.onerror = () => {
    // Fallback: download coretan saja tanpa gambar background
    console.warn('Gambar tidak bisa di-load dengan CORS, download coretan saja.')
    const link = document.createElement('a')
    link.download = `${currentTrack.value?.title ?? 'image'}-annotated.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
}

const isCurrentTrackPlaying = computed(() => {
  if (playerStore.isPreview) return false
  return playerStore.currentTrack?.id === currentTrack.value?.id
})

const isImageMinimized = ref(false)

watch(showImagePreview, (val) => {
  if (!val) isImageMinimized.value = false
})

const currentImageIndex = ref(0)

// Sesuaikan ini dengan struktur data Anda — jika currentTrack punya banyak gambar.
// `images` belum ada di tipe PlayerTrack (belum dikirim backend), makanya dibaca via `unknown`.
const previewImages = computed<string[]>(() => {
  const images = (currentTrack.value as unknown as { images?: unknown })?.images
  if (Array.isArray(images) && images.length) {
    return images.map((img: unknown) => typeof img === 'string' ? img : (img as { path: string }).path)
  }
  // fallback ke single image_url
  return currentTrack.value?.image_url ? [currentTrack.value.image_url] : []
})

function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % previewImages.value.length
}

function prevImage() {
  currentImageIndex.value = (currentImageIndex.value - 1 + previewImages.value.length) % previewImages.value.length
}

// Reset index saat preview dibuka/ditutup atau track berubah
watch(showImagePreview, (val) => {
  if (!val) {
    isImageMinimized.value = false
    currentImageIndex.value = 0
  }
})

watch(currentTrack, () => {
  currentImageIndex.value = 0
})

const imagePosition = ref<'center' | 'left' | 'minimized'>('center')

watch(showImagePreview, (val) => {
  if (val) {
    imagePosition.value = 'center' // reset ke tengah setiap dibuka
    currentImageIndex.value = 0
  } else {
    activeToolPanel.value = null
    stopSpeak()
  }
})

// TrackDetailPopup.vue <script setup>
function handlePlayButton() {
  // Preview track berbeda → play via togglePlay (set queue dll)
  if (playerStore.isPreview) {
    playerStore.togglePlay()
    return
  }

  // Track ini sedang aktif → pause/resume
  if (isCurrentTrackPlaying.value) {
    playerStore.togglePlay()
    return
  }

  // Track berbeda tapi bukan preview (edge case) → play
  if (currentTrack.value) {
    playerStore.play(currentTrack.value as PlayerTrack)
  }
}

onMounted(() => {
  window.addEventListener('resize', resizeCanvas)
  // Fallback kalau gambar sudah cached dan onLoad tidak trigger
  if (bgImage.value?.complete) onImageLoad()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-6">

        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

        <!-- Card -->
        <div class="relative w-full max-w-7xl rounded-3xl overflow-hidden dark:bg-zinc-900 bg-white shadow-2xl">

          <!-- Close button -->
          <button @click="close"
            class="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <i class="ri-close-line text-2xl" />
          </button>

          <div class="flex flex-col lg:flex-row h-[85vh] max-h-[800px]">

            <!-- Gambar -->
            <div class="relative w-full lg:w-[480px] flex-shrink-0 bg-gradient-to-br from-green-800 to-green-500">
              <img v-if="currentTrack?.image_url" :src="currentTrack.image_url" :alt="currentTrack.title"
                class="w-full h-full object-cover" />
              <div v-else class="w-full h-full min-h-[300px] flex items-center justify-center text-9xl">
                {{ currentTrack?.emoji ?? '🎵' }}
              </div>

              <!-- Tab Toggle: Insight / Podcast -->
              <!-- <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 rounded-full p-1">
                <button v-if="currentTrack?.audio_url" @click="activeTab = 'insight'"
                  class="px-5 py-2 rounded-full text-sm font-bold transition-all" :class="activeTab === 'insight'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white'">
                  🎧 Insight
                </button>
                <button v-if="currentTrack?.podcast_url" @click="activeTab = 'podcast'"
                  class="px-5 py-2 rounded-full text-sm font-bold transition-all" :class="activeTab === 'podcast'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white'">
                  🎙 Podcast
                </button>
              </div> -->

              <button v-if="currentTrack?.image_url && currentTrack?.type !== 'lagu'" @click="showImagePreview = true"
                class="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                title="Download gambar">
                <i class="ri-edit-2-line text-xl" />
              </button>
            </div>

            <!-- Kanan: info + deskripsi -->
            <div class="flex flex-col flex-1 min-w-0 p-8 lg:p-10 overflow-hidden">

              <!-- Judul & subtitle -->
              <div class="mb-5">
                <h2 class="text-xl lg:text-2xl font-bold dark:text-white text-gray-900 leading-snug mb-2">
                  {{ currentTrack?.title }}
                </h2>
                <!-- <p class="text-base lg:text-base dark:text-gray-400 text-gray-500 mt-1">
                  {{ currentTrack?.channel_name ?? currentTrack?.subtitle ?? '' }}
                </p> -->
                <span class="text-base font-semibold px-3 py-1.5 rounded-full" :class="{
                  'bg-yellow-500/20 text-yellow-300': currentTrack?.channel_name === 'SD',
                  'bg-blue-500/20 text-blue-300': currentTrack?.channel_name === 'SMP',
                  'bg-purple-600/20 text-purple-300': currentTrack?.channel_name === 'SMA',
                  'bg-red-500/20 text-red-300': currentTrack?.channel_name === 'SMK',
                }">
                  {{ currentTrack?.channel_name ?? '-' }}
                </span>
              </div>

              <!-- Badge mode aktif -->
              <div class="mb-4">
                <span v-if="currentTrack?.type === 'lagu'" class="text-xs font-semibold px-3 py-1.5 rounded-full"
                  :class="'bg-blue-500/20 text-blue-500'">
                  Lagu Edukasi
                </span>
                <span v-else-if="!currentTrack?.audio_url && !currentTrack?.podcast_url"
                  class="text-xs font-semibold px-3 py-1.5 rounded-full" :class="'bg-gray-500/20 text-gray-500'">
                  Teks
                </span>
                <span v-else class="text-xs font-semibold px-3 py-1.5 rounded-full" :class="activeTab === 'podcast'
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-blue-500/20 text-blue-500'">
                  {{ activeTab === 'podcast' ? '🎙 Mode Podcast' : '🎧 Mode Insight' }}
                </span>
              </div>

              <!-- Deskripsi dengan highlight (hanya insight/audio) -->
              <div v-if="activeTab === 'insight' && currentTrack?.isi"
                class="flex-1 overflow-y-auto pr-1 mb-4 scroll-smooth scrollbar-hide" ref="lyricsContainer">
                <p class="leading-loose" style="word-break: keep-all; overflow-wrap: break-word;">
                  <template v-for="(word, index) in isiWords" :key="index">
                    <span
                      class="text-xl lg:text-2xl font-bold transition-all duration-500 cursor-default select-none inline"
                      :class="isCurrentTrackPlaying && !playerStore.isPreview && (index as number) === currentWordIndex
                        ? 'dark:text-white text-gray-900 bg-brand-red dark:bg-brand-green'
                        : isCurrentTrackPlaying && !playerStore.isPreview
                          && (index as number) > (currentWordIndex - 4)
                          && (index as number) < currentWordIndex
                          && playerStore.isPlaying
                          ? 'dark:text-white text-gray-900 bg-brand-red/50 dark:bg-brand-green/50'
                          : isCurrentTrackPlaying && (index as number) < currentWordIndex
                            ? 'dark:text-gray-600 text-gray-300'
                            : 'dark:text-gray-400 text-gray-500'"
                      :ref="(el) => { if ((index as number) === currentWordIndex) activeWordEl = el as HTMLElement }">
                      {{ word }}
                    </span>{{ ' ' }}
                  </template>
                </p>
              </div>

              <!-- Fallback -->
              <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 text-center mb-4">

                <!-- Animasi podcast saat playing -->
                <div v-if="currentTrack?.type === 'lagu' && playerStore.isPlaying"
                  class="flex flex-col items-center gap-4">
                  <div class="relative w-24 h-24 flex items-center justify-center">
                    <!-- Ring animasi -->
                    <div class="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
                    <div class="absolute inset-2 rounded-full bg-blue-500/15 animate-ping [animation-delay:0.3s]" />
                    <div class="absolute inset-4 rounded-full bg-blue-500/20 animate-ping [animation-delay:0.6s]" />
                    <!-- Icon tengah -->
                    <div
                      class="relative w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                      <i class="ri-volume-up-line text-3xl text-blue-500" />
                    </div>
                  </div>

                  <!-- Sound bars -->
                  <div class="flex items-end gap-1.5 h-10">
                    <div v-for="i in 7" :key="i" class="w-2 rounded-full bg-blue-500" :style="{
                      height: `${[60, 85, 45, 100, 55, 80, 40][i - 1]}%`,
                      animation: `soundBar 0.8s ease-in-out infinite alternate`,
                      animationDelay: `${(i - 1) * 0.1}s`
                    }" />
                  </div>

                  <p class="text-base font-medium dark:text-blue-400 text-blue-600">Lagu sedang diputar</p>
                </div>

                <!-- Idle podcast (tidak playing) -->
                <div v-else-if="currentTrack?.type === 'lagu'" class="flex flex-col items-center gap-3">
                  <div class="w-16 h-16 rounded-full dark:bg-zinc-800 bg-gray-100 flex items-center justify-center">
                    <i class="ri-volume-up-line text-3xl dark:text-gray-600 text-gray-400" />
                  </div>
                  <p class="text-base dark:text-gray-500 text-gray-400">Tekan play untuk memulai lagu</p>
                </div>

                <div v-else-if="activeTab === 'podcast' && playerStore.isPlaying"
                  class="flex flex-col items-center gap-4">
                  <div class="relative w-24 h-24 flex items-center justify-center">
                    <!-- Ring animasi -->
                    <div class="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />
                    <div class="absolute inset-2 rounded-full bg-green-500/15 animate-ping [animation-delay:0.3s]" />
                    <div class="absolute inset-4 rounded-full bg-green-500/20 animate-ping [animation-delay:0.6s]" />
                    <!-- Icon tengah -->
                    <div
                      class="relative w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                      <i class="ri-mic-fill text-3xl text-green-500" />
                    </div>
                  </div>

                  <!-- Sound bars -->
                  <div class="flex items-end gap-1.5 h-10">
                    <div v-for="i in 7" :key="i" class="w-2 rounded-full bg-green-500" :style="{
                      height: `${[60, 85, 45, 100, 55, 80, 40][i - 1]}%`,
                      animation: `soundBar 0.8s ease-in-out infinite alternate`,
                      animationDelay: `${(i - 1) * 0.1}s`
                    }" />
                  </div>

                  <p class="text-base font-medium dark:text-green-400 text-green-600">Podcast sedang diputar</p>
                </div>

                <!-- Idle podcast (tidak playing) -->
                <div v-else-if="activeTab === 'podcast'" class="flex flex-col items-center gap-3">
                  <div class="w-16 h-16 rounded-full dark:bg-zinc-800 bg-gray-100 flex items-center justify-center">
                    <i class="ri-mic-2-line text-2xl dark:text-gray-600 text-gray-400" />
                  </div>
                  <p class="text-base dark:text-gray-500 text-gray-400">Tekan play untuk memulai podcast</p>
                </div>

                <!-- Tidak ada deskripsi (insight) -->
                <div v-else class="flex flex-col items-center gap-3">
                  <div class="w-16 h-16 rounded-full dark:bg-zinc-800 bg-gray-100 flex items-center justify-center">
                    <i class="ri-music-2-line text-2xl dark:text-gray-600 text-gray-400" />
                  </div>
                  <p class="text-base dark:text-gray-500 text-gray-400">Tidak ada deskripsi</p>
                </div>

              </div>

              <!-- Progress bar -->
              <!-- <div v-if="currentTrack?.audio_url || currentTrack?.podcast_url" class="mb-3">
                <div class="relative h-2 dark:bg-gray-700 bg-gray-300 rounded-full mb-3" :class="isPreviewMode || !isCurrentTrackPlaying
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer group'" @click="!isPreviewMode && isCurrentTrackPlaying ? seek($event) : null">
                  <div class="h-2 bg-brand-red dark:bg-brand-green rounded-full transition-all"
                    :style="{ width: isCurrentTrackPlaying ? progressPercent + '%' : '0%' }" />
                  <div class="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow opacity-0 
           group-hover:opacity-100 transition-opacity" :style="{
            left: isCurrentTrackPlaying ? progressPercent + '%' : '0%',
            transform: 'translate(-50%, -50%)'
          }" />
                </div>
                <div class="flex justify-between">
                  <span class="text-sm dark:text-gray-500 text-gray-400">
                    {{ isCurrentTrackPlaying ? playerStore.formatDuration(playerStore.currentTime) : '00:00' }}
                  </span>
                  <span class="text-sm dark:text-gray-500 text-gray-400">
                    {{ activeTab === 'podcast' ? currentTrack?.duration_podcast : currentTrack?.duration ?? '00:00' }}
                  </span>
                </div>
              </div> -->

              <!-- Progress bar -->
              <div v-if="currentTrack?.audio_url || currentTrack?.podcast_url" class="mb-3">
                <div class="relative h-2 dark:bg-gray-700 bg-gray-300 rounded-full mb-3 group" :class="isPreviewMode || !isCurrentTrackPlaying
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer'" @mousedown="isPreviewMode || !isCurrentTrackPlaying ? null : onSeekStart()"
                  @click="isPreviewMode || !isCurrentTrackPlaying ? null : seek($event)">

                  <!-- Progress fill — tanpa transition -->
                  <div class="h-2 bg-brand-red dark:bg-brand-green rounded-full transition-none"
                    :style="{ width: isCurrentTrackPlaying ? progressPercent + '%' : '0%' }" />

                  <!-- Dot -->
                  <div
                    class="absolute w-4 h-4 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    :style="{
                      top: '50%',
                      left: isCurrentTrackPlaying ? progressPercent + '%' : '0%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }" />
                </div>

                <div class="flex justify-between">
                  <span class="text-sm dark:text-gray-500 text-gray-400">
                    {{ isCurrentTrackPlaying ? playerStore.formatDuration(playerStore.currentTime) : '00:00' }}
                  </span>
                  <span class="text-sm dark:text-gray-500 text-gray-400">
                    {{ activeTab === 'podcast' ? currentTrack?.duration_podcast : currentTrack?.duration ?? '00:00' }}
                  </span>
                </div>
              </div>

              <!-- Controls -->
              <div v-if="currentTrack?.audio_url || currentTrack?.podcast_url"
                class="flex items-center justify-center gap-8">

                <!-- Repeat button -->
                <button @click="playerStore.toggleRepeat()" :disabled="isPreviewMode" class="transition-colors" :class="[
                  isPreviewMode
                    ? 'opacity-30 cursor-not-allowed text-gray-500'
                    : playerStore.isRepeat
                      ? 'text-brand-red dark:text-brand-green'
                      : 'dark:text-gray-400 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                ]">
                  <i class="ri-repeat-one-line text-2xl" />
                </button>

                <!-- Prev button -->
                <button :disabled="!playerStore.hasPrev || isPreviewMode"
                  class="transition-colors disabled:opacity-30 disabled:cursor-not-allowed" :class="isPreviewMode
                    ? 'text-gray-500'
                    : 'dark:text-gray-400 text-gray-500 hover:text-gray-900 dark:hover:text-white'"
                  @click="playerStore.prevTrack()">
                  <i class="ri-skip-back-fill text-4xl" />
                </button>

                <!-- Play/Pause button — TIDAK di-disable, ini yang tetap aktif -->
                <button @click="handlePlayButton" class="w-16 h-16 rounded-full bg-white flex items-center justify-center 
         text-gray-700 shadow-lg hover:scale-105 transition-transform">
                  <i :class="isCurrentTrackPlaying && playerStore.isPlaying
                    ? 'ri-pause-fill'
                    : 'ri-play-fill'" class="text-4xl" />
                </button>

                <!-- Next button -->
                <button @click="playerStore.nextTrack()" :disabled="!playerStore.hasNext || isPreviewMode"
                  class="transition-colors disabled:opacity-30 disabled:cursor-not-allowed" :class="isPreviewMode
                    ? 'text-gray-500'
                    : 'dark:text-gray-400 text-gray-500 hover:text-gray-900 dark:hover:text-white'">
                  <i class="ri-skip-forward-fill text-4xl" />
                </button>

                <!-- Stop button -->
                <button @click="playerStore.stop()" :disabled="isPreviewMode" class="transition-colors" :class="isPreviewMode
                  ? 'opacity-30 cursor-not-allowed text-gray-500'
                  : 'dark:text-gray-400 text-gray-500 hover:text-gray-900 dark:hover:text-white'">
                  <i class="ri-stop-fill text-2xl" />
                </button>

              </div>

              <div v-if="currentTrack?.type !== 'lagu'" class="flex justify-between items-center gap-2 mt-4">
                <button v-if="currentTrack" @click="showReportModal = true"
                  class="px-3 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500/40"
                  title="Laporkan konten ini">
                  <i class="ri-flag-2-line" /> Report
                </button>
                <div v-else />

                <div class="flex gap-2">
                <button v-if="currentTrack?.audio_url"
                  @click="() => { if (!isPreviewMode) { isUserTabSwitch = true; activeTab = 'insight' } }"
                  :disabled="isPreviewMode" class="px-4 py-2 rounded-full text-xs font-bold transition-all border"
                  :class="isPreviewMode
                    ? 'opacity-40 cursor-not-allowed border-gray-300 dark:border-zinc-600 text-gray-400'
                    : activeTab === 'insight'
                      ? 'bg-blue-500 border-blue-500 text-white shadow'
                      : 'border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'">
                  🎧 Insight
                </button>

                <button v-if="currentTrack?.podcast_url"
                  @click="() => { if (!isPreviewMode) { isUserTabSwitch = true; activeTab = 'podcast' } }"
                  :disabled="isPreviewMode" class="px-4 py-2 rounded-full text-xs font-bold transition-all border"
                  :class="isPreviewMode
                    ? 'opacity-40 cursor-not-allowed border-gray-300 dark:border-zinc-600 text-gray-400'
                    : activeTab === 'podcast'
                      ? 'bg-green-500 border-green-500 text-white shadow'
                      : 'border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'">
                  🎙 Podcast
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- <Teleport to="body">
          <Transition name="fade">
            <div v-if="showImagePreview" class="fixed inset-0 z-[99999] flex flex-col bg-white">

              <div class="flex items-center gap-3 px-4 py-2 bg-gray-100 border-b border-gray-200 shrink-0">

                <div class="flex items-center gap-2">
                  <button v-for="color in colors" :key="color" :style="{ background: color }"
                    :class="['w-7 h-7 rounded-full border-2 transition-all', selectedColor === color ? 'border-gray-800 scale-110' : 'border-transparent']"
                    @click="selectedColor = color" />
                </div>

                <div class="w-px h-6 bg-gray-300" />

                <div class="flex items-center gap-2">
                  <button v-for="size in brushSizes" :key="size"
                    :class="['rounded-full bg-gray-800 transition-all', selectedSize === size ? 'ring-2 ring-blue-500 ring-offset-1' : '']"
                    :style="{ width: size + 'px', height: size + 'px' }" @click="selectedSize = size" />
                </div>

                <div class="w-px h-6 bg-gray-300" />

                <button
                  :class="['px-3 py-1 rounded text-sm font-medium transition-colors', drawingMode === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700']"
                  @click="drawingMode = 'draw'">
                  <i class="ri-pencil-line mr-1" /> Gambar
                </button>
                <button
                  :class="['px-3 py-1 rounded text-sm font-medium transition-colors', drawingMode === 'erase' ? 'bg-red-400 text-white' : 'bg-gray-200 text-gray-700']"
                  @click="drawingMode = 'erase'">
                  <i class="ri-eraser-line mr-1" /> Hapus
                </button>

                <div class="w-px h-6 bg-gray-300" />

                <button
                  class="px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  @click="clearCanvas">
                  <i class="ri-delete-bin-line mr-1" /> Bersihkan
                </button>

                <button
                  class="px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  @click="undoCanvas">
                  <i class="ri-arrow-go-back-line mr-1" /> Undo
                </button>

                <button
                  class="px-3 py-1 rounded text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  @click="downloadCanvas">
                  <i class="ri-download-line mr-1" /> Download
                </button>

                <div class="flex-1" />

                <button
                  class="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  @click="showImagePreview = false">
                  <i class="ri-close-line text-xl text-gray-700" />
                </button>
              </div>

              <div class="relative flex-1 overflow-hidden flex items-center justify-center bg-white">
                <img ref="bgImage" :src="currentTrack?.image_url" :alt="currentTrack?.title"
                  class="absolute max-w-full max-h-full object-contain select-none pointer-events-none"
                  @load="onImageLoad" />
                <canvas ref="canvasPreviewRef" class="absolute inset-0 touch-none w-full h-full"
                  :style="{ cursor: drawingMode === 'erase' ? 'cell' : 'crosshair' }" @mousedown="startDraw"
                  @mousemove="draw" @mouseup="stopDraw" @mouseleave="stopDraw" @touchstart.prevent="startDrawTouch"
                  @touchmove.prevent="drawTouch" @touchend="stopDraw" />
              </div>

            </div>
          </Transition>
        </Teleport> -->
        <Teleport to="body">
          <Transition name="fade">
            <div v-if="showImagePreview"
              class="fixed inset-0 z-[99999] flex items-center bg-black/80 transition-all duration-300"
              :class="isToolPanelOpen || imagePosition === 'center' ? 'justify-center' : 'justify-start'"
              @click="showImagePreview = false">

              <!-- Konten besar: gambar (mode normal) ATAU panel tools (saat salah satu tombol aktif).
                   Disatukan dalam SATU Transition mode="out-in" supaya keduanya tidak pernah tampil
                   bersamaan sebagai flex sibling — itu penyebab animasi "lompat ke kanan dulu baru ke
                   tengah" sebelumnya (dua elemen sama-sama ikut layout flex saat crossfade). -->
              <Transition name="big-content" mode="out-in">
                <div v-if="!isToolPanelOpen && imagePosition !== 'minimized'" key="large"
                  class="relative transition-all duration-300 z-10"
                  :class="imagePosition === 'left' ? 'ml-8 lg:ml-16' : ''" @click.stop>

                  <!-- Slider -->
                  <div class="relative overflow-hidden rounded-lg">
                    <img :src="previewImages[currentImageIndex]" :alt="currentTrack?.title"
                      class="max-w-[80vw] lg:max-w-[60vw] max-h-[85vh] object-contain select-none transition-opacity duration-300" />

                    <!-- Tombol prev -->
                    <button v-if="previewImages.length > 1"
                      class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                      @click="prevImage">
                      <i class="ri-arrow-left-s-line text-2xl" />
                    </button>

                    <!-- Tombol next -->
                    <button v-if="previewImages.length > 1"
                      class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                      @click="nextImage">
                      <i class="ri-arrow-right-s-line text-2xl" />
                    </button>

                    <!-- Dots indicator -->
                    <div v-if="previewImages.length > 1"
                      class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      <button v-for="(img, idx) in previewImages" :key="idx"
                        class="rounded-full transition-all duration-200"
                        :class="idx === currentImageIndex ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'"
                        @click="currentImageIndex = idx" />
                    </div>

                    <!-- Counter -->
                    <div v-if="previewImages.length > 1"
                      class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
                      {{ currentImageIndex + 1 }} / {{ previewImages.length }}
                    </div>
                  </div>

                  <!-- Tombol-tombol posisi -->
                  <div class="absolute top-2 right-2 flex gap-2">
                    <!-- Ke tengah -->
                    <button v-if="imagePosition === 'left'"
                      class="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                      @click="imagePosition = 'center'" title="Ke tengah">
                      <i class="ri-align-center text-lg" />
                    </button>

                    <!-- Ke kiri -->
                    <button v-if="imagePosition === 'center'"
                      class="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                      @click="imagePosition = 'left'" title="Ke kiri">
                      <i class="ri-align-left text-lg" />
                    </button>

                    <!-- Minimize -->
                    <button
                      class="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                      @click="imagePosition = 'minimized'" title="Perkecil">
                      <i class="ri-collapse-diagonal-line text-lg" />
                    </button>
                  </div>
                </div>

                <!-- Slide — 4 gambar square (spec dari bos), tampil besar seperti gambar default,
                     bukan di dalam card panel, ditambah tombol close + prev/next slide -->
                <div v-else-if="activeToolPanel === 'slide'" key="slide-view" class="relative" @click.stop>
                  <div v-if="displaySlides.length" class="relative overflow-hidden rounded-lg">
                    <img :src="displaySlides[currentSlideIndex]" :alt="`Slide ${currentSlideIndex + 1}`"
                      class="w-[min(80vw,70vh)] aspect-square object-cover select-none transition-opacity duration-300" />

                    <!-- Tombol prev -->
                    <button v-if="displaySlides.length > 1"
                      class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                      @click="prevSlide">
                      <i class="ri-arrow-left-s-line text-2xl" />
                    </button>

                    <!-- Tombol next -->
                    <button v-if="displaySlides.length > 1"
                      class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                      @click="nextSlide">
                      <i class="ri-arrow-right-s-line text-2xl" />
                    </button>

                    <!-- Dots indicator -->
                    <div v-if="displaySlides.length > 1"
                      class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      <button v-for="(s, idx) in displaySlides" :key="idx"
                        class="rounded-full transition-all duration-200"
                        :class="idx === currentSlideIndex ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'"
                        @click="currentSlideIndex = idx" />
                    </div>

                    <!-- Counter -->
                    <div v-if="displaySlides.length > 1"
                      class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
                      {{ currentSlideIndex + 1 }} / {{ displaySlides.length }}
                    </div>
                  </div>

                  <!-- Empty state -->
                  <div v-else
                    class="w-[min(80vw,70vh)] aspect-square rounded-lg dark:bg-zinc-800 bg-gray-100 flex items-center justify-center">
                    <p class="text-xs dark:text-gray-500 text-gray-400 italic">
                      Belum ada slide tambahan untuk konten ini.
                    </p>
                  </div>

                  <!-- Tombol close -->
                  <button
                    class="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                    @click="activeToolPanel = null" title="Tutup">
                    <i class="ri-close-line text-lg" />
                  </button>
                </div>

                <!-- Panel tools — jadi konten utama saat salah satu tombol aktif -->
                <div v-else-if="activeToolPanel" key="panel"
                  class="relative z-10 w-full sm:w-[26rem] max-w-[85vw] max-h-[80vh] rounded-2xl dark:bg-zinc-900 bg-white shadow-2xl overflow-hidden flex flex-col"
                  @click.stop>

                  <!-- Header panel + tombol close -->
                  <div
                    class="flex items-center justify-between px-4 py-3 border-b dark:border-zinc-800 border-gray-100 flex-shrink-0">
                    <h3 class="text-xs font-black dark:text-white text-gray-900 flex items-center gap-1.5">
                      <i :class="toolButtons.find(t => t.key === activeToolPanel)?.icon" />
                      {{ toolButtons.find(t => t.key === activeToolPanel)?.label }}
                    </h3>
                    <button @click="activeToolPanel = null"
                      class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-800 bg-gray-100 hover:opacity-80 transition-opacity">
                      <i class="ri-close-line text-sm dark:text-gray-400 text-gray-500" />
                    </button>
                  </div>

                  <Transition name="fade" mode="out-in">
                    <div class="overflow-y-auto scrollbar-hide p-4 flex-1" :key="activeToolPanel">

                      <!-- Question -->
                      <template v-if="activeToolPanel === 'question'">
                        <div v-if="displayQuestions.length" class="space-y-2.5">
                          <div v-for="(q, i) in displayQuestions" :key="i"
                            class="p-4 rounded-2xl border dark:bg-gradient-to-br dark:from-[#1b2560] dark:to-[#10173a] dark:border-indigo-800/40 bg-gray-50 border-gray-100">
                            <div class="flex items-start justify-between gap-2 mb-2">
                              <p class="text-xs font-bold dark:text-white text-gray-900 flex-1">{{ q.question }}</p>
                              <button @click="speak(`q-question-${i}`, q.question)"
                                class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                                :class="speakingKey === `q-question-${i}` ? 'bg-brand-green text-white' : 'dark:bg-indigo-900/60 bg-gray-200 dark:text-indigo-200 text-gray-500 hover:opacity-80'"
                                title="Bacakan pertanyaan">
                                <i class="text-xs" :class="speakingKey === `q-question-${i}` ? 'ri-volume-up-fill' : 'ri-volume-up-line'" />
                              </button>
                            </div>
                            <button v-if="!revealedAnswers.has(i)" @click="toggleAnswer(i)"
                              class="text-[10px] font-bold text-amber-500 dark:text-amber-400 hover:underline">
                              Tampilkan Jawaban
                            </button>
                            <div v-else class="flex items-start justify-between gap-2">
                              <p class="text-xs dark:text-indigo-100 text-gray-600 flex-1">{{ q.answer }}</p>
                              <button @click="speak(`q-answer-${i}`, q.answer)"
                                class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                                :class="speakingKey === `q-answer-${i}` ? 'bg-brand-green text-white' : 'dark:bg-indigo-900/60 bg-gray-200 dark:text-indigo-200 text-gray-500 hover:opacity-80'"
                                title="Bacakan jawaban">
                                <i class="text-xs" :class="speakingKey === `q-answer-${i}` ? 'ri-volume-up-fill' : 'ri-volume-up-line'" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p v-else class="text-xs dark:text-gray-500 text-gray-400 italic">
                          Belum ada pertanyaan untuk konten ini.
                        </p>
                      </template>

                      <!-- Quiz -->
                      <template v-else-if="activeToolPanel === 'quiz'">
                        <div v-if="displayQuiz.length" class="space-y-3">
                          <div v-for="(q, qi) in displayQuiz" :key="qi"
                            class="p-4 rounded-2xl border dark:bg-gradient-to-br dark:from-[#1b2560] dark:to-[#10173a] dark:border-indigo-800/40 bg-gray-50 border-gray-100">
                            <div class="flex items-start justify-between gap-2 mb-3">
                              <p class="text-xs font-bold dark:text-white text-gray-900 flex-1">{{ q.question }}</p>
                              <button @click="speak(`quiz-${qi}`, quizSpeechText(q))"
                                class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                                :class="speakingKey === `quiz-${qi}` ? 'bg-brand-green text-white' : 'dark:bg-indigo-900/60 bg-gray-200 dark:text-indigo-200 text-gray-500 hover:opacity-80'"
                                title="Bacakan soal & pilihan jawaban">
                                <i class="text-xs" :class="speakingKey === `quiz-${qi}` ? 'ri-volume-up-fill' : 'ri-volume-up-line'" />
                              </button>
                            </div>
                            <div class="space-y-2">
                              <button v-for="(opt, oi) in q.options" :key="oi" @click="selectQuizOption(qi, oi)"
                                class="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border transition-colors"
                                :class="quizOptionClasses[quizOptionState(qi, oi, q.correct_index)]">
                                <span class="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                  :class="quizBadgeClasses[quizOptionState(qi, oi, q.correct_index)]">
                                  {{ String.fromCharCode(65 + oi) }}
                                </span>
                                <span class="text-xs flex-1">{{ opt }}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <p v-else class="text-xs dark:text-gray-500 text-gray-400 italic">
                          Belum ada quiz untuk konten ini.
                        </p>
                      </template>

                      <!-- Projek -->
                      <template v-else-if="activeToolPanel === 'projek'">
                        <div v-if="displayProject"
                          class="p-4 rounded-2xl border dark:bg-gradient-to-br dark:from-[#1b2560] dark:to-[#10173a] dark:border-indigo-800/40 bg-gray-50 border-gray-100">
                          <p class="text-xs dark:text-indigo-100 text-gray-600 leading-relaxed">
                            {{ displayProject }}
                          </p>
                        </div>
                        <p v-else class="text-xs dark:text-gray-500 text-gray-400 italic">
                          Belum ada projek untuk konten ini.
                        </p>
                      </template>

                    </div>
                  </Transition>
                </div>
              </Transition>

              <!-- Thumbnail kecil: manual-minimize atau otomatis saat panel tools aktif -->
              <Transition name="image-move">
                <div v-if="!isToolPanelOpen && imagePosition === 'minimized'" key="small" class="absolute top-4 left-4 z-20 group" @click.stop>
                  <img :src="previewImages[currentImageIndex]" :alt="currentTrack?.title"
                    class="w-32 h-32 object-cover rounded-lg shadow-lg border-2 border-white select-none" />

                  <!-- Counter kecil -->
                  <div v-if="previewImages.length > 1"
                    class="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">
                    {{ currentImageIndex + 1 }}/{{ previewImages.length }}
                  </div>

                  <button
                    class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                    @click="imagePosition = 'center'" title="Perbesar">
                    <i class="ri-expand-diagonal-line text-sm" />
                  </button>
                </div>

                <!-- Gambar kecil otomatis di pojok kiri atas — saat salah satu panel tools aktif -->
                <div v-else-if="isToolPanelOpen" key="tool-thumb" class="absolute top-4 left-4 z-20" @click.stop>
                  <img :src="previewImages[currentImageIndex]" :alt="currentTrack?.title"
                    class="w-20 h-20 object-cover rounded-lg shadow-lg border-2 border-white select-none" />
                </div>
              </Transition>

              <!-- Toolbar Question / Quiz / Slide / Projek — di pojok kanan bawah agar mudah dijangkau guru -->
              <div class="absolute bottom-4 right-4 z-30 flex items-center gap-2" @click.stop>
                <button v-for="tool in toolButtons" :key="tool.key" @click="toggleToolPanel(tool.key)"
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                  :class="activeToolPanel === tool.key ? 'bg-brand-green' : 'bg-black/50 hover:bg-black/70'"
                  :title="tool.label">
                  <i :class="tool.icon" class="text-lg" />
                </button>
              </div>

              <!-- Tombol close overlay keseluruhan -->
              <button
                class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-40"
                @click="showImagePreview = false">
                <i class="ri-close-line text-2xl" />
              </button>

            </div>
          </Transition>
        </Teleport>

        <!-- Report Konten -->
        <ReportKontenModal v-model="showReportModal" />
      </div>

    </Transition>
  </Teleport>
</template>

<style>
@keyframes soundBar {
  from {
    transform: scaleY(0.3);
  }

  to {
    transform: scaleY(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.player-enter-active,
.player-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.player-enter-from,
.player-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-active .relative,
.slide-up-leave-active .relative {
  transition: transform 0.3s ease;
}

.slide-up-enter-from .relative,
.slide-up-leave-to .relative {
  transform: translateY(100%);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}

.image-move-enter-active,
.image-move-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.image-move-enter-from,
.image-move-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.big-content-enter-active,
.big-content-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.big-content-enter-from,
.big-content-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
</style>