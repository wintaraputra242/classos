<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useContentStore } from '@/stores/content'
import { useContent } from '@/composables/useContent'
import type { EdukasiSong, PlayerTrack } from '@/types'
import CurrentPlaySection from '@/components/education-songs/CurrentPlaySection.vue'
import AllSongSection from '@/components/education-songs/AllSongSection.vue'

const playerStore = usePlayerStore()
const contentStore = useContentStore()
useContent()

// Ambil langsung dari store
const edukasiSongs = computed(() => contentStore.edukasiSongs ?? [])

function isActive(song: EdukasiSong) {
  return playerStore.currentTrack?.link === song.url_audio?.trim()
}

function mapEdukasiToPlayerTrack(song: EdukasiSong): PlayerTrack {
  return {
    id: `${song.id}`,
    id_stikernews: Number(song.id),
    id_channel: 0,
    title: song.judul ?? 'Lagu Edukasi',
    channel_name: 'StikerNews Pelajar',
    subtitle: song.isi ?? 'StikerNews Pelajar',
    emoji: '🎵',
    duration: song.durasi ?? '',
    duration_podcast: '',
    audio_url: song.url_audio ?? '',
    podcast_url: '',
    type: 'lagu',
    image_url: song.img_url ?? '',
    isi: '',
    currentTime: 0,
    isPlaying: false,
    isFavorite: false,
    link: song.url_audio?.trim(),
  }
}

function playEdukasiSong(item: EdukasiSong) {
  // ✅ Selalu clear preview sebelum play
  playerStore.clearPreview()

  // ✅ Cek isActive (bukan isPlaying) untuk toggle pause/resume
  if (isActive(item)) {
    playerStore.togglePlay()
    return
  }

  const track = mapEdukasiToPlayerTrack(item)
  const queueTracks = edukasiSongs.value
    ?.filter((i) => i?.url_audio)
    .map(mapEdukasiToPlayerTrack)

  playerStore.queueListName = 'Lagu Edukasi'
  playerStore.playWithQueue(track, queueTracks)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-lg font-extrabold dark:text-white text-gray-900 flex items-center gap-2">
          <i class="ri-music-2-line text-brand-red dark:text-brand-green" />
          Lagu Edukasi
        </h1>
        <p class="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
          Belajar sambil menikmati musik yang menginspirasi
        </p>
      </div>
      <div>
        <!-- <div class="flex gap-1.5 flex-wrap">
          <button v-for="j in jenjangList" :key="j.label" class="pill text-white transition-all"
            :class="[j.color, activeFilter.label === j.label ? 'opacity-100 ring-2 ring-white/40 ring-offset-1' : 'opacity-40 hover:opacity-70']"
            @click="switchFilter(j)">
            {{ j.label }}
          </button>
        </div> -->
        <span class="text-xs dark:text-gray-500 text-gray-400">
          {{ edukasiSongs.length }} lagu tersedia
        </span>
      </div>
    </div>

    <!-- Now Playing Banner -->
    <CurrentPlaySection :songs="edukasiSongs" />

    <!-- Grid lagu dari API -->
    <AllSongSection :songs="edukasiSongs" @play="playEdukasiSong" />
  </div>
</template>
