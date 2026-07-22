import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { checkVersion } from '@/composables/useVersionCheck'

const REQUIRED_KEYS = [
  // 'sn_site_name',
  // 'sn_trial',
  'sn_expired_at',
  'sn_estimation_day',
  'sn_token',
  'sn_access_token',
  'sn_refresh_token',
] as const

function isSessionValid(): boolean {
  return REQUIRED_KEYS.every(key => {
    const val = localStorage.getItem(key)
    return val !== null && val !== '' && val !== 'undefined' && val !== 'null'
  })
}

function clearSession() {
  REQUIRED_KEYS.forEach(key => localStorage.removeItem(key))
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/JoinView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/views/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'beranda', component: () => import('@/views/BerandaView.vue') },
        { path: 'stikernews', name: 'stikernews', component: () => import('@/views/StikerNewsView.vue') },
        { path: 'lagu', name: 'lagu', component: () => import('@/views/LaguEdukasiView.vue') },
        { path: 'karakter', name: 'karakter', component: () => import('@/views/KarakterView.vue') },
        { path: 'favorite', name: 'favorite', component: () => import('@/views/FavoriteView.vue') },
      ],
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
      meta: { requiresAuth: false },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const isPublic = to.meta.requiresAuth === false

  // Cek version tiap pindah route, jalan di background, tidak menghalangi navigasi
  checkVersion()

  if (isPublic) {
    if (to.name === 'login' && auth.isLoggedIn) return { name: 'beranda' }
    return true
  }

  if (!auth.isLoggedIn) {
    clearSession()
    return { name: 'login' }
  }

  if (!isSessionValid()) {
    try {
      const playerStore = usePlayerStore()
      playerStore.stop()
      playerStore.currentTrack = null
    } catch { /* store belum ready */ }

    clearSession()
    auth.logout?.()
    return { name: 'login' }
  }

  return true
})



export default router