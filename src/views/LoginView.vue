<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import pkg from '../../package.json';

const router = useRouter()
const auth = useAuthStore()
const error = ref('')
const isTrial = ref(false)
const route = useRoute()

const isSessionExpired = computed(() => route.query.reason === 'session_expired')

const tokenInput = ref('')
const tokenDisplay = ref('')

function formatTokenPLN(raw: string) {
  const clean = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const groups = clean.match(/.{1,4}/g) ?? []
  return groups.join(' ')
}

function onTokenInput(e: Event) {
  const input = e.target as HTMLInputElement
  const formatted = formatTokenPLN(input.value)
  tokenDisplay.value = formatted
  tokenInput.value = formatted.replace(/\s/g, '')
  nextTick(() => { input.value = formatted })
}

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

function playChime(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src)
    audio.volume = 0.7
    audio.onended = () => resolve()
    audio.onerror = () => resolve()
    audio.play().catch(() => resolve())
  })
}

async function speakWithChime(text: string, chimeSrc: string) {
  await playChime(chimeSrc)
  speak(text)
}

const loadingTrial = ref(false)
const loadingPremium = ref(false)

async function handleLogin() {
  error.value = ''

  // Jika mode trial dan token kosong, langsung lewati validasi token
  if (!isTrial.value && !tokenInput.value.trim()) {
    error.value = 'Masukkan kode token terlebih dahulu'
    speak('Masukkan kode token terlebih dahulu')
    return
  }

  const result = await auth.login(tokenInput.value)

  if (result.success) {
    router.push({ path: '/' })
    await speakWithChime('Selamat datang di Kelas O S.', '/sounds/login-chime.mp3')
  } else {
    error.value = result.error || 'Login gagal'
    speak('Login gagal. ' + (result.error ?? 'Token tidak valid, silakan coba lagi.'))
  }

  loadingTrial.value = false
  loadingPremium.value = false
}

function onClickTrial() {
  if (!isTrial.value) {
    // Klik pertama: aktifkan mode trial, belum submit
    isTrial.value = true
    error.value = ''
  } else {
    // Klik kedua (sudah di mode trial): baru proses login
    loadingTrial.value = true
    handleLogin()
  }
}

function resetToNormal() {
  isTrial.value = false
  error.value = ''
  loadingPremium.value = false
  loadingTrial.value = false
}

function reload() {
  // window.location.reload()
  window.location.href = window.location.href
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center dark:bg-brand-dark bg-gray-100 px-4">
    <div class="w-full max-w-xl">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="flex flex-col items-center mb-2">
          <span class="text-3xl font-black dark:text-white text-gray-900 font-poppins">
            Class<span
              :class="isTrial ? 'text-green-500 dark:text-green-400' : 'dark:text-brand-green text-brand-red'">OS</span>
          </span>
          <span class="text-[11px] font-medium tracking-widest dark:text-gray-500 text-gray-400 capitalize mt-0.5">
            Classroom Operating System
          </span>
        </div>
        <p class="text-sm dark:text-gray-400 text-gray-500 mt-2">
          {{ isTrial ?
            'ClassOS tetap berfungsi optimal pada Mode Trial' :
            'Masukkan token sekolah untuk melanjutkan' }}
        </p>
      </div>

      <!-- Card -->
      <div
        class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-6 border dark:border-gray-800 border-gray-200 shadow-lg w-full">

        <!-- Trial Banner -->
        <transition name="slide-down">
          <div v-if="isTrial"
            class="flex items-center gap-3 bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-800 rounded-xl px-4 py-3 mb-5">
            <span
              class="bg-green-700 dark:bg-green-600 text-green-50 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap uppercase">
              Trial
            </span>
            <p class="text-xs text-green-800 dark:text-green-300 font-medium leading-relaxed">
              Manfaatkan masa trial untuk mencoba fitur-fitur terbaik ClassOS. Pengalaman mengajar di era AI untuk semua
              Guru.
            </p>
          </div>
        </transition>

        <div v-if="isSessionExpired" class="mb-4 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 
         flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
          <i class="ri-error-warning-line" />
          Sesi Anda telah berakhir. Silakan login kembali.
        </div>

        <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5 uppercase tracking-wider">
          Kode Token
        </label>

        <input :value="tokenDisplay" @input="onTokenInput" @keyup.enter="handleLogin" type="text" inputmode="text"
          :placeholder="'0000 0000 0000 0000 0000'" maxlength="24" autocomplete="off" spellcheck="false"
          class="w-full px-4 py-3.5 rounded-xl dark:bg-gray-800 bg-gray-50 dark:text-white text-gray-900 dark:border-gray-700 border-gray-200 border text-center text-xl font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 transition-all mb-5"
          :class="[
            error ? 'border-red-400 ring-2 ring-red-400/20' : '',
            isTrial ? 'focus:ring-green-500 dark:focus:ring-green-400' : 'focus:ring-brand-red dark:focus:ring-brand-green'
          ]" />

        <p v-if="error" class="text-xs text-red-400 mb-3 font-semibold">⚠️ {{ error }}</p>

        <!-- Tombol Login -->
        <button @click="handleLogin(); loadingPremium = true" :disabled="loadingTrial ? false : auth.loading"
          class="w-full text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mb-3"
          :class="isTrial
            ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
            : 'bg-brand-red dark:bg-brand-green hover:bg-red-600 dark:hover:bg-green-600'">
          <svg v-if="!loadingTrial && auth.loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {{ !loadingTrial && auth.loading ? 'Memuat...' : (isTrial ? 'Masuk Mode Trial' : 'Login') }}
        </button>

        <!-- Tombol Login Sebagai Trial -->
        <button v-if="!isTrial" @click="onClickTrial" :disabled="loadingPremium ? false : auth.loading"
          class="w-full border-2 bg-transparent font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          :class="isTrial
            ? 'border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 hover:bg-green-600 dark:hover:bg-green-700 hover:text-white dark:hover:text-white'
            : 'border-brand-red dark:border-brand-green text-brand-red dark:text-brand-green hover:bg-brand-red dark:hover:bg-brand-green hover:text-white dark:hover:text-white'">
          <svg v-if="!loadingPremium && auth.loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {{ !loadingPremium && auth.loading ? 'Memuat...' : 'Login Sebagai Trial' }}
        </button>

        <!-- Kembali ke login biasa -->
        <transition name="fade">
          <button v-if="isTrial && !auth.loading" @click="resetToNormal"
            class="w-full mt-3 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1">
            ← Kembali ke login biasa
          </button>
        </transition>
      </div>

      <div class="flex justify-center gap-12 mt-6">

        <!-- Content by -->
        <div class="flex flex-col items-center gap-1.5">
          <p class="text-xs dark:text-gray-600 text-gray-400">Content by</p>

          <div class="flex flex-col items-center">
            <div class="text-lg font-black dark:text-white text-gray-900 font-poppins">
              Stiker<span
                :class="isTrial ? 'text-green-500 dark:text-green-400' : 'dark:text-brand-green text-brand-red'">News</span>
            </div>
            <div
              class="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-widest text-white uppercase mb-2"
              :class="isTrial ? 'bg-green-600 dark:bg-green-700' : 'dark:bg-brand-green bg-brand-red'">
              Pelajar
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <div class="flex items-center gap-[2px]">
              <span class="w-2 h-2 rounded-[2px] bg-red-500" />
              <span class="w-2 h-2 rounded-[2px] bg-yellow-400" />
              <span class="w-2 h-2 rounded-[2px] bg-green-500" />
              <span class="w-2 h-2 rounded-[2px] bg-blue-600" />
            </div>
            <span class="text-xs font-black tracking-tight">
              <span class="text-green-600">BAMBOO</span><span class="dark:text-white text-gray-900">MEDIA</span>
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <div
              class="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span class="text-[7px] font-black text-white">S</span>
            </div>
            <span class="text-xs font-bold dark:text-gray-300 text-gray-600">
              Speed<span class="text-orange-500">ID</span>
            </span>
          </div>
        </div>

        <!-- Divider — pakai border kiri di Support by agar otomatis sama tinggi -->
        <div class="flex flex-col items-center gap-1.5 pl-12">
          <p class=" text-xs dark:text-gray-600 text-gray-400">Support by</p>
          <p class="font-black text-brand-blue font-poppins text-lg leading-tight">Hisense</p>
          <span class="text-xs font-normal dark:text-gray-500 text-gray-400">Smart Board</span>
        </div>

      </div>

      <div class="text-center mt-7 text-xs">
        Versi {{ pkg.version }}
      </div>

      <!-- Reload -->
      <div class="fixed top-2 right-2">
        <button @click="reload()"
          class="w-9 h-9 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center hover:scale-110 transition-transform"
          title="Reload halaman">
          <i class="ri-refresh-line text-sm dark:text-gray-300 text-gray-600" />
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>