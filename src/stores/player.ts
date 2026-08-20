import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { PlayerTrack } from '@/types'
import { logPlay } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export const usePlayerStore = defineStore('player', () => {
  interface SavedPlayerState {
    track: PlayerTrack
    time: number
    isPlayingPodcast: boolean
    isPlayingFrom: 'insight' | 'podcast'
  }

  const HISTORY_KEY = 'classos_player_history'
  const STATE_KEY = 'classos_player_state'

  const currentTrack = ref<PlayerTrack | null>()
  const isPlayingFrom = ref<'insight' | 'podcast'>('insight')
  const isPlaying = ref(false)
  const isPlayingPodcast = ref(false)
  const currentTime = ref(0)
  const volume = ref(75)
  const history = ref<PlayerTrack[]>([])
  let _progressTimer: ReturnType<typeof setInterval> | null = null
  let _rafId: number | null = null  // ganti _progressTimer dengan _rafId
  const _onQueuePageChange = ref<((path: string, query?: Record<string, string>) => void) | null>(null)
  const _audio = new Audio()

  function setNavigationCallback(cb: (path: string, query?: Record<string, string>) => void) {
    _onQueuePageChange.value = cb
  }

  const savedHistory = localStorage.getItem(HISTORY_KEY)
  if (savedHistory) {
    try {
      history.value = JSON.parse(savedHistory)
    } catch {
      history.value = []
    }
  }

  function _saveState() {
    if (!currentTrack.value) {
      localStorage.removeItem(STATE_KEY)
      return
    }
    const state: SavedPlayerState = {
      track: currentTrack.value,
      time: currentTime.value,
      isPlayingPodcast: isPlayingPodcast.value,
      isPlayingFrom: isPlayingFrom.value,
    }
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  }

  function _clearSavedState() {
    localStorage.removeItem(STATE_KEY)
  }

  const savedState = localStorage.getItem(STATE_KEY)
  if (savedState) {
    try {
      const parsed: SavedPlayerState = JSON.parse(savedState)
      if (parsed.track) {
        currentTrack.value = { ...parsed.track, isPlaying: false }
        currentTime.value = parsed.time ?? 0
        isPlayingPodcast.value = parsed.isPlayingPodcast
        isPlayingFrom.value = parsed.isPlayingFrom

        // Siapkan audio-nya (belum auto-play, browser block autoplay tanpa interaksi user)
        const url = parsed.isPlayingPodcast
          ? parsed.track.podcast_url
          : (parsed.track.audio_url ?? parsed.track.podcast_url)

        if (url) {
          _audio.src = url
          _audio.addEventListener('loadedmetadata', () => {
            _audio.currentTime = parsed.time ?? 0
          }, { once: true })
          _audio.load()
        }
      }
    } catch {
      _clearSavedState()
    }
  }


  watch(history, (val) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(val))
  }, { deep: true })

  const isRepeat = ref(false)

  function toggleRepeat() {
    isRepeat.value = !isRepeat.value
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isPlaying.value) {
      // Sync currentTime dari audio langsung saat tab kembali aktif
      currentTime.value = Math.floor(_audio.currentTime)
    }
  })

  window.addEventListener('beforeunload', () => {
    if (isPlaying.value) _saveState()
  })

  _audio.volume = volume.value / 100

  const _audioQueue = ref<string[]>([])

  // Di player store
  const _failCount = ref(0)

  _audio.addEventListener('error', () => {
    _failCount.value++

    if (_failCount.value >= 3) {
      // Reset player
      _failCount.value = 0
      isPlaying.value = false
      isPlayingPodcast.value = false
      currentTime.value = 0
      _audio.src = ''
      _audioQueue.value = []
      _stopTimer()

      // Coba play ulang dari awal kalau masih ada track
      if (currentTrack.value) {
        setTimeout(() => {
          if (currentTrack.value) play(currentTrack.value)
        }, 2000)
      }
    } else {
      // Retry play ulang
      setTimeout(() => {
        if (currentTrack.value) {
          const url = currentTrack.value.audio_url ?? currentTrack.value.podcast_url
          if (url) {
            _audio.src = url
            _audio.load()
            _audio.play().catch(() => { })
          }
        }
      }, 1000 * _failCount.value) // delay makin lama tiap gagal
    }
  })

  // Reset fail count saat berhasil play
  _audio.addEventListener('playing', () => {
    _failCount.value = 0
  })

  _audio.addEventListener('ended', () => {
    if (isRepeat.value && currentTrack.value) {
      // ✅ Repeat sesuai mode yang sedang aktif
      if (isPlayingFrom.value === 'podcast') {
        playPodcast(currentTrack.value)
      } else {
        playInsight(currentTrack.value)
      }
    } else if (_audioQueue.value.length > 0) {
      isPlayingPodcast.value = true
      const nextUrl = _audioQueue.value.shift()!
      _audio.src = nextUrl
      _audio.currentTime = 0
      _audio.play()
    } else {
      setTimeout(() => {
        isPlaying.value = false
        if (currentTrack.value) {
          currentTrack.value.isPlaying = false
          _sendLog(currentTrack.value, 'stop', getAuth().userId)
        }
        _stopTimer()
        _clearSavedState()
      }, 1000)
    }
  })

  function getAuth() {
    return useAuthStore()
  }

  function _formatDuration(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Helper cek apakah durasi valid atau tidak
  function _isDurationEmpty(dur?: string): boolean {
    return !dur || dur === '00:00' || dur === '0:00'
  }

  function play(track: PlayerTrack) {
    isPreview.value = false
    isPlayingFrom.value = 'insight'

    const auth = getAuth()
    if (currentTrack.value && currentTrack.value.id !== track.id) {
      _sendLog(currentTrack.value, 'stop', auth.userId)
    }

    currentTrack.value = { ...track, isPlaying: true }
    isPlayingPodcast.value = false
    isPlaying.value = true
    currentTime.value = 0

    const url = track.audio_url ?? track.podcast_url
    if (url) {
      _audioQueue.value = []
      _audio.src = url
      _audio.currentTime = 0
      _audio.play()

      // ✅ Auto-load durasi kalau API kirim 00:00
      if (_isDurationEmpty(track.duration)) {
        _audio.addEventListener('loadedmetadata', () => {
          if (!isFinite(_audio.duration)) return
          const formatted = _formatDuration(_audio.duration)
          if (currentTrack.value?.id === String(track.id)) {
            currentTrack.value = { ...currentTrack.value, duration: formatted }
          }
        }, { once: true })
      }
    }

    _sendLog(track, 'start', auth.userId)
    history.value = [track, ...history.value.filter(h => h.id !== track.id)].slice(0, 30)
    _startTimer()
  }


  function playPodcast(track: PlayerTrack) {
    isPlayingFrom.value = 'podcast'
    isPreview.value = false
    if (!track.podcast_url) return

    const auth = getAuth()
    _audio.pause()
    _audio.src = ''

    currentTrack.value = { ...track, isPlaying: true }
    isPlayingPodcast.value = true
    isPlaying.value = true
    currentTime.value = 0
    _audioQueue.value = []

    _audio.src = track.podcast_url
    _audio.currentTime = 0
    _audio.load()

    _audio.addEventListener('canplay', () => {
      _audio.play()
    }, { once: true })

    // ✅ Auto-load durasi podcast
    if (_isDurationEmpty(track.duration_podcast)) {
      _audio.addEventListener('loadedmetadata', () => {
        if (!isFinite(_audio.duration)) return
        const formatted = _formatDuration(_audio.duration)
        if (currentTrack.value?.id === String(track.id)) {
          currentTrack.value = { ...currentTrack.value, duration_podcast: formatted }
        }
      }, { once: true })
    }

    _sendLog(track, 'start', auth.userId)
    _startTimer()
  }

  function playInsight(track: PlayerTrack) {
    isPlayingFrom.value = 'insight'
    isPreview.value = false
    if (!track.audio_url) return

    const auth = getAuth()
    _audio.pause()
    _audio.src = ''

    currentTrack.value = { ...track, isPlaying: true }
    isPlayingPodcast.value = false
    isPlaying.value = true
    currentTime.value = 0
    _audioQueue.value = []

    _audio.src = track.audio_url
    _audio.currentTime = 0
    _audio.load()

    _audio.addEventListener('canplay', () => {
      _audio.play()
    }, { once: true })

    // ✅ Auto-load durasi insight
    if (_isDurationEmpty(track.duration)) {
      _audio.addEventListener('loadedmetadata', () => {
        if (!isFinite(_audio.duration)) return
        const formatted = _formatDuration(_audio.duration)
        if (currentTrack.value?.id === String(track.id)) {
          currentTrack.value = { ...currentTrack.value, duration: formatted }
        }
      }, { once: true })
    }

    _sendLog(track, 'start', auth.userId)
    _startTimer()
  }


  const previewTrack = ref<PlayerTrack | null>(null)
  const previewQueue = ref<PlayerTrack[]>([])

  function togglePlay() {
    if (isPreview.value) {
      const track = previewTrack.value
      if (!track) return

      // ✅ Gunakan previewQueue, bukan queue yang lama
      if (previewQueue.value.length > 0) {
        playWithQueue(track, previewQueue.value)
      } else {
        play(track)
      }

      // Reset preview state setelah play
      isPreview.value = false
      previewTrack.value = null
      previewQueue.value = []
      return
    }

    if (!currentTrack.value) return
    const auth = getAuth()

    if (!isPlaying.value && _audio.ended) {
      play(currentTrack.value)
      return
    }

    isPlaying.value = !isPlaying.value
    currentTrack.value.isPlaying = isPlaying.value

    if (isPlaying.value) {
      _audio.play()
    } else {
      _audio.pause()
      _saveState() // ← tambahan
    }

    _sendLog(currentTrack.value, isPlaying.value ? 'start' : 'stop', auth.userId)
    if (isPlaying.value) _startTimer()
    else _stopTimer()
  }


  // function stop() {
  //   const auth = getAuth()
  //   if (currentTrack.value) _sendLog(currentTrack.value, 'stop', auth.userId)
  //   isPlaying.value = false
  //   currentTime.value = 0

  //   // ← stop audio sungguhan
  //   _audio.pause()
  //   _audio.currentTime = 0

  //   _stopTimer()
  // }

  function stop() {
    const auth = getAuth()
    if (currentTrack.value) _sendLog(currentTrack.value, 'stop', auth.userId)
    isPlaying.value = false
    currentTime.value = 0
    _audio.pause()
    _audio.currentTime = 0
    _stopTimer()
    _clearSavedState() // ← tambahan
  }


  function seekTo(seconds: number) {
    currentTime.value = Math.max(0, seconds)
    _audio.currentTime = seconds // ← sync ke audio element
  }

  function setVolume(v: number) {
    volume.value = v
    _audio.volume = v / 100 // ← sync volume ke audio element
  }

  // function _startTimer() {
  //   _stopTimer()

  //   function tick() {
  //     if (isPlaying.value) {
  //       // ✅ Tidak di-floor agar progress bar smooth
  //       currentTime.value = _audio.currentTime
  //     }
  //     _rafId = requestAnimationFrame(tick)
  //   }

  //   _rafId = requestAnimationFrame(tick)
  // }

  function _startTimer() {
    _stopTimer()
    let tickCount = 0
    _progressTimer = setInterval(() => {
      if (!isPlaying.value) return
      currentTime.value = Math.floor(_audio.currentTime)
      tickCount++
      if (tickCount % 20 === 0) {
        _saveState()
      }
    }, 250)
  }

  function _stopTimer() {
    // ✅ Bersihkan keduanya agar tidak ada yang tertinggal
    if (_progressTimer) {
      clearInterval(_progressTimer)
      _progressTimer = null
    }
    if (_rafId !== null) {
      cancelAnimationFrame(_rafId)
      _rafId = null
    }
  }

  async function _sendLog(track: PlayerTrack, action: 'start' | 'stop', userId: number) {
    if (!track.id_stikernews || !track.id_channel) return
    await logPlay({
      id_user: userId,
      id_channel: track.id_channel,
      id_stikernews: track.id_stikernews,
      actiontype: action,
    })
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function getLoadAudioFromUrl(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
        audio.src = '';
      });

      audio.addEventListener('error', () => {
        reject(new Error(`Gagal memuat audio: ${audio.error?.message}`));
      });

      audio.preload = 'metadata';
      audio.src = url;
      audio.load();
    });
  }

  async function getAudioDurationFromUrl(url: string): Promise<string> {
    try {
      const duration = await getLoadAudioFromUrl(url);
      return formatDuration(duration); // "03:45"
    } catch (e) {
      console.error(e);
      return '00:00'; // fallback
    }
  }

  const audioDurations = ref<Record<string, string>>({});

  async function loadAudioDuration(url: string) {
    if (audioDurations.value[url]) return; // skip jika sudah ada

    audioDurations.value[url] = await getAudioDurationFromUrl(url);
  }

  const queueListName = ref<string | null>(null)
  const queue = ref<PlayerTrack[]>([])
  const queueIndex = ref(0)

  function playWithQueue(track: PlayerTrack, tracks: PlayerTrack[]) {
    isPreview.value = false
    isPlayingFrom.value = 'insight'
    const index = tracks.findIndex(t => t.id === track.id)
    queue.value = tracks
    queueIndex.value = index >= 0 ? index : 0
    play(track)
  }

  function nextTrack() {
    isPreview.value = false
    if (!queue.value.length) return
    const next = queueIndex.value + 1
    if (next >= queue.value.length) return
    queueIndex.value = next

    const nextItem = queue.value[next] as PlayerTrack

    // ✅ Trigger navigasi kalau queue punya metadata halaman
    if (_onQueuePageChange.value && queuePageLimit.value !== null) {
      if (next >= queuePageLimit.value) {
        _onQueuePageChange.value(queuePageRoute.value ?? '/favorite', queuePageQuery.value ?? {})
      }
    }

    if (isPlayingFrom.value === 'podcast') {
      nextItem.podcast_url ? playPodcast(nextItem) : playInsight(nextItem)
      if (!nextItem.podcast_url) isPlayingFrom.value = 'insight'
    } else {
      nextItem.audio_url ? playInsight(nextItem) : playPodcast(nextItem)
      if (!nextItem.audio_url) isPlayingFrom.value = 'podcast'
    }
  }

  const queuePageLimit = ref<number | null>(null)
  const queuePageRoute = ref<string | null>(null)
  const queuePageQuery = ref<Record<string, string> | null>(null)

  function setQueuePageMeta(limit: number, route: string, query?: Record<string, string>) {
    queuePageLimit.value = limit
    queuePageRoute.value = route
    queuePageQuery.value = query ?? null
  }

  function clearQueuePageMeta() {
    queuePageLimit.value = null
    queuePageRoute.value = null
    queuePageQuery.value = null
  }


  function prevTrack() {
    isPreview.value = false
    if (!queue.value.length) return
    const prev = queueIndex.value - 1
    if (prev < 0) return
    queueIndex.value = prev

    const prevItem = queue.value[prev] as PlayerTrack

    if (isPlayingFrom.value === 'podcast') {
      // Mode podcast: utamakan podcast, fallback ke insight
      prevItem.podcast_url ? playPodcast(prevItem) : playInsight(prevItem)

      if (!prevItem.podcast_url) isPlayingFrom.value = 'insight'
    } else {
      // Mode insight: utamakan insight, fallback ke podcast
      prevItem.audio_url ? playInsight(prevItem) : playPodcast(prevItem)
      if (!prevItem.audio_url) isPlayingFrom.value = 'podcast'
    }
  }

  function setNullQueue() {
    queue.value = []
  }

  const isPreview = ref<boolean>(false)

  const hasNext = computed(() => queue.value.length > 0 && queueIndex.value < queue.value.length - 1)
  const hasPrev = computed(() => queue.value.length > 0 && queueIndex.value > 0)

  function setItemPlay(track: PlayerTrack, tracks?: PlayerTrack[]) {
    previewTrack.value = { ...track }
    previewQueue.value = tracks ?? []

    // ✅ Kalau track yang dibuka adalah track yang sedang aktif diplay,
    // tidak perlu masuk preview mode
    if (currentTrack.value?.id === track.id) {
      isPreview.value = false
    } else {
      isPreview.value = true
    }
  }

  function clearPreview() {
    isPreview.value = false
    previewTrack.value = null
    previewQueue.value = []
  }

  function resetPlayer() {
    // Stop audio
    _audio.pause()
    _audio.src = ''
    _audio.currentTime = 0

    // Reset semua state
    currentTrack.value = null
    isPlaying.value = false
    isPlayingPodcast.value = false
    currentTime.value = 0
    isPreview.value = false
    previewTrack.value = null
    previewQueue.value = []
    queue.value = []
    queueIndex.value = 0
    queueListName.value = null
    isPlayingFrom.value = 'insight'

    // Stop RAF
    _stopTimer()
  }


  return {
    currentTrack, isPlaying, isPlayingPodcast, currentTime, volume, history, audioDurations, hasNext, hasPrev, queueListName, isPreview, isPlayingFrom, isRepeat, previewTrack, previewQueue, toggleRepeat,
    play, togglePlay, stop, seekTo, setVolume, getAudioDurationFromUrl, loadAudioDuration, formatDuration, getLoadAudioFromUrl, setItemPlay, playPodcast, playInsight, playWithQueue, nextTrack, prevTrack, setNullQueue, clearPreview, setNavigationCallback, setQueuePageMeta, clearQueuePageMeta, resetPlayer
  }
})
