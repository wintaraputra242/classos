/// <reference types="vite/client" />

/**
 * ResponsiveVoice — lib TTS eksternal tanpa tipe, dimuat lewat <script> tag di index.html
 * (bukan npm package). Dipakai sebagai fallback text-to-speech, dengan Web Speech API
 * (SpeechSynthesisUtterance) sebagai fallback kedua kalau lib ini tidak tersedia.
 */
interface ResponsiveVoice {
  cancel: () => void
  speak: (
    text: string,
    voice: string,
    options?: { rate?: number; pitch?: number; volume?: number; onend?: () => void }
  ) => void
}
declare const responsiveVoice: ResponsiveVoice | undefined
