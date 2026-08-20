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
export interface Channel {
  id_channel: number
  nama_channel: string
  deskripsi?: string
  jenjang?: string
  thumbnail?: string
}

// ===== API: LONCENG / KONTEN =====
export interface LoncengItem {
  id: number | string
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
  questions?: ContentQuestion[]
  quiz?: ContentQuiz[]
  slides?: string[]
  project?: string
}

// ===== APP STATE =====
export type ThemeMode = 'dark' | 'light'
export type ActiveMenu = 'beranda' | 'stikernews' | 'lagu' | 'karakter' | 'favorite'
export type ActiveSidebar = 'beranda' | 'stikernews' | 'lagu' | 'karakter' | 'literasi' | 'dengar' | 'pahami' | 'tulis' | 'playlist'
