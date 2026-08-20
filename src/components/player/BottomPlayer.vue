<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import TrackDetailPopup from '../ui/TrackDetailPopup.vue';

const props = defineProps<{
  showPremiumBanner?: boolean
}>()

const emit = defineEmits<{
  'close-premium': []
}>()

const playerStore = usePlayerStore()
const currentTrack = computed(() => playerStore.currentTrack)

const showTrackPopup = ref(false)

function parseDuration(dur: string): number {
  const parts = dur.split(':')
  const m = parseInt(parts[0] ?? '0', 10)
  const s = parseInt(parts[1] ?? '0', 10)
  return m * 60 + s
}

const totalSeconds = computed(() => {
  if (playerStore.isPlayingPodcast) {
    return parseDuration(currentTrack.value?.duration_podcast ?? '0:00')
  }
  return parseDuration(currentTrack.value?.duration ?? '0:00')
})

const progressPercent = computed(() => {
  if (!totalSeconds.value) return 0
  return Math.min(100, (playerStore.currentTime / totalSeconds.value) * 100)
})

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const isSeeking = ref(false)

function onSeekStart() {
  isSeeking.value = true
}

function seek(e: MouseEvent) {
  const bar = e.currentTarget as HTMLElement
  const ratio = e.offsetX / bar.offsetWidth
  playerStore.seekTo(ratio * totalSeconds.value)

  nextTick(() => {
    setTimeout(() => { isSeeking.value = false }, 50)
  })
}

function openPlayerDetail() {
  // ✅ Reset preview state agar popup tampilkan track yang sedang diplay
  playerStore.clearPreview()
  showTrackPopup.value = true
}
</script>

