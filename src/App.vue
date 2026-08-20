<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { onMounted, onUnmounted, ref } from 'vue'
import { useSessionGuard } from '@/composables/useSessionGuard'
import { useRoute } from 'vue-router'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useVersionCheck } from './composables/useVersionCheck'
import { registerSW } from 'virtual:pwa-register'
import { useApiError } from './composables/useApiError'
import { useDate } from './composables/useDate'
// import { useVersionCheck } from '@/composables/useVersionCheck'

// Initialize theme on app start
const themeStore = useThemeStore()
themeStore.apply()

const route = useRoute()

const { errors, dismiss, register, unregister } = useApiError()
const { checkAndGuard } = useSessionGuard()
const { isOnline, isRetrying } = useNetworkStatus()
const { formatDate } = useDate()

// Halaman yang tidak perlu dicek (public pages)
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

async function guardCheck() {
  // Skip kalau di halaman publik
  if (PUBLIC_PATHS.some(p => route.path.startsWith(p))) return
  await checkAndGuard()
}

// Cek saat tab kembali aktif (user switch tab lalu balik)
function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    guardCheck()
  }
}

const { hasNewVersion, reload, newVersion, releaseDate } = useVersionCheck()

const errorReload = () => {
  window.location.href = window.location.href
}

onMounted(() => {
  guardCheck()
  register()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  unregister()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <!-- Popup versi baru -->
  <!-- <Transition name="fade">
    <div v-if="hasNewVersion"
      class="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">

      <div
        class="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden dark:bg-zinc-900 bg-white border dark:border-zinc-700 border-gray-200">

        Animated gradient header
        <div
          class="relative h-28 flex flex-col items-center justify-center bg-gradient-to-br from-brand-red to-pink-500 dark:from-brand-green dark:to-emerald-400 overflow-hidden">
          <div class="absolute w-24 h-24 rounded-full bg-white/10 -top-6 -left-6 animate-ping"
            style="animation-duration:3s" />
          <div class="absolute w-16 h-16 rounded-full bg-white/10 -bottom-4 -right-4 animate-ping"
            style="animation-duration:2.5s;animation-delay:0.5s" />

          <div class="relative w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-2 shadow-lg">
            <i class="ri-sparkling-2-fill text-2xl text-white" />
          </div>
          <p class="text-white text-xs font-bold tracking-widest uppercase opacity-80">Update Tersedia</p>
        </div>

        Content
        <div class="p-5 text-center">
          <h3 class="text-base font-black dark:text-white text-gray-900 mb-1">Versi Terbaru Telah Dirilis!</h3>

          Versi & tanggal rilis
          <div class="flex items-center justify-center gap-2 mb-3">
            <span v-if="newVersion"
              class="flex items-center gap-1 text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-brand-green text-brand-red px-3 py-1 rounded-full">
              <i class="ri-price-tag-3-line text-[11px]" />
              v{{ newVersion }}
            </span>
            <span v-if="releaseDate"
              class="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-500 px-3 py-1 rounded-full dark:bg-zinc-800 bg-gray-100">
              <i class="ri-calendar-line text-[11px]" />
              {{ formatDate(new Date(releaseDate)) }}
            </span>
          </div>

          <p class="text-xs dark:text-gray-400 text-gray-500 leading-relaxed mb-5">
            Pembaruan baru tersedia dengan fitur dan perbaikan terkini. Muat ulang sekarang untuk mendapatkan pengalaman
            terbaik.
          </p>

          <div class="flex gap-2">
            <button @click="reload"
              class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
              <i class="ri-refresh-line" />
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition> -->

  <Transition name="fade">
    <div v-if="!isOnline"
      class="fixed inset-0 z-[99999] flex flex-col items-center justify-center dark:bg-[#0f0f0f] bg-gray-50 px-6">

      <!-- Animasi wifi off -->
      <div class="relative mb-8">
        <div class="w-24 h-24 rounded-full dark:bg-zinc-800 bg-gray-200 flex items-center justify-center">
          <i class="ri-wifi-off-line text-5xl dark:text-gray-500 text-gray-400" />
        </div>
        <!-- Pulse ring -->
        <div
          class="absolute inset-0 rounded-full border-2 dark:border-zinc-700 border-gray-300 animate-ping opacity-30" />
      </div>

      <!-- Text -->
      <h2 class="text-xl font-black dark:text-white text-gray-900 mb-2 text-center">
        Tidak Ada Koneksi
      </h2>
      <p class="text-sm dark:text-gray-400 text-gray-500 text-center leading-relaxed max-w-xs mb-8">
        Periksa koneksi internet Anda. Halaman akan otomatis dimuat ulang saat koneksi kembali.
      </p>

      <!-- Status retry -->
      <div class="flex items-center gap-2 mb-6">
        <div class="w-2 h-2 rounded-full" :class="isRetrying ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'" />
        <span class="text-xs dark:text-gray-500 text-gray-400">
          {{ isRetrying ? 'Mencoba menghubungkan kembali...' : 'Menunggu koneksi...' }}
        </span>
      </div>

      <!-- Progress dots -->
      <div class="flex items-center gap-1.5 mb-8">
        <span class="w-1.5 h-1.5 rounded-full bg-brand-red dark:bg-brand-green animate-bounce"
          style="animation-delay:0s" />
        <span class="w-1.5 h-1.5 rounded-full bg-brand-red dark:bg-brand-green animate-bounce"
          style="animation-delay:0.15s" />
        <span class="w-1.5 h-1.5 rounded-full bg-brand-red dark:bg-brand-green animate-bounce"
          style="animation-delay:0.3s" />
      </div>

      <!-- Tombol retry manual -->
      <button @click="errorReload"
        class="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-red dark:bg-brand-green text-white text-sm font-bold hover:opacity-80 transition-opacity">
        <i class="ri-refresh-line" />
        Coba Sekarang
      </button>

      <!-- Branding kecil di bawah -->
      <div class="absolute bottom-6 text-center">
        <p class="text-xs font-black dark:text-white text-gray-900 font-poppins">
          Class<span class="dark:text-brand-green text-brand-red">OS</span>
        </p>
        <p class="text-[10px] dark:text-gray-600 text-gray-400">Classroom Operating System</p>
      </div>

    </div>
  </Transition>

  <!-- API Error Toast -->
  <div class="fixed top-4 right-4 z-[99997] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <TransitionGroup name="toast">
      <div v-for="error in errors" :key="error.id"
        class="relative pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border dark:bg-zinc-900 bg-white dark:border-zinc-700 border-gray-200 overflow-hidden">

        <!-- Icon -->
        <div class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
          <i class="text-base text-red-500"
            :class="error.status === 401 ? 'ri-lock-2-line' : 'ri-signal-wifi-error-line'" />
        </div>

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold dark:text-white text-gray-900 mb-0.5">
            {{ error.status === 401 ? 'Sesi Berakhir' : 'Terjadi Kesalahan' }}
          </p>
          <p class="text-[11px] dark:text-gray-400 text-gray-500 leading-relaxed">
            {{ error.message || 'Gagal memuat sebagian data. Coba muat ulang halaman.' }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button @click="errorReload"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-red dark:bg-brand-green text-white text-[10px] font-bold hover:opacity-80 transition-opacity">
            <i class="ri-refresh-line text-[10px]" />
            {{ error.status === 401 ? 'Login Ulang' : 'Muat Ulang' }}
          </button>
          <button @click="dismiss(error.id)"
            class="w-6 h-6 flex items-center justify-center rounded-lg dark:bg-zinc-800 bg-gray-100 hover:opacity-80 transition-opacity">
            <i class="ri-close-line text-xs dark:text-gray-400 text-gray-500" />
          </button>
        </div>

        <!-- Progress bar -->
        <div class="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
          <div class="h-full bg-brand-red dark:bg-brand-green" style="animation: shrink 8s linear forwards" />
        </div>

      </div>
    </TransitionGroup>
  </div>

  <RouterView />
</template>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes progress {
  0% {
    width: 0%;
  }

  100% {
    width: 100%;
  }
}
</style>