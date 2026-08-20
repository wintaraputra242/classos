// ===== API: ENVELOPE =====
/** Bentuk umum response backend: payload di `data` atau `items`, field lain bervariasi per endpoint. */
export interface ApiEnvelope<T = unknown> {
  success?: boolean
  message?: string
  data?: T
  items?: T
  [key: string]: unknown
}

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

/** Payload `data` dari POST /v1/scan-uniq-id — guru yang terhubung lewat scan QR/kode */
export interface ScanUniqIdData {
  name: string
  photo: string
  token: string
  user_id: string
}

/** Response dari POST /v1/login */
export interface LoginApiResponse extends ApiEnvelope {
  data?: {
    name_site?: string
    logo_site?: string
    isTrial?: boolean
    expired_at?: string
    sisa_hari_aktif?: string
    tokens: { accessToken: string; refreshToken: string }
  }
}

// ===== API: CHANNEL =====
export interface Channel {
  id_channel: number
  nama_channel: string
  deskripsi?: string
  jenjang?: string
  thumbnail?: string
}

// ===== API: LONCENG / KONTEN =====
/**
 * Item konten dari endpoint getStikernews / Show_Favorite_List / Show_Playlist.
 * Nama field mengikuti response API asli (Bahasa Indonesia) — lihat mapToPlayerTrack
 * di masing-masing view untuk konversi ke PlayerTrack (field bahasa Inggris).
 */
export interface LoncengItem {
  /** Primary key dari API (dipakai untuk key list & cursor pagination) */
  id_lonceng: number
  judul: string
  isi?: string
  gambar_url?: string
  audio_url?: string
  podcast_url?: string
  durasi?: string
  podcast_durasi?: string
  waktu?: string
  /** id_channel */
  channel: number
  // ===== TOOLS KONTEN: Question / Quiz / Slide / Projek =====
  // Semua optional — belum dikirim backend, UI fallback ke empty state
  questions?: ContentQuestion[]
  quiz?: ContentQuiz[]
  slides?: string[]
  project?: string
}

export interface ContentQuestion {
  question: string
  answer: string
}

export interface ContentQuiz {
  question: string
  options: string[]
  correct_index: number
}

/** Response dari fetchLoncengWithLink — payload utama + lagu edukasi hari ini */
export interface LoncengApiResponse extends ApiEnvelope<LoncengItem[]> {
  edukasiSongs?: EdukasiSong[]
}

// ===== API: WILAYAH (form trial) =====
export interface ProvinsiItem {
  id_prov: string | number
  prov: string
}

export interface KabupatenItem {
  id_kab: string | number
  kab: string
}

// ===== API: PLAYLIST =====
export interface PlaylistItem {
  id: number
  name: string
  content_count: number
  thumbnail_url?: string
  thumbnail_title?: string
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

/** Lagu edukasi (endpoint terpisah dari LoncengItem, field API dalam Bahasa Indonesia) */
export interface EdukasiSong {
  id: string | number
  judul?: string
  isi?: string
  img_url?: string
  url_audio?: string
  durasi?: string
  podcast_durasi?: string
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
  questions?: ContentQuestion[]
  quiz?: ContentQuiz[]
  slides?: string[]
  project?: string
}

// ===== CLASS SESSION (alur briefing → listening → summary → end class) =====
export type StepKey = 'briefing' | 'listening' | 'summary' | 'endclass'
export type StepStatusVal = 'locked' | 'active' | 'done'

// ===== APP STATE =====
export type ThemeMode = 'dark' | 'light'
export type ActiveMenu = 'beranda' | 'stikernews' | 'lagu' | 'karakter' | 'favorite'
export type ActiveSidebar = 'beranda' | 'stikernews' | 'lagu' | 'karakter' | 'literasi' | 'dengar' | 'pahami' | 'tulis' | 'playlist'
