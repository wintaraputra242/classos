<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useDate } from '@/composables/useDate'
import { useFullscreen } from '@/composables/useFullscreen'
import pkg from '../../../package.json';

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const { formatDate, formatTime } = useDate()
const { isFullscreen, toggle: fsToggle } = useFullscreen()
const isFull = isFullscreen
const showUserMenu = ref(false)

const now = ref(new Date())
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(timer))

const formattedDate = computed(() => formatDate(now.value))
const formattedTime = computed(() => formatTime(now.value))

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

// Declare agar TypeScript tidak error
declare const responsiveVoice: any

function speak(text: string) {
  // Fallback ke responsiveVoice kalau speechSynthesis tidak support
  if (typeof responsiveVoice !== 'undefined') {
    responsiveVoice.cancel()
    responsiveVoice.speak(text, 'Indonesian Female', {
      rate: 1.1,
      pitch: 1.1,
      volume: 0.8,
    })
    return
  }

  // Fallback ke Web Speech API kalau responsiveVoice tidak ada
  if (!window.speechSynthesis) return
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'id-ID'
  utt.rate = 1.1
  utt.pitch = 1.1
  utt.volume = 0.8
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utt)
}

function logout() {
  speak('Anda telah keluar dari Kelas O S.')
  // Sedikit delay agar suara sempat berbunyi sebelum halaman berpindah
  // setTimeout(() => {
  authStore.logout()
  router.push({ path: '/login' })
  // }, 1200)
}

const menuItems = [
  { to: '/', label: 'Beranda' },
  { to: '/stikernews', label: 'StikerNews' },
  { to: '/lagu', label: 'Lagu Edukasi' },
  { to: '/karakter', label: 'Karakter & Habit' },
  { to: '/favorite', label: 'Favorit' },
]

const userMenuRef = ref<HTMLElement | null>(null)

function handleOutsideClick(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}
const isFocused = ref(false)
const activeIdx = ref(-1)
const inputRef = ref(null)

const suggestions = [
  { label: 'Panduan Memulai', icon: 'ti-file-text', cat: 'Artikel' },
  { label: 'Tutorial Video React', icon: 'ti-brand-react', cat: 'Video' },
  { label: 'Konfigurasi Tailwind CSS', icon: 'ti-paint', cat: 'Artikel' },
  { label: 'Komponen Button', icon: 'ti-components', cat: 'Komponen' },
  { label: 'API Authentication', icon: 'ti-lock', cat: 'Dokumen' },
]

const filtered = computed(() => {
  const q = appStore.searchQuery.trim().toLowerCase()
  return q
    ? suggestions.filter(s => s.label.toLowerCase().includes(q))
    : suggestions.slice(0, 6)
})

const isOpen = computed(() => isFocused.value && filtered.value.length > 0)

function highlight(text: any) {
  const q = appStore.searchQuery.trim()
  if (!q) return text
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(re, '<mark class="bg-transparent text-brand-green font-medium">$1</mark>')
}

function select(item: any) {
  appStore.searchQuery = item.label
  isFocused.value = false
}

function onKeydown(e: any) {
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx.value = Math.min(activeIdx.value + 1, filtered.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx.value = Math.max(activeIdx.value - 1, -1) }
  else if (e.key === 'Enter' && activeIdx.value >= 0) { select(filtered.value[activeIdx.value]) }
  else if (e.key === 'Escape') { isFocused.value = false }
}

function onBlur() { setTimeout(() => { isFocused.value = false }, 120) }

function goToSearch() {
  // Kalau sudah di halaman stikernews, cukup fokus saja
  if (route.path === '/stikernews') {
    appStore.focusSearchInput?.()
    return
  }
  router.push({ path: '/stikernews', query: { focus: '1' } })
}

const schoolName = localStorage.getItem('sn_site_name')

function reload() {
  // window.location.reload()
  window.location.href = window.location.href
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'Selamat Pagi, Pelajar Indonesia! ☀️'
  if (hour >= 11 && hour < 15) return 'Selamat Siang, Pelajar Indonesia! 🌤️'
  if (hour >= 15 && hour < 19) return 'Selamat Sore, Pelajar Indonesia! 🌅'
  return 'Selamat Malam, Pelajar Indonesia! 🌙'
})

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))
</script>

