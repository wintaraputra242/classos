// ===== AUTH =====
export type Jenjang = 'SD' | 'SMP' | 'SMA' | 'SMK'

export interface Token {
  code: string
  jenjang: Jenjang
  expiresAt: string
  schoolName?: string
  teacherName?: string
  id_user?: number   // SpeedQ user ID (dari API)
}

// ===== API: CHANNEL =====
// ✅ Field disesuaikan dengan response terbaru backend classos-beta — field
// lama (nama_channel, deskripsi) sudah tidak dipakai lagi, diganti nama &
// description. Bukti: object "selectedChannel" di response v1/getStikernews
// sekarang berbentuk { id_channel, nama, description, category }.
export interface Channel {
  id_channel: number
  nama: string
  description?: string
  category?: number
  is_hotnews?: number
  thumbnail?: string
}

// ===== API: LONCENG / KONTEN =====
export interface LoncengItem {
  id: number | string
  id_lonceng?: number
  id_stikernews: number
  id_channel: number
  title: string
  subtitle?: string
  emoji?: string
  link?: string           // URL audio/video
  duration?: string           // URL audio/video
  duration_podcast?: string           // URL audio/video
  thumbnail?: string
  durasi?: string
  podcast_durasi?: string
  audio_url?: string
  podcast_url?: string
  image_url?: string
  isi?: string
  jenis?: number          // 1=audio, 2=video, dll
  created_at?: string
  currentTime?: number | string
  channel_name?: string
  isPlaying?: boolean,
  isFavorite?: boolean,
}

// ===== API: SETTING =====
export interface StikerNewsSetting {
  auto_play: number        // 0 | 1
  play_mode: number        // 0=normal, 1=random
}

// ===== API: ANALYTICS =====
export interface AnalyticsItem {
  id_stikernews: number
  judul?: string
  total_play?: number
  duration?: number
  id_channel?: number
}

// ===== INTERNAL CONTENT (fallback/local) =====
export type ContentType = 'stikernews' | 'lagu' | 'karakter' | 'habit'

export interface Content {
  id: string
  type: ContentType
  title: string
  description: string
  thumbnail?: string
  emoji?: string
  jenjang: Jenjang[]
  duration?: string
  views?: number
  isFavorite?: boolean
  audioUrl?: string
  category?: string
  publishedAt: string
}

export interface LaguEdukasi extends Content {
  type: 'lagu'
  artist?: string
}

export interface KarakterItem {
  id: string
  emoji: string
  title: string
  description: string
  bgClass: string
  category: string
}

// ===== PLAYER =====
export interface PlayerTrack {
  id: string
  id_stikernews?: number    // untuk log API
  id_channel?: number       // untuk log API
  title: string
  subtitle: string
  emoji: string
  duration: string
  duration_podcast: string
  currentTime: number
  channel_name: string
  type?: string
  audio_url: string
  podcast_url: string
  image_url: string
  isi: string
  isPlaying: boolean
  isFavorite: boolean
  link?: string             // URL stream
  // ===== TOOLS KONTEN: Question / Quiz / Slide / Projek =====
  // Sudah dalam bentuk ter-parse & ter-mapping (lihat parseContentTools di
  // helpers/index.ts) — field mentah dari API (pertanyaan, quiz, project,
  // slide_urls) berupa string JSON ber-Bahasa Indonesia, BEDA bentuk dari
  // tipe-tipe di bawah ini.
  questions?: ContentQuestion[]
  quiz?: ContentQuiz[]
  slides?: string[]
  project?: ContentProject
}

export interface ContentQuestion {
  question: string
  answer: string
}

export interface ContentQuiz {
  question: string
  options: string[]
  correct_index: number
  explanation?: string
}

/** Field mengikuti struktur asli "project" dari API (judul→title, dst),
 *  lihat parseContentTools di helpers/index.ts untuk mapping-nya. */
export interface ContentProject {
  title: string
  objective?: string         // dari "tujuan"
  description?: string       // dari "deskripsi"
  steps?: string[]           // dari "langkah"
  tools?: string[]           // dari "alat_bahan"
  result?: string            // dari "hasil_akhir"
  duration?: string          // dari "estimasi_waktu"
  successCriteria?: string[] // dari "kriteria_keberhasilan"
}

// ===== SESI KELAS =====
export type StepKey = 'briefing' | 'listening' | 'summary' | 'endclass'

// ===== APP STATE =====
export type ThemeMode = 'dark' | 'light'
export type ActiveMenu = 'beranda' | 'stikernews' | 'lagu' | 'karakter' | 'favorite'
export type ActiveSidebar = 'beranda' | 'stikernews' | 'lagu' | 'karakter' | 'literasi' | 'dengar' | 'pahami' | 'tulis' | 'playlist'
