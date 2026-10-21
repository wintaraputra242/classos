<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'
import type { Jenjang } from '@/types'

// Icon components inline (svg as raw components via defineComponent)
import { defineComponent, h } from 'vue'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{
  'show-premium': []
  'show-skp': []
}>()

const makeIcon = (pathD: string, filled = false) =>
  defineComponent({ render: () => h('svg', { fill: filled ? 'currentColor' : 'none', stroke: filled ? undefined : 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: pathD })]) })

const route = useRoute()
const authStore = useAuthStore()

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const navItems = [
  { to: '/', label: 'Beranda', icon: makeIcon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6') },
  { to: '/stikernews', label: 'StikerNews', icon: makeIcon('M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z') },
  { to: '/lagu', label: 'Lagu Edukasi', icon: makeIcon('M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3') },
  { to: '/karakter', label: 'Karakter & Habit', icon: makeIcon('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z') },
  // { to: '/favorite', label: 'Favorit', icon: makeIcon('M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z') },
]

const literasiItems = [
  { to: '/lagu?mode=dengar', label: 'Dengar', icon: makeIcon('M15.536 8.464a5 5 0 010 7.072M12 6a8 8 0 010 12m-4-9.536a5 5 0 000 7.072') },
  { to: '/stikernews?mode=pahami', label: 'Pahami', icon: makeIcon('M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z') },
  { to: '/stikernews?mode=tulis', label: 'Tulis', icon: makeIcon('M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z') },
]

const jenjangList: { label: Jenjang; color: string }[] = [
  { label: 'SD', color: 'bg-yellow-500' },
  { label: 'SMP', color: 'bg-blue-500' },
  { label: 'SMA', color: 'bg-purple-600' },
  { label: 'SMK', color: 'bg-red-500' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <aside
    class="w-56 flex-shrink-0 flex flex-col dark:bg-[#181818] bg-white border-r dark:border-gray-800 border-gray-200 h-full overflow-y-auto scrollbar-hide">
    <!-- Logo -->
    <div class="px-5 pt-5 pb-3">
      <span class="text-2xl font-black dark:text-white text-gray-900 font-poppins leading-none">
        Class<span class="dark:text-brand-green text-brand-red">OS</span>
      </span>
      <div class="text-[11px] font-medium tracking-widest dark:text-gray-500 text-gray-400 capitalize mt-0.5">
        Classroom Operating System
      </div>
    </div>

    <nav class="mt-3 px-3 flex-1">
      <!-- Main Nav -->
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
        class="sidebar-link dark:text-gray-400 text-gray-600 hover:dark:bg-gray-800 hover:bg-gray-100"
        :class="{ active: isActive(item.to) }">
        <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
        {{ item.label }}
      </RouterLink>

      <!-- Literasi Section -->
      <!-- <div class="mt-4 mb-1 px-1">
        <p class="text-[11px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400">Kecakapan Literasi
        </p>
      </div> -->
      <!-- <RouterLink v-for="item in literasiItems" :key="item.to" :to="item.to"
        class="sidebar-link dark:text-gray-400 text-gray-600 hover:dark:bg-gray-800 hover:bg-gray-100"
        :class="{ active: isActive(item.to) }">
        <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
        {{ item.label }}
      </RouterLink> -->

      <!-- Jenjang Filter -->
      <!-- <div class="px-1 mt-4 mb-2">
        <p class="text-[10px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-2">Filter Jenjang
        </p>
        <div class="flex gap-1.5 flex-wrap">
          <button v-for="j in jenjangList" :key="j.label" class="pill text-white transition-all"
            :class="[j.color, appStore.activeJenjangFilter.includes(j.label) ? 'opacity-100 scale-105' : 'opacity-40']"
            @click="appStore.toggleJenjangFilter(j.label)">{{ j.label }}</button>
        </div>
      </div> -->

      <!-- Playlist -->
      <div class="mt-4 px-1">
        <p class="text-[10px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-2">Playlist Saya
        </p>
        <RouterLink to="/favorite"
          class="sidebar-link dark:text-gray-400 text-gray-600 hover:dark:bg-gray-800 hover:bg-gray-100" :class="route.path === '/favorite'
            ? 'active'
            : 'hover:dark:bg-gray-800 hover:bg-gray-100'">
          <svg class="w-4 h-4" :class="route.path === '/favorite' ? 'text-red-500' : 'text-red-400'" fill="currentColor"
            viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clip-rule="evenodd" />
          </svg>
          Favorit & Playlist
        </RouterLink>
        <!-- <RouterLink to="/favorite"
          class="sidebar-link dark:text-gray-400 text-gray-600 hover:dark:bg-gray-800 hover:bg-gray-100"
          :class="route.path === '/favorite' ? 'active' : 'hover:dark:bg-gray-800 hover:bg-gray-100'">
          <i class="ri-history-line text-base"
            :class="route.path === '/favorite' ? 'text-brand-red dark:text-brand-green' : ''" />
          History
        </RouterLink> -->
        <!-- <div class="sidebar-link dark:text-gray-400 text-gray-500 cursor-default">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2" />
            <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round" />
          </svg>
          History Play
          <span v-if="playerStore.history.length" class="ml-auto pill bg-brand-green text-white">{{
            playerStore.history.length }}</span>
        </div> -->
      </div>

      <!-- <div v-if="authStore.isTrial"
        class="mx-1 mt-4 mb-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <p class="text-xs font-semibold text-blue-700 dark:text-blue-300">
          Mode Trial
        </p>
        <p class="text-[11px] text-blue-600 dark:text-blue-400">
          Akun ini menggunakan akses percobaan.
        </p>
      </div> -->

      <div
        class="mx-1 mb-3 px-3 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div class="mb-1.5">
          <p class="text-xs font-semibold text-blue-700 dark:text-blue-300">
            Mode {{ authStore.isTrial ? 'Trial' : 'Premium' }}
          </p>
        </div>
        <p class="text-[10px] dark:text-gray-500 text-gray-400 mb-1">Expire until</p>
        <p class="text-xs font-bold dark:text-white text-gray-800 mb-1">
          {{ authStore.expiredDate ? formatDate(authStore.expiredDate) : '—' }}
        </p>
        <!-- <div class="flex items-center gap-1.5">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="Number(authStore.estimationDay) <= 7
            ? 'bg-red-100 dark:bg-red-950/40 text-red-500'
            : Number(authStore.estimationDay) <= 30
              ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-500'
              : 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400'">
            {{ Number(authStore.estimationDay) > 0 ? `${authStore.estimationDay} hari lagi` : 'Sudah kadaluarsa' }}
          </span>
        </div> -->
      </div>

      <!-- Sponsor -->
      <div class="py-4 mt-auto border-t dark:border-gray-800 border-gray-100 space-y-4">

        <!-- StikerNews -->
        <div>
          <p class="text-xs dark:text-gray-500 text-gray-400 mb-1">Content by</p>
          <div class="text-xl font-black dark:text-white text-gray-900 font-poppins">
            Stiker<span class="dark:text-brand-green text-brand-red">News</span>
          </div>
          <div
            class="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-widest dark:bg-brand-green bg-brand-red text-white uppercase">
            Pelajar
          </div>
        </div>

        <!-- Bamboomedia SpeedID -->
        <div class="">
          <!-- <p class="text-xs dark:text-gray-500 text-gray-400 mb-2">Powered by</p> -->
          <div class="flex flex-col gap-0.5">
            <!-- Bamboomedia -->
            <div class="flex items-center gap-1.5">
              <div class="flex items-center gap-[2px]">
                <span class="w-2.5 h-2.5 rounded-[2px] bg-red-500" />
                <span class="w-2.5 h-2.5 rounded-[2px] bg-yellow-400" />
                <span class="w-2.5 h-2.5 rounded-[2px] bg-green-500" />
                <span class="w-2.5 h-2.5 rounded-[2px] bg-blue-600" />
              </div>
              <span class="text-sm font-black tracking-tight">
                <span class="text-green-600">BAMBOO</span><span class="dark:text-white text-gray-900">MEDIA</span>
              </span>
              <!-- <span class="text-[8px] font-bold text-green-600 -mt-2">GROUP</span> -->
            </div>
            <!-- SpeedID -->
            <div class="flex items-center gap-1.5 ml-0.5">
              <div
                class="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span class="text-[8px] font-black text-white">S</span>
              </div>
              <span class="text-xs font-bold dark:text-gray-300 text-gray-600">Speed<span
                  class="text-orange-500">ID</span></span>
              <!-- <span class="text-[9px] dark:text-gray-600 text-gray-400 italic">next great idea</span> -->
            </div>
          </div>
        </div>

        <!-- Hisense -->
        <!-- <div class="pt-3 border-t dark:border-gray-800 border-gray-100">
          <p class="text-xs dark:text-gray-500 text-gray-400 mb-1">Support by</p>
          <div class="text-brand-blue font-black text-xl font-poppins">Hisense</div>
          <div class="text-sm font-bold dark:text-gray-300 text-gray-700">Smart Board</div>
        </div> -->

        <!-- <div class="text-xs dark:text-gray-500 text-gray-500">Mendukung Pendidikan<br>Cerdas Indonesia</div> -->
      </div>

      <!-- Token Info -->
      <!-- Token Info / Premium buttons -->
      <div class="mx-1 mb-3 flex flex-col gap-4">

        <!-- Tombol 1: Tingkatkan ke ClassOS Premium -->
        <div class="relative" style="width: calc(100% - 10px);">
          <!-- Bintang pojok kanan atas -->
          <div
            class="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
            <i class="ri-star-fill text-[10px] text-yellow-900" />
          </div>

          <button @click="emit('show-premium')"
            class="w-full px-3 py-2.5 rounded-xl text-left transition-opacity hover:opacity-90 overflow-hidden relative"
            style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);">

            <!-- Dekorasi lingkaran background -->
            <div class="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-yellow-400/10" />
            <div class="absolute -right-2 -top-4 w-10 h-10 rounded-full bg-blue-500/10" />

            <div class="flex items-center gap-2 relative z-10">
              <div
                class="w-7 h-7 rounded-lg bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0">
                <i class="ri-vip-crown-2-fill text-yellow-400 text-sm" />
              </div>
              <div>
                <p class="text-[9px] text-gray-400 leading-none mb-0.5">Akses Lebih Banyak Fitur</p>
                <p class="text-[10px] font-extrabold leading-tight">
                  <span class="text-yellow-400">TINGKATKAN KE</span>
                  <span class="text-white"> CLASSOS PREMIUM</span>
                </p>
              </div>
            </div>

          </button>
        </div>

        <!-- Tombol 2: Solusi Kelas Pintar -->
        <div class="relative" style="width: calc(100% - 10px);">
          <!-- Bintang pojok kanan atas -->
          <div
            class="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
            <i class="ri-star-fill text-[10px] text-yellow-900" />
          </div>

          <button @click="emit('show-skp')"
            class="w-full px-3 py-2.5 rounded-xl text-left transition-opacity hover:opacity-90 overflow-hidden relative"
            style="background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);">

            <!-- Dekorasi lingkaran background -->
            <div class="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-brand-green/10" />
            <div class="absolute -right-2 -top-4 w-10 h-10 rounded-full bg-blue-500/10" />

            <div class="flex items-center gap-2 relative z-10">
              <div
                class="w-7 h-7 rounded-lg bg-brand-green/20 border border-brand-green/30 flex items-center justify-center flex-shrink-0">
                <i class="ri-tv-2-line text-brand-green text-sm" />
              </div>
              <div>
                <p class="text-[9px] text-gray-400 leading-none mb-0.5">Program Unggulan</p>
                <p class="text-[10px] font-extrabold leading-tight">
                  <span class="text-brand-green">SOLUSI</span>
                  <span class="text-white"> KELAS PINTAR</span>
                </p>
              </div>
            </div>

          </button>
        </div>

      </div>
    </nav>
  </aside>
</template>