<template>
  <header
    class="dark:bg-[#181818] bg-white border-b dark:border-gray-800 border-gray-200 flex items-center justify-between px-6 py-3 flex-shrink-0 z-[30]">

    <div class="hidden md:block">
      <p class="text-lg font-extrabold text-gray-800 dark:text-white">{{ greeting }}</p>
      <p class="text-xs text-gray-500 dark:text-white">Mari belajar, berkarakter, dan menjadi generasi hebat!</p>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-3 ml-auto">
      <!-- Search -->
      <div class="relative hidden md:block">
        <!-- Input wrapper -->
        <!-- <div class="flex items-center gap-2 px-3 h-9 rounded-full border transition-all duration-150" :class="[
          isFocused
            ? 'border-brand-green ring-2 ring-brand-green/15 bg-white dark:bg-gray-900'
            : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
        ]">
          <svg class="w-3.5 h-3.5 flex-shrink-0 transition-colors duration-150"
            :class="isFocused ? 'text-brand-green' : 'text-gray-400 dark:text-gray-500'" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>

          <input ref="inputRef" v-model="appStore.searchQuery" type="text" placeholder="Cari konten..."
            autocomplete="off"
            class="bg-transparent text-xs text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none w-44 min-w-0"
            @focus="isFocused = true" @blur="onBlur" @keydown="onKeydown" />

          <button v-if="appStore.searchQuery"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="appStore.searchQuery = ''; (inputRef as any)?.focus()">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div> -->

        <div @click="goToSearch"
          class="flex items-center gap-2 px-3 h-9 rounded-full border transition-all duration-150 cursor-pointer bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600  w-[12rem]">
          <svg class="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <span class="text-xs text-gray-400 dark:text-gray-500 select-none">
            Cari konten...
          </span>
        </div>

        <!-- Dropdown -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
          <div v-if="isOpen" class="absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-gray-900
               border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg
               overflow-hidden z-50 min-w-[220px]" role="listbox">
            <div v-for="(item, i) in filtered" :key="item.label"
              class="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer text-xs transition-colors" :class="i === activeIdx
                ? 'bg-gray-100 dark:bg-gray-800'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'" role="option" @mousedown.prevent="select(item)">
              <!-- Ganti dengan icon sesuai kebutuhan -->
              <span class="text-gray-400 dark:text-gray-500 text-sm">🔍</span>
              <span class="text-gray-800 dark:text-gray-200" v-html="highlight(item.label)" />
              <span class="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
                {{ item.cat }}
              </span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Date -->
      <div class="text-right hidden lg:block">
        <p class="text-xs font-bold dark:text-gray-300 text-gray-700">{{ formattedDate }}</p>
        <p class="text-xs dark:text-gray-500 text-gray-500">{{ formattedTime }}</p>
      </div>

      <!-- GeoIntelligence Link -->
      <!-- <a href="#" title="GeoIntelligence Sekolah"
        class="w-9 h-9 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center hover:scale-110 transition-transform" >
        <svg class="w-4 h-4 dark:text-brand-green text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
        </svg>
      </a> -->

      <!-- Theme Toggle -->
      <button @click="themeStore.toggle()"
        class="w-9 h-9 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center hover:scale-110 transition-transform"
        title="Toggle tema">
        <svg v-if="themeStore.mode === 'dark'" class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>

      <!-- Reload -->
      <button @click="reload()"
        class="w-9 h-9 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center hover:scale-110 transition-transform"
        title="Reload halaman">
        <i class="ri-refresh-line text-sm dark:text-gray-300 text-gray-600" />
      </button>

      <!-- Fullscreen -->
      <!-- <button @click="fsToggle()"
        class="w-9 h-9 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center hover:scale-110 transition-transform"
        title="Layar penuh (F11)">
        <svg v-if="!isFull" class="w-4 h-4 dark:text-gray-300 text-gray-600" fill="none" stroke="currentColor"
          stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
        </svg>
        <svg v-else class="w-4 h-4 dark:text-gray-300 text-gray-600" fill="none" stroke="currentColor" stroke-width="2"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
        </svg>
      </button> -->

      <!-- <InstallPwaButton /> -->

      <!-- Bell -->
      <!-- <button class="w-9 h-9 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center relative">
        <svg class="w-4 h-4 dark:text-gray-300 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
      </button> -->

      <!-- Avatar + Info -->
      <div class="flex items-center gap-2 relative" ref="userMenuRef">
        <button
          class="relative w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-blue-500 flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition-opacity"
          @click.stop="showUserMenu = !showUserMenu">
          P

          <!-- Trial Badge -->
          <span v-if="authStore.isTrial"
            class="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[7px] font-black leading-none shadow">
            TRIAL
          </span>
        </button>

        <!-- User dropdown -->
        <div v-if="showUserMenu"
          class="absolute top-14 right-4 rounded-xl p-3 z-50 min-w-[180px] border border-zinc-600"
          style="background-color: #2d2d2d; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">

          <p class="text-xs font-bold dark:text-white text-gray-900">{{ schoolName }}</p>

          <div v-if="authStore.isTrial"
            class="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
            <i class="ri-time-line" />
            Akun Trial
          </div>

          <p v-if="authStore.isTrial" class="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            Akses menggunakan lisensi percobaan.
          </p>

          <hr class="my-3 mt-4 border-gray-200 dark:border-gray-700">

          <button @click="logout"
            class="w-full text-xs font-bold text-red-400 hover:text-red-300 text-left py-1 flex items-center gap-1.5">
            <i class="ri-logout-box-r-line text-sm" />
            Keluar
          </button>

          <hr class="my-2 mt-3 border-gray-200 dark:border-gray-700">

          <div class="text-center mt-1 text-[10px] dark:text-gray-500 text-gray-400">
            Versi {{ pkg.version }}
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
