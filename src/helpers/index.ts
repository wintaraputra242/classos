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
    result += chars.charAt(bytes[i]! % chars.length)
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