<template>
  <Transition name="player">
    <div v-if="currentTrack && !props.showPremiumBanner"
      class="dark:bg-[#181818]/95 bg-white/95 border-t dark:border-gray-800 border-gray-200 px-4 py-3 fixed bottom-0 w-full z-30">
      <div class="flex items-center justify-between max-w-screen-2xl mx-auto gap-3">

        <!-- Track Info -->
        <!-- Track Info - bisa diklik -->
        <div class="flex items-center gap-3 w-52 flex-shrink-0 cursor-pointer" @click="openPlayerDetail">
          <div class="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-gradient-to-br from-green-800 to-green-500">
            <img v-if="currentTrack.image_url" :src="currentTrack.image_url" :alt="currentTrack.title"
              class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-lg">
              {{ currentTrack.emoji ?? '🎵' }}
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold dark:text-white text-gray-900 truncate">{{ currentTrack.title }}</p>
            <div class="flex items-center gap-1 mt-0.5">
              <!-- <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" :class="currentTrack.podcast_url
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'">
                {{ currentTrack.podcast_url ? 'Podcast' : 'Audio' }}
              </span> -->
              <p class="text-[10px] dark:text-gray-500 text-gray-400 truncate">
                {{ currentTrack.subtitle ?? (currentTrack as any)?.channel_name ?? '' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Controls + Progress -->
        <div class="flex-1 flex flex-col items-center gap-1.5 max-w-xl">
          <div class="flex items-center gap-5">

            <div class="relative group/tip">
              <button @click="playerStore.toggleRepeat()" class="transition-colors" :class="playerStore.isRepeat
                ? 'text-brand-red dark:text-brand-green'
                : 'dark:text-gray-500 text-gray-400 hover:dark:text-white hover:text-gray-800'">
                <i class="ri-repeat-one-line text-base" />
              </button>
              <div class="tooltip">{{ playerStore.isRepeat ? 'Ulangi: Aktif' : 'Ulangi' }}</div>
            </div>

            <div class="relative group/tip">
              <button @click="playerStore.prevTrack()" :disabled="!playerStore.hasPrev"
                class="dark:text-gray-400 text-gray-500 hover:dark:text-white hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <i class="ri-skip-back-fill text-xl" />
              </button>
              <div class="tooltip">Sebelumnya</div>
            </div>

            <div class="relative group/tip">
              <button @click="playerStore.togglePlay()"
                class="w-9 h-9 rounded-full bg-white dark:bg-white flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                <i :class="playerStore.isPlaying ? 'ri-pause-fill' : 'ri-play-fill'" class="text-black text-lg"
                  :style="!playerStore.isPlaying ? 'margin-left: 2px' : ''" />
              </button>
              <div class="tooltip">{{ playerStore.isPlaying ? 'Jeda' : 'Putar' }}</div>
            </div>

            <div class="relative group/tip">
              <button @click="playerStore.nextTrack()" :disabled="!playerStore.hasNext"
                class="dark:text-gray-400 text-gray-500 hover:dark:text-white hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <i class="ri-skip-forward-fill text-xl" />
              </button>
              <div class="tooltip">Berikutnya</div>
            </div>

            <div class="relative group/tip">
              <button @click="playerStore.stop()"
                class="dark:text-gray-500 text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors">
                <i class="ri-stop-fill text-base" />
              </button>
              <div class="tooltip">Berhenti</div>
            </div>

          </div>

          <!-- Progress bar -->
          <div class="flex items-center gap-2 w-full">
            <span class="text-[10px] dark:text-gray-500 text-gray-400 w-7 text-right tabular-nums">
              {{ formatTime(playerStore.currentTime) }}
            </span>
            <!-- <div class="flex-1 relative h-1 dark:bg-gray-700 bg-gray-300 rounded-full cursor-pointer group mb-2"
              @mousedown="onSeekStart" @click="seek">

              <div class="h-1 bg-brand-red dark:bg-brand-green rounded-full"
                :class="playerStore.isPlaying && !isSeeking ? 'transition-[width] duration-1000 ease-linear' : 'transition-none'"
                :style="{ width: progressPercent + '%' }" />

              <div
                class="absolute w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style="top: 50%; transform: translate(-50%, -50%); pointer-events: none;"
                :style="{ left: progressPercent + '%' }" />
              <div
                class="absolute w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                :style="{
                  top: '50%',
                  left: dotPosition,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }" />
            </div> -->
            <div class="flex-1 relative h-1 dark:bg-gray-700 bg-gray-300 rounded-full cursor-pointer group mb-2"
              @mousedown="onSeekStart" @click="seek">

              <!-- Hapus transition sama sekali -->
              <div class="h-1 bg-brand-red dark:bg-brand-green rounded-full transition-none"
                :style="{ width: progressPercent + '%' }" />

              <div
                class="absolute w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                :style="{
                  top: '50%',
                  left: progressPercent + '%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }" />
            </div>
            <span class="text-[10px] dark:text-gray-500 text-gray-400 w-7 tabular-nums">
              {{ (playerStore.isPlayingPodcast ? currentTrack.duration_podcast : currentTrack.duration) ?? '0:00' }}
            </span>
          </div>
        </div>

        <!-- Volume + Queue -->
        <div class="flex items-center gap-3 w-44 justify-end flex-shrink-0">
          <div class="hidden sm:flex items-center gap-1.5">
            <div class="relative group/tip">
              <i class="ri-volume-up-line text-base dark:text-gray-400 text-gray-500" />
              <div class="tooltip">Volume</div>
            </div>
            <input type="range" min="0" max="100" :value="playerStore.volume"
              @input="(e) => playerStore.setVolume(+(e.target as HTMLInputElement).value)"
              class="w-16 h-1 accent-brand-red dark:accent-brand-green cursor-pointer" />
          </div>

          <!-- <div class="relative group/tip hidden sm:block">
            <button
              class="dark:text-gray-400 text-gray-500 hover:dark:text-white hover:text-gray-800 transition-colors">
              <i class="ri-play-list-2-line text-base" />
            </button>
            <div class="tooltip">Antrian</div>
          </div> -->
        </div>

      </div>

      <!-- Popup -->
      <TrackDetailPopup v-model="showTrackPopup" />
    </div>

  </Transition>
</template>

<style scoped>
.player-enter-active,
.player-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.player-enter-from,
.player-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-active .relative,
.slide-up-leave-active .relative {
  transition: transform 0.3s ease;
}

.slide-up-enter-from .relative,
.slide-up-leave-to .relative {
  transform: translateY(100%);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}
</style>