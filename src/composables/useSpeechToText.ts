// Reuse pola dari toggleNoteRecording() di BerandaView.vue — Web Speech API,
// satu instance recognition dibagi ke banyak field, hanya 1 field aktif dalam satu waktu.
import { ref } from 'vue'

// Web Speech API — belum standar di semua browser, TS DOM lib tidak selalu menyediakan tipenya.
// Diekspor supaya file lain yang punya instance SpeechRecognition sendiri (mis. BerandaView.vue
// untuk note-dictation & listening transcript) tidak perlu redefine tipe yang sama.
export interface SpeechRecognitionResultLike {
  isFinal: boolean
  [index: number]: { transcript: string }
}
export interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { length: number; [index: number]: SpeechRecognitionResultLike }
}
export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
export type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  return w.SpeechRecognition || w.webkitSpeechRecognition
}

export function useSpeechToText() {
  const activeField = ref<string | null>(null)
  const isSupported = !!getSpeechRecognitionCtor()

  let recognition: SpeechRecognitionLike | null = null

  function stop() {
    recognition?.stop()
    recognition = null
    activeField.value = null
  }

  function start(field: string, onFinalText: (text: string) => void) {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor()
    if (!SpeechRecognitionCtor) {
      console.warn('[STT] SpeechRecognition tidak tersedia')
      return
    }

    if (recognition) stop()

    recognition = new SpeechRecognitionCtor()
    recognition.lang = 'id-ID'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result?.[0]?.transcript
        if (result?.isFinal && transcript) {
          onFinalText(transcript.trim())
        }
      }
    }

    recognition.onerror = (e) => {
      console.warn('[STT] error:', e.error)
      stop()
    }

    recognition.onend = () => {
      // Auto-restart selama field ini masih dianggap aktif (mic belum ditekan lagi untuk stop)
      if (activeField.value === field) recognition?.start()
    }

    activeField.value = field
    recognition.start()
  }

  function toggle(field: string, onFinalText: (text: string) => void) {
    if (activeField.value === field) {
      stop()
    } else {
      start(field, onFinalText)
    }
  }

  return { activeField, isSupported, toggle, stop }
}
