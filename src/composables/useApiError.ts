import { ref, onMounted, onUnmounted } from 'vue'
import { setApiErrorHandler } from '@/services/api'

export interface ApiError {
  id: number
  message: string
  status: number
}

const errors = ref<ApiError[]>([])
let _idCounter = 0
let _isShowing = false // ← cegah duplikat

export function useApiError() {
  function addError(status: number, message: string) {
    if (_isShowing) return // ← sudah ada toast, skip
    _isShowing = true

    const id = ++_idCounter
    errors.value.push({ id, message, status })

    setTimeout(() => {
      errors.value = errors.value.filter(e => e.id !== id)
      _isShowing = false
    }, 8000)
  }

  function dismiss(id: number) {
    errors.value = errors.value.filter(e => e.id !== id)
    _isShowing = false
  }

  // ✅ onSessionExpired dipanggil tambahan kalau errornya status 401 (refresh token
  // gagal total, bukan sekadar 1 request gagal) — dipakai App.vue untuk trigger
  // auto-logout + redirect ke /login lewat useSessionGuard().forceLogout()
  function register(onSessionExpired?: () => void) {
    setApiErrorHandler((error) => {
      addError(error.status, error.message)
      if (error.status === 401) {
        onSessionExpired?.()
      }
    })
  }

  function unregister() {
    setApiErrorHandler(() => { })
  }

  return { errors, dismiss, register, unregister }
}