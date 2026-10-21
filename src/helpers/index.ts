import type { ContentQuestion, ContentQuiz, ContentProject } from '@/types'

// Di file getAudioDuration — pastikan cache ini singleton, tidak dibuat ulang setiap call

const _durationCache = new Map<string, string>()

export function getAudioDuration(url: string): Promise<string> {
  if (!url) return Promise.resolve('—')
  if (_durationCache.has(url)) return Promise.resolve(_durationCache.get(url)!)

  try {
    const lsCache = JSON.parse(localStorage.getItem('classos_duration_cache') ?? '{}')
    if (lsCache[url]) {
      _durationCache.set(url, lsCache[url])
      return Promise.resolve(lsCache[url])
    }
  } catch { }

  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = url

    audio.addEventListener('loadedmetadata', () => {
      if (!isFinite(audio.duration) || audio.duration <= 0) {
        audio.src = ''
        resolve('—')
        return
      }

      const mins = Math.floor(audio.duration / 60)
      const secs = Math.floor(audio.duration % 60)
      const result = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

      _durationCache.set(url, result)

      try {
        const lsCache = JSON.parse(localStorage.getItem('classos_duration_cache') ?? '{}')
        lsCache[url] = result
        localStorage.setItem('classos_duration_cache', JSON.stringify(lsCache))
      } catch { }

      audio.src = ''
      resolve(result)
    })

    audio.addEventListener('error', () => {
      audio.src = ''
      resolve('—')
    })
  })
}

export function generateSessionId(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i]! % chars.length]
  }
  return result
}

export function sanitizeAiText(text: string): string {
  if (!text) return ''

  return text
    // Bold **text** atau __text__ → text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Italic *text* atau _text_ → text
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Heading markdown (#, ##, ### di awal baris) → dihapus
    .replace(/^#{1,6}\s+/gm, '')
    // Bullet markdown (-, *, • di awal baris) → dihapus tapi baris tetap ada
    .replace(/^[\s]*[-*•]\s+/gm, '')
    // Inline code `text` → text
    .replace(/`(.*?)`/g, '$1')
    // Sisa tanda pagar/asterisk yang nyasar sendirian
    .replace(/[#*_`]/g, '')
    .trim()
}

function safeJsonParse<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

interface RawQuestionItem { pertanyaan: string; jawaban: string }
interface RawQuizItem {
  pertanyaan: string
  pilihan: Record<string, string> // { A: '...', B: '...', C: '...', D: '...' }
  kunci_jawaban: string           // 'A' | 'B' | 'C' | 'D'
  penjelasan_jawaban?: string
}
interface RawProject {
  judul?: string
  tujuan?: string
  deskripsi?: string
  langkah?: string[]
  alat_bahan?: string[]
  hasil_akhir?: string
  estimasi_waktu?: string
  kriteria_keberhasilan?: string[]
}

/**
 * Parsing field Question/Quiz/Slide/Projek dari item konten API.
 *
 * Field mentahnya (pertanyaan, quiz, project, slide_urls) datang sebagai
 * STRING hasil JSON.stringify dari backend, dengan nama & struktur field
 * dalam Bahasa Indonesia yang BEDA dari tipe yang dipakai UI — misal quiz
 * pakai { pilihan: {A,B,C,D}, kunci_jawaban: "B" } bukan { options: [...],
 * correct_index: 1 }, dan project adalah objek kaya (langkah, alat_bahan,
 * dst), bukan sekadar satu string deskripsi.
 *
 * Dipusatkan di sini (bukan diulang di tiap mapToPlayerTrack) supaya kalau
 * backend ubah struktur lagi nanti, cukup disesuaikan di satu tempat.
 */
export function parseContentTools(item: any): {
  questions: ContentQuestion[]
  quiz: ContentQuiz[]
  slides: string[]
  project?: ContentProject
} {
  const rawQuestions = safeJsonParse<RawQuestionItem[]>(item?.pertanyaan) ?? []
  const questions: ContentQuestion[] = rawQuestions
    .filter(q => q?.pertanyaan)
    .map(q => ({ question: q.pertanyaan, answer: q.jawaban ?? '' }))

  const rawQuiz = safeJsonParse<RawQuizItem[]>(item?.quiz) ?? []
  const quiz: ContentQuiz[] = rawQuiz
    .filter(q => q?.pertanyaan && q?.pilihan)
    .map(q => {
      // Urutan huruf di-hardcode (bukan Object.keys(q.pilihan)) supaya tidak
      // bergantung urutan key JSON yang dikirim backend.
      const letters = ['A', 'B', 'C', 'D'].filter(l => q.pilihan[l] !== undefined)
      const options = letters.map(l => q.pilihan[l]!)
      const correctIndex = letters.indexOf(q.kunci_jawaban)
      return {
        question: q.pertanyaan,
        options,
        correct_index: correctIndex >= 0 ? correctIndex : 0,
        explanation: q.penjelasan_jawaban,
      }
    })

  const slides = safeJsonParse<string[]>(item?.slide_urls) ?? []

  const rawProject = safeJsonParse<RawProject>(item?.project)
  const project: ContentProject | undefined = rawProject
    ? {
      title: rawProject.judul ?? '',
      objective: rawProject.tujuan,
      description: rawProject.deskripsi,
      steps: rawProject.langkah,
      tools: rawProject.alat_bahan,
      result: rawProject.hasil_akhir,
      duration: rawProject.estimasi_waktu,
      successCriteria: rawProject.kriteria_keberhasilan,
    }
    : undefined

  return { questions, quiz, slides, project }
}

