/**
 * Composable untuk dipakai di views:
 * - auto-load konten saat mounted
 * - mapping LoncengItem → PlayerTrack
 * - helper play dari LoncengItem
 */
import { onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import type { LoncengItem, PlayerTrack } from '@/types'

/** Emoji fallback berdasarkan index */
const EMOJIS = ['🎵', '📰', '💡', '🌍', '❤️', '🌟', '💪', '🎯', '📚', '🔒', '🛡️', '🤝']
export function emojiFor(item: LoncengItem) {
  return EMOJIS[item.id_stikernews % EMOJIS.length]
}

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

/** Konversi LoncengItem → PlayerTrack */
export function loncengToTrack(item: LoncengItem): PlayerTrack {
  console.log(item);

  return {
    id: String(item.id_stikernews),
    id_stikernews: item.id_stikernews,
    id_channel: item.id_channel,
    title: item.title,
    subtitle: item.channel_name ?? `Channel ${item.id_channel}`,
    channel_name: item.channel_name ?? '',
    emoji: emojiFor(item) ?? '🎵',
    duration: item.duration ?? '1:00',
    duration_podcast: item.duration_podcast ?? '1:00',
    audio_url: item.audio_url ?? '',
    podcast_url: item.podcast_url ?? '',
    image_url: item.image_url ?? '',
    isi: item.isi ?? '',
    currentTime: 0,
    isPlaying: false,
    isFavorite: false,
    link: item.link ?? undefined,
  }
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

  function playItem(item: LoncengItem) {
    playerStore.play(loncengToTrack(item))
  }

  function setItem(item: LoncengItem) {
    playerStore.setItemPlay(loncengToTrack(item))
  }

  return { contentStore, playerStore, auth, playItem, gradientFor, emojiFor, setItem }
}