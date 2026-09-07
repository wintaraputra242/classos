/**
 * Content Store
 * Mengelola fetch konten dari API (fetchLoncengWithLink & fetchChannels)
 * dengan fallback ke data lokal jika API gagal/offline.
 */
import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import { fetchLoncengWithLink, fetchChannels, apiFavoriteItems, apiPlaylistItems, apiDetailPlaylistItems } from '@/services/api'
import type { LoncengItem, Channel } from '@/types'
import { getAudioDuration } from '@/helpers'

export const useContentStore = defineStore('content', () => {
  // ── state ──────────────────────────────────────────────────────────────────
  const items = ref<LoncengItem[]>([])
  const favoriteItems = ref<any[]>([])
  const playlistItems = ref<any[]>([])
  const detailPlaylistItems = ref<any[]>([])
  const channels = ref<Channel[]>([])
  const loading = ref(false)
  const loadingFavorite = ref(false)
  const loadingPlaylist = ref(false)
  const loadingDetailPlaylist = ref(false)
  const error = ref<string | null>(null)
  const errorFavorite = ref<string | null>(null)
  const errorPlaylist = ref<string | null>(null)
  const errorDetailPlaylist = ref<string | null>(null)
  const activeChannelId = ref<number>(7)    // default channel 7 (sesuai Postman)
  const lastId = ref(0)                     // cursor pagination
  const edukasiSongs = ref<{ id: number; url_audio: string; img_url: string, isi: string, judul: string, durasi?: string }[]>([])
  const hasMore = ref(true)
  const LIMIT = 20 // sesuaikan dengan limit backend

  // ── getters ────────────────────────────────────────────────────────────────
  const todayItems = computed(() => items.value.slice(0, 3))
  const randomItems = computed(() => {
    const arr = [...items.value]
    return arr.sort(() => Math.random() - 0.5).slice(0, 5)
  })
  const activeChannel = computed(() =>
    channels.value.find(c => c.id_channel === activeChannelId.value)
  )

  // ── actions ────────────────────────────────────────────────────────────────

  // Helper — taruh di atas fungsi-fungsi load, bisa di dalam store
  const BATCH_SIZE = 5

  async function loadDurationsInBatch<T extends { audio_url?: string; podcast_url?: string }>(
    list: T[],
    targetRef: Ref<any[]>,
    startIdx = 0
  ) {
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (item, batchIdx) => {
          const targetIdx = startIdx + i + batchIdx

          const [durasi, podcast_durasi] = await Promise.all([
            item.audio_url ? getAudioDuration(item.audio_url) : Promise.resolve('—'),
            item.podcast_url ? getAudioDuration(item.podcast_url) : Promise.resolve('—'),
          ])

          if (targetRef.value[targetIdx]) {
            targetRef.value[targetIdx] = { ...targetRef.value[targetIdx], durasi, podcast_durasi }
          }
        })
      )
    }
  }

  /** Load konten dari API. userId = SpeedQ id_user. */
  async function loadContent(userId: number, channelId?: number, reset = false) {
    const channel = channelId ?? activeChannelId.value
    activeChannelId.value = channel

    if (reset) {
      items.value = []
      lastId.value = 0
      hasMore.value = true
    }

    // Jangan load kalau sudah tidak ada data
    if (!hasMore.value) return

    loading.value = true
    error.value = null

    try {
      const data = await fetchLoncengWithLink({
        id_user: userId,
        newsChannel: channel,
        lastid: lastId.value,
      })

      const list: LoncengItem[] = Array.isArray(data)
        ? data
        : (data?.data ?? data?.items ?? [])

      if (data?.edukasiSongs) {
        edukasiSongs.value = data.edukasiSongs.map((item: any) => ({
          ...item,
          url_audio: item.url_audio?.trim(),
          durasi: '00:00',
        }))

        data.edukasiSongs.forEach(async (item: any, idx: number) => {
          if (!item.url_audio) return
          const durasi = await getAudioDuration(item.url_audio.trim())
          if (edukasiSongs.value[idx]) {
            edukasiSongs.value[idx] = { ...edukasiSongs.value[idx], durasi }
          }
        })
      }

      // Deteksi apakah masih ada halaman berikutnya
      if (list.length < LIMIT) {
        hasMore.value = false
      }

      if (list.length) {
        const startIdx = reset ? 0 : items.value.length

        const listWithoutDuration = list.map((item: any) => ({
          ...item,
          durasi: '—',
          podcast_durasi: '—',
        }))

        items.value = reset ? listWithoutDuration : [...items.value, ...listWithoutDuration]
        lastId.value = list[list.length - 1]?.id_lonceng ?? 0
        loading.value = false

        await loadDurationsInBatch(list, items, startIdx)

        return
      }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      error.value = msg
      console.warn('[content] loadContent failed:', msg)
    } finally {
      loading.value = false
    }
  }


  /** Load daftar channel */
  async function loadChannels(userId?: number) {
    try {
      const data = await fetchChannels(userId)
      const list: Channel[] = Array.isArray(data) ? data : (data?.data ?? [])
      if (list.length) channels.value = list
    } catch (e) {
      console.warn('[content] loadChannels failed:', e)
    }
  }

  /** Switch channel dan reload konten */
  async function switchChannel(channelId: number, userId: number) {
    activeChannelId.value = channelId
    await loadContent(userId, channelId, true)
  }

  /** Load more (infinite scroll) */
  async function loadMore(userId: number) {
    if (loading.value) return
    await loadContent(userId, activeChannelId.value, false)
  }

  async function loadFavoriteContent(userTeacherId: string) {
    loadingFavorite.value = true
    errorFavorite.value = null

    try {
      const data = await apiFavoriteItems(userTeacherId)
      const list: LoncengItem[] = Array.isArray(data)
        ? data
        : (data?.data ?? data?.items ?? [])

      if (!list.length) return

      favoriteItems.value = list.map((item: any) => ({
        ...item,
        durasi: '—',
        podcast_durasi: '—',
      }))

      loadingFavorite.value = false

      // ✅ Pakai batch helper
      await loadDurationsInBatch(list, favoriteItems)

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      error.value = msg
      console.warn('[content] loadFavoriteContent failed:', msg)
    } finally {
      loadingFavorite.value = false
    }
  }

  async function loadPlaylistContent(userTeacherId: string) {
    loadingPlaylist.value = true
    errorPlaylist.value = null

    try {
      const data = await apiPlaylistItems(userTeacherId)
      const list = Array.isArray(data)
        ? data
        : (data?.data ?? data?.items ?? [])

      // Playlist tidak perlu durasi, langsung tampil
      playlistItems.value = list

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      error.value = msg
      console.warn('[content] loadPlaylistContent failed:', msg)
    } finally {
      loadingPlaylist.value = false
    }
  }

  async function loadDetailPlaylistContent(playlistId: string) {
    loadingDetailPlaylist.value = true
    errorDetailPlaylist.value = null

    try {
      const data = await apiDetailPlaylistItems(playlistId)
      const list: LoncengItem[] = Array.isArray(data)
        ? data
        : (data?.data ?? data?.items ?? [])

      if (!list.length) return

      detailPlaylistItems.value = list.map((item: any) => ({
        ...item,
        durasi: '—',
        podcast_durasi: '—',
      }))

      loadingDetailPlaylist.value = false

      // ✅ Pakai batch helper
      await loadDurationsInBatch(list, detailPlaylistItems)

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      error.value = msg
      console.warn('[content] loadDetailPlaylistContent failed:', msg)
    } finally {
      loadingDetailPlaylist.value = false
    }
  }

  return {
    items, edukasiSongs, channels, loading, error,
    activeChannelId, activeChannel,
    todayItems, randomItems, loadingFavorite, loadingDetailPlaylist, errorFavorite, loadingPlaylist, favoriteItems, playlistItems, detailPlaylistItems, hasMore,
    loadContent, loadChannels, switchChannel, loadMore, loadFavoriteContent, loadPlaylistContent, loadDetailPlaylistContent
  }
})
