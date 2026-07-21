import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const REQUIRED_KEYS = [
  // 'sn_site_name',
  // 'sn_trial',
  'sn_expired_at',
  'sn_estimation_day',
  'sn_token',
  'sn_access_token',
  'sn_refresh_token',
] as const

export function useSessionGuard() {
  const router = useRouter()
  const auth = useAuthStore()

  function isSessionValid(): boolean {
    return REQUIRED_KEYS.every(key => {
      const val = localStorage.getItem(key)
      return val !== null && val !== '' && val !== 'undefined' && val !== 'null'
    })
  }

  function getMissingKeys(): string[] {
    return REQUIRED_KEYS.filter(key => {
      const val = localStorage.getItem(key)
      return val === null || val === '' || val === 'undefined' || val === 'null'
    })
  }

  async function checkAndGuard(): Promise<boolean> {
    if (isSessionValid()) return true

    console.warn('[SessionGuard] Missing keys:', getMissingKeys())
    await forceLogout()
    return false
  }

  async function forceLogout() {
    // Bersihkan semua localStorage
    REQUIRED_KEYS.forEach(key => localStorage.removeItem(key))

    // Clear auth store kalau ada
    if (auth.logout) {
      await auth.logout()
    }

    // Redirect ke login
    router.replace({ path: '/login' })
  }

  return {
    isSessionValid,
    getMissingKeys,
    checkAndGuard,
    forceLogout,
  }
}