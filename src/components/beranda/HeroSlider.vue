<!-- components/beranda/HeroSlider.vue -->
<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { usePlayerStore } from '@/stores/player'

const props = defineProps<{
  heroItems: any[]
  currentIndex: number
  currentItem: any
  loading?: boolean
  orbs?: any[]
}>()

const emit = defineEmits<{
  'go-to': [index: number]
  'play': [item: any]
  'detail': [item: any]
}>()

const themeStore = useThemeStore()
const playerStore = usePlayerStore()
</script>

<template>
  <div class="relative rounded-2xl overflow-hidden mb-6" style="height: 280px">

    <!-- Animated orbs -->
    <div class="orbs-container absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="(orb, i) in orbs" :key="i" class="orb absolute rounded-full" :style="orb" />
    </div>

    <!-- Base background -->
    <div class="absolute inset-0 transition-colors duration-500"
      :class="themeStore.mode === 'dark' ? 'bg-[#1a1a1a]' : 'bg-red-50'" />

    <!-- Loading skeleton -->
    <div v-if="loading" class="relative z-10 flex items-center h-full px-7" style="min-height:220px">
      <div class="p-7 max-w-[58%] space-y-3 w-full">
        <div class="h-5 w-28 rounded-full dark:bg-gray-700 bg-gray-200 animate-pulse" />
        <div class="h-7 w-48 rounded-lg dark:bg-gray-700 bg-gray-200 animate-pulse" />
        <div class="h-4 w-36 rounded dark:bg-gray-700 bg-gray-200 animate-pulse" />
        <div class="h-3 w-64 rounded dark:bg-gray-700 bg-gray-200 animate-pulse" />
        <div class="h-9 w-32 rounded-full dark:bg-gray-700 bg-gray-200 animate-pulse" />
      </div>
    </div>

    <!-- Slides -->
    <TransitionGroup v-else name="slide-fade">
      <div v-if="currentItem" :key="currentIndex" class="relative z-10 flex items-center pl-8" style="height: 280px">

        <!-- Gambar background blur -->
        <div v-if="currentItem.gambar_url"
          class="absolute right-0 top-0 bottom-0 w-[45%] overflow-hidden pointer-events-none">
          <img :src="currentItem.gambar_url" :alt="currentItem.judul" class="w-full h-full object-cover opacity-30"
            style="mask-image: linear-gradient(to left, rgba(0,0,0,0.8), transparent)" />
        </div>

        <!-- Content -->
        <div class="p-7 max-w-[60%] relative z-10">
          <span
            class="inline-block text-[10px] font-bold tracking-widest uppercase text-white px-3 py-1 rounded-full mb-3"
            :class="themeStore.mode === 'dark' ? 'bg-brand-green' : 'bg-red-600'">
            STIKERNEWS HARI INI
          </span>

          <h1 class="text-2xl font-black leading-tight mb-1 line-clamp-2"
            :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
            {{ currentItem.judul }}
          </h1>

          <p class="text-xs leading-relaxed mb-4 line-clamp-2"
            :class="themeStore.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'">
            {{ currentItem.isi }}
          </p>

          <div class="flex items-center gap-2">
            <button v-if="currentItem.audio_url || currentItem.podcast_url" @click="emit('play', currentItem)"
              :disabled="!currentItem.audio_url && !currentItem.podcast_url"
              class="flex items-center gap-2 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="themeStore.mode === 'dark'
                ? 'bg-brand-green hover:bg-green-400'
                : 'bg-gray-900 hover:bg-gray-700'">
              <i v-if="playerStore.currentTrack?.id === String(currentItem.id_lonceng) && playerStore.isPlaying"
                class="ri-pause-line" />
              <i v-else class="ri-play-fill" />
              {{ playerStore.currentTrack?.id === String(currentItem.id_lonceng) && playerStore.isPlaying
                ? 'Sedang Diputar' : 'Play Sekarang' }}
            </button>

            <button @click="emit('detail', currentItem)"
              class="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full border transition-colors"
              :class="themeStore.mode === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'">
              <i class="ri-information-line" />
              Detail
            </button>
          </div>
        </div>

        <!-- Gambar kanan -->
        <div class="absolute right-16 top-0 bottom-0 w-[35%] flex items-center justify-center pointer-events-none z-10">
          <div class="relative">
            <img v-if="currentItem.gambar_url" :src="currentItem.gambar_url" :alt="currentItem.judul"
              class="w-36 h-36 object-cover rounded-2xl shadow-lg opacity-90" />
            <div v-else class="text-6xl">🎧</div>

            <div v-if="playerStore.currentTrack?.id === String(currentItem.id_lonceng) && playerStore.isPlaying"
              class="absolute rounded-2xl left-0 inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
              <div class="flex items-end gap-0.5 h-5">
                <span class="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                  style="height:60%;animation-delay:0s" />
                <span class="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                  style="height:100%;animation-delay:0.15s" />
                <span class="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                  style="height:40%;animation-delay:0.3s" />
                <span class="w-1 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                  style="height:80%;animation-delay:0.1s" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Prev / Next -->
    <button @click="emit('go-to', (currentIndex - 1 + heroItems.length) % heroItems.length)"
      class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors">
      <i class="ri-arrow-left-s-line text-lg" />
    </button>
    <button @click="emit('go-to', (currentIndex + 1) % heroItems.length)"
      class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors">
      <i class="ri-arrow-right-s-line text-lg" />
    </button>

    <!-- Dots -->
    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
      <button v-for="(_, i) in heroItems" :key="i" @click="emit('go-to', i)"
        class="h-2 rounded-full transition-all duration-300" :class="[
          i === currentIndex ? 'w-5' : 'w-2 opacity-40',
          themeStore.mode === 'dark'
            ? (i === currentIndex ? 'bg-brand-green' : 'bg-white')
            : (i === currentIndex ? 'bg-red-600' : 'bg-gray-800')
        ]" />
    </div>
  </div>
</template>