<!-- components/HistorySection.vue -->
<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
</script>

<template>
  <div>

    <!-- Summary bar -->
    <div v-if="playerStore.history.length"
      class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100 mb-4 flex items-center gap-4">
      <div class="w-10 h-10 rounded-xl dark:bg-gray-800 bg-gray-100 flex items-center justify-center">
        <i class="ri-history-line text-lg dark:text-gray-400 text-gray-500" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-bold dark:text-white text-gray-900">Riwayat Pemutaran</p>
        <p class="text-xs dark:text-gray-400 text-gray-500">
          {{ playerStore.history.length }} konten telah diputar
        </p>
      </div>
      <button @click="playerStore.history = []"
        class="text-xs dark:text-gray-500 text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
        <i class="ri-delete-bin-line" />
        Hapus Semua
      </button>
    </div>

    <!-- List -->
    <div v-if="playerStore.history.length" class="space-y-2">
      <div v-for="(track, idx) in playerStore.history" :key="track.id"
        class="dark:bg-[#1e1e1e] bg-white rounded-xl p-3 border dark:border-gray-800 border-gray-100 flex items-center gap-3 cursor-pointer card-hover group"
        :class="playerStore.currentTrack?.id === track.id
          ? 'ring-2 ring-brand-red dark:ring-brand-green bg-brand-red/5 dark:bg-brand-green/5'
          : ''" @click="playerStore.play(track)">

        <!-- Index / playing indicator -->
        <span class="text-xs w-5 text-center flex-shrink-0" :class="playerStore.currentTrack?.id === track.id
          ? 'text-brand-red dark:text-brand-green'
          : 'dark:text-gray-500 text-gray-400'">
          <span v-if="playerStore.currentTrack?.id === track.id && playerStore.isPlaying"
            class="flex items-end justify-center gap-[2px] h-4 w-5">
            <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq1" />
            <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq2" />
            <span class="w-[3px] rounded-sm bg-brand-red dark:bg-brand-green animate-eq3" />
          </span>
          <template v-else>
            <span class="group-hover:hidden">{{ idx + 1 }}</span>
            <i class="ri-play-fill text-brand-red dark:text-brand-green hidden group-hover:block" />
          </template>
        </span>

        <!-- Thumbnail -->
        <div class="relative flex-shrink-0">
          <img v-if="track.image_url" :src="track.image_url" :alt="track.title"
            class="w-10 h-10 rounded-xl object-cover" loading="lazy" decoding="async" />
          <div v-else
            class="w-10 h-10 rounded-xl dark:bg-gray-700 bg-gray-200 flex items-center justify-center text-lg">
            🎵
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-bold text-sm truncate dark:text-white text-gray-900">
            {{ track.title }}
          </p>
          <p class="text-xs dark:text-gray-400 text-gray-500 truncate">{{ track.subtitle }}</p>
        </div>

        <!-- Durasi -->
        <span class="text-xs flex-shrink-0 flex items-center gap-1" :class="playerStore.currentTrack?.id === track.id
          ? 'text-brand-red dark:text-brand-green'
          : 'dark:text-gray-500 text-gray-400'">
          <i class="ri-time-line" />
          {{ track.duration }}
        </span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <i class="ri-history-line text-5xl dark:text-gray-700 text-gray-300 block mb-3" />
      <p class="dark:text-gray-400 text-gray-500 text-sm font-bold">Belum ada riwayat pemutaran</p>
      <p class="dark:text-gray-500 text-gray-400 text-xs mt-1">Putar konten untuk melihat history di sini.</p>
    </div>

  </div>
</template>