import { ref, onMounted, onUnmounted } from 'vue'
import { setApiErrorHandler } from '@/services/api'

export interface ApiError {
  id: number
  message: string
}

const errors = ref<ApiError[]>([])
let _idCounter = 0
let _isShowing = false // ← cegah duplikat

export function useApiError() {
  function addError() {
    if (_isShowing) return // ← sudah ada toast, skip
    _isShowing = true

    const id = ++_idCounter
    errors.value.push({ id, message: '' })

    setTimeout(() => {
      errors.value = errors.value.filter(e => e.id !== id)
      _isShowing = false
    }, 8000)
  }

  function dismiss(id: number) {
    errors.value = errors.value.filter(e => e.id !== id)
    _isShowing = false
  }

  function register() {
    setApiErrorHandler(() => addError())
  }

  function unregister() {
    setApiErrorHandler(() => { })
  }

  return { errors, dismiss, register, unregister }
}