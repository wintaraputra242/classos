/**
 * Composable untuk dipakai di views: auto-load konten & channel saat mounted.
 */
import { onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'

/** Warna gradient berdasarkan id */
const GRADIENTS = [
  { from: '#1e3a5f', to: '#1a73e8' },
  { from: '#1a3a2a', to: '#1DB954' },
  { from: '#5f3a0d', to: '#f59e0b' },
  { from: '#5f1a1a', to: '#ef4444' },
  { from: '#3a1a5f', to: '#8b5cf6' },
  { from: '#1a4a4a', to: '#14b8a6' },
  { from: '#4a3a0d', to: '#d97706' },
  { from: '#1a1a5f', to: '#6366f1' },
]
export function gradientFor(id: number | undefined | null) {
  if (!id) return GRADIENTS[0] as { from: string; to: string }
  return GRADIENTS[(id ?? 0) % GRADIENTS.length] as { from: string; to: string }
}

export function useContent(channelId?: number) {
  const contentStore = useContentStore()
  const playerStore = usePlayerStore()
  const auth = useAuthStore()

  onMounted(async () => {
    if (!contentStore.items.length || channelId) {
      await contentStore.loadContent(auth.userId, channelId, !!channelId)
    }
    if (!contentStore.channels.length) {
      await contentStore.loadChannels(auth.userId)
    }
  })

  return { contentStore, playerStore, auth, gradientFor }
}