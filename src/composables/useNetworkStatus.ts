import { ref, onMounted, onUnmounted } from 'vue'

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine)
  const isRetrying = ref(false)
  let retryTimer: ReturnType<typeof setInterval> | null = null

  async function checkConnection(): Promise<boolean> {
    try {
      const res = await fetch('https://www.google.com/favicon.ico?t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors',
      })
      return true
    } catch {
      return false
    }
  }

  function startRetry() {
    stopRetry()
    retryTimer = setInterval(async () => {
      isRetrying.value = true
      const ok = await checkConnection()
      if (ok) {
        isOnline.value = true
        stopRetry()
        // Langsung reload saat koneksi kembali
        window.location.reload()
      } else {
        isRetrying.value = false
      }
    }, 5000)
  }

  function stopRetry() {
    if (retryTimer) { clearInterval(retryTimer); retryTimer = null }
    isRetrying.value = false
  }

  function onOnline() {
    isOnline.value = true
    stopRetry()
    window.location.reload()
  }

  function onOffline() {
    isOnline.value = false
    startRetry()
  }

  onMounted(() => {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    stopRetry()
  })

  return { isOnline, isRetrying }
}