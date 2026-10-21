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

  async function forceLogout() {
    REQUIRED_KEYS.forEach(key => localStorage.removeItem(key))

    if (auth.logout) {
      await auth.logout()
    }

    // ✅ Pakai window.location untuk cek URL saat ini, tidak bergantung router
    const currentPath = window.location.pathname
    const publicPaths = ['/login', '/join', '/privacy-policy']
    const isPublic = publicPaths.some(p => currentPath.startsWith(p))

    console.log('[forceLogout] path:', currentPath, 'isPublic:', isPublic)

    if (!isPublic) {
      router.replace({ path: '/login' })
    }
  }

  async function checkAndGuard(): Promise<boolean> {
    // ✅ Pakai window.location, bukan router
    const currentPath = window.location.pathname
    const publicPaths = ['/login', '/join', '/privacy-policy']
    const isPublic = publicPaths.some(p => currentPath.startsWith(p))
    if (isPublic) return true

    if (isSessionValid()) return true

    console.warn('[SessionGuard] Missing keys:', getMissingKeys())
    await forceLogout()
    return false
  }

  return {
    isSessionValid,
    getMissingKeys,
    checkAndGuard,
    forceLogout,
  }
}