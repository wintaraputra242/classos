// Reuse pola dari toggleNoteRecording() di BerandaView.vue — Web Speech API,
// satu instance recognition dibagi ke banyak field, hanya 1 field aktif dalam satu waktu.
import { ref } from 'vue'

export function useSpeechToText() {
  const activeField = ref<string | null>(null)
  const isSupported = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  let recognition: any = null

  function stop() {
    recognition?.stop()
    recognition = null
    activeField.value = null
  }

  function start(field: string, onFinalText: (text: string) => void) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('[STT] SpeechRecognition tidak tersedia')
      return
    }

    if (recognition) stop()

    recognition = new SpeechRecognition()
    recognition.lang = 'id-ID'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          onFinalText(event.results[i][0].transcript.trim())
        }
      }
    }

    recognition.onerror = (e: any) => {
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
