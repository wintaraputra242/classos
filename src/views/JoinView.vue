<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const WA_NUMBER = '6282146633466'
const WA_MESSAGE = encodeURIComponent('Halo, saya ingin mengetahui lebih lanjut tentang ClassOS dan Solusi Kelas Pintar (SKP).')
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`

const activeFeature = ref(0)
const isScrolled = ref(false)

const features = [
  { icon: 'ri-tv-2-line', title: 'Smart TV Ready', desc: 'Jalankan ClassOS di Smart TV Android di setiap ruang kelas tanpa perangkat tambahan.' },
  { icon: 'ri-book-open-line', title: 'Konten Edukasi Berkualitas', desc: 'Ribuan konten StikerNews Pelajar — audio, teks, dan podcast — dikurasi khusus untuk pembelajaran.' },
  { icon: 'ri-mic-2-line', title: 'Pembelajaran Interaktif', desc: 'Fitur listening, briefing AI, dan summary otomatis membuat sesi mengajar lebih terstruktur.' },
  { icon: 'ri-bar-chart-2-line', title: 'Pantau Sesi Mengajar', desc: 'Rekap sesi, foto kelas, dan jumlah siswa tercatat otomatis setiap akhir pembelajaran.' },
  { icon: 'ri-smartphone-line', title: 'Multi Device', desc: 'Bisa diakses dari Smart TV, tablet, laptop, maupun HP guru dan siswa.' },
  { icon: 'ri-shield-check-line', title: 'Mudah & Terjangkau', desc: 'Solusi sederhana dan terjangkau untuk sekolah yang ingin hadirkan kelas digital.' },
]

const keunggulan = [
  'Praktis digunakan oleh guru dan siswa',
  'Dapat dipasang di setiap kelas',
  'Tidak perlu memindahkan perangkat antar ruangan',
  'Mendukung pembelajaran interaktif dan kolaboratif',
  'Dapat dikembangkan bertahap sesuai kebutuhan sekolah',
]

const paket = [
  {
    name: 'Trial',
    badge: 'Coba Gratis',
    badgeColor: 'bg-blue-500',
    price: 'Gratis',
    period: '',
    desc: 'Cocok untuk sekolah yang ingin mencoba ClassOS terlebih dahulu.',
    items: ['Akses konten terbatas', 'Mode trial 30 hari', 'Tanpa perlu token sekolah', 'Support dasar'],
    cta: 'Mulai Trial',
    highlight: false,
  },
  {
    name: 'Premium',
    badge: 'Paling Populer',
    badgeColor: 'bg-red-500',
    price: 'Hubungi Kami',
    period: '',
    desc: 'Solusi lengkap untuk sekolah yang siap hadirkan Kelas Pintar.',
    items: ['Akses konten penuh StikerNews', 'Fitur sesi mengajar lengkap', 'AI Briefing & Summary', 'Multi device & multi kelas', 'Support prioritas'],
    cta: 'Dapatkan Premium',
    highlight: true,
  },
  {
    name: 'SKP',
    badge: 'Solusi Kelas Pintar',
    badgeColor: 'bg-green-600',
    price: 'Hubungi Kami',
    period: '',
    desc: 'Paket lengkap perangkat + konten untuk transformasi kelas digital.',
    items: ['Smart TV Full HD / 4K', 'Wireless Keyboard & Mouse', 'Akses ClassOS Premium', 'Instalasi & setup', 'Garansi & dukungan teknis'],
    cta: 'Tanya Paket SKP',
    highlight: false,
  },
]

const steps = [
  { num: '01', title: 'Hubungi Kami', desc: 'Chat WhatsApp untuk konsultasi kebutuhan sekolah Anda.' },
  { num: '02', title: 'Pilih Paket', desc: 'Kami bantu pilih paket yang paling sesuai dengan anggaran dan kebutuhan.' },
  { num: '03', title: 'Aktivasi Token', desc: 'Dapatkan token sekolah dan aktifkan ClassOS di perangkat Anda.' },
  { num: '04', title: 'Mulai Mengajar', desc: 'Guru scan QR, pilih playlist, dan sesi pembelajaran dimulai.' },
]

function onScroll() {
  isScrolled.value = window.scrollY > 60
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  const interval = setInterval(() => {
    activeFeature.value = (activeFeature.value + 1) % features.length
  }, 3000)
  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    clearInterval(interval)
  })
})
</script>

<template>
  <div class="min-h-screen font-poppins"
    :class="themeStore.mode === 'dark' ? 'bg-[#0f0f0f] text-white' : 'bg-white text-gray-900'">

    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300" :class="isScrolled
      ? (themeStore.mode === 'dark' ? 'bg-[#0f0f0f]/95 border-b border-gray-800 shadow-xl' : 'bg-white/95 border-b border-gray-200 shadow-md')
      : 'bg-transparent'">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl font-black">
            Class<span class="text-red-500 dark:text-green-400">OS</span>
          </span>
          <span class="text-[10px] hidden sm:block"
            :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-400'">
            Smart Classroom Ecosystem
          </span>
        </div>
        <a :href="WA_URL" target="_blank"
          class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-colors bg-red-500 hover:bg-red-600 dark:bg-green-600 dark:hover:bg-green-500">
          <i class="ri-whatsapp-line" />
          Hubungi Kami
        </a>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

      <!-- Background gradient -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          :class="themeStore.mode === 'dark' ? 'bg-green-500' : 'bg-red-400'" />
        <div class="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15"
          :class="themeStore.mode === 'dark' ? 'bg-blue-500' : 'bg-red-300'" />
      </div>

      <div class="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center py-20">

        <!-- Kiri -->
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 border" :class="themeStore.mode === 'dark'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-50 border-red-200 text-red-600'">
            <i class="ri-sparkling-2-line" />
            Dukung Transformasi Pendidikan Indonesia
          </div>

          <h1 class="text-4xl lg:text-5xl font-black leading-tight mb-4">
            Wujudkan
            <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
              Kelas Pintar
            </span>
            <br>di Sekolah Anda
          </h1>

          <p class="text-base leading-relaxed mb-8"
            :class="themeStore.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'">
            ClassOS adalah platform pembelajaran digital berbasis Smart TV yang membawa konten edukasi
            berkualitas ke setiap ruang kelas — praktis, interaktif, dan terjangkau.
          </p>

          <div class="flex flex-wrap gap-3">
            <a :href="WA_URL" target="_blank"
              class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 shadow-lg"
              :class="themeStore.mode === 'dark' ? 'bg-green-600 hover:bg-green-500 shadow-green-900' : 'bg-red-500 hover:bg-red-600 shadow-red-200'">
              <i class="ri-whatsapp-line text-base" />
              Konsultasi Gratis
            </a>
            <a href="#fitur"
              class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 border"
              :class="themeStore.mode === 'dark'
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'">
              Lihat Fitur
              <i class="ri-arrow-down-line" />
            </a>
          </div>

          <!-- Stats -->
          <div class="flex gap-8 mt-10">
            <div v-for="stat in [
              { val: '1 Juta+', label: 'Target Kelas Pintar' },
              { val: '5 Jenjang', label: 'SD s/d SMK' },
              { val: '1000+', label: 'Konten Edukasi' },
            ]" :key="stat.label">
              <p class="text-2xl font-black" :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
                {{ stat.val }}
              </p>
              <p class="text-xs" :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-500'">
                {{ stat.label }}
              </p>
            </div>
          </div>
        </div>

        <!-- Kanan — preview mockup -->
        <div class="relative hidden lg:block">
          <div class="relative rounded-2xl overflow-hidden border shadow-2xl"
            :class="themeStore.mode === 'dark' ? 'border-gray-700 bg-[#1e1e1e]' : 'border-gray-200 bg-gray-50'">
            <!-- Fake browser bar -->
            <div class="flex items-center gap-1.5 px-4 py-2.5 border-b"
              :class="themeStore.mode === 'dark' ? 'border-gray-700 bg-[#2a2a2a]' : 'border-gray-200 bg-white'">
              <span class="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span class="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span class="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span class="flex-1 text-center text-[10px] mx-4 px-3 py-0.5 rounded"
                :class="themeStore.mode === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'">
                classos.isn-speed.com
              </span>
            </div>
            <!-- Content preview -->
            <div class="p-5">
              <div class="flex items-center gap-2 mb-4">
                <span class="font-black text-sm">Class<span
                    :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">OS</span></span>
                <span class="text-[9px]"
                  :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-400'">Classroom Operating
                  System</span>
              </div>
              <!-- Fake hero card -->
              <div class="rounded-xl p-4 mb-3" :class="themeStore.mode === 'dark' ? 'bg-gray-800' : 'bg-red-50'">
                <div class="text-[9px] font-bold mb-1 px-2 py-0.5 rounded-full inline-block"
                  :class="themeStore.mode === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-red-100 text-red-600'">
                  STIKERNEWS HARI INI
                </div>
                <p class="text-xs font-black mt-1" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
                  Bagaimana lebah dapat menciptakan madu?
                </p>
                <p class="text-[9px] mt-1" :class="themeStore.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'">
                  Lebah mengumpulkan nektar dari bunga menggunakan mulutnya...
                </p>
              </div>
              <!-- Fake grid -->
              <div class="grid grid-cols-3 gap-2">
                <div v-for="i in 6" :key="i" class="rounded-lg h-12"
                  :class="themeStore.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'" />
              </div>
            </div>
          </div>
          <!-- Floating badge -->
          <div class="absolute -bottom-4 -left-4 px-3 py-2 rounded-xl shadow-xl border text-xs font-bold"
            :class="themeStore.mode === 'dark' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-500 border-red-400 text-white'">
            <i class="ri-tv-2-line mr-1" />Smart TV Ready
          </div>
        </div>
      </div>
    </section>

    <!-- Tentang SKP -->
    <section class="py-20 border-t"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#141414]' : 'border-gray-100 bg-red-50/40'">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border" :class="themeStore.mode === 'dark'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-50 border-red-200 text-red-600'">
              <i class="ri-building-2-line" />
              Solusi Kelas Pintar (SKP)
            </div>
            <h2 class="text-3xl font-black mb-4 leading-tight">
              Membawa Pembelajaran Digital<br>
              <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
                ke Setiap Kelas
              </span>
            </h2>
            <p class="text-sm leading-relaxed mb-6"
              :class="themeStore.mode === 'dark' ? 'text-gray-400' : 'text-gray-600'">
              Solusi sederhana dan terjangkau untuk membantu sekolah menghadirkan pengalaman belajar
              digital di setiap ruang kelas — tanpa perlu infrastruktur yang rumit.
            </p>
            <ul class="space-y-3">
              <li v-for="item in keunggulan" :key="item" class="flex items-start gap-2.5 text-sm">
                <i class="ri-checkbox-circle-fill mt-0.5 flex-shrink-0"
                  :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'" />
                <span :class="themeStore.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'">{{ item }}</span>
              </li>
            </ul>
          </div>

          <!-- Perangkat SKP -->
          <div class="space-y-3">
            <p class="text-xs font-bold uppercase tracking-wider"
              :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-400'">
              Perangkat Solusi Kelas Pintar
            </p>
            <div class="grid grid-cols-3 gap-3">
              <div v-for="device in [
                { icon: 'ri-tv-2-line', name: 'Smart TV', sub: 'Full HD / 4K' },
                { icon: 'ri-keyboard-line', name: 'Wireless KB & Mouse', sub: 'Kendali mudah' },
                { icon: 'ri-graduation-cap-line', name: 'Akses ClassOS', sub: '+ StikerNews Pelajar' },
              ]" :key="device.name" class="flex flex-col items-center text-center p-4 rounded-xl border"
                :class="themeStore.mode === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-200 shadow-sm'">
                <i :class="device.icon" class="text-2xl mb-2"
                  :style="themeStore.mode === 'dark' ? 'color:#4ade80' : 'color:#ef4444'" />
                <p class="text-xs font-bold" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
                  {{ device.name }}
                </p>
                <p class="text-[10px]" :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-400'">
                  {{ device.sub }}
                </p>
              </div>
            </div>

            <!-- Untuk siapa -->
            <div class="grid grid-cols-3 gap-3 mt-3">
              <div v-for="who in [
                { icon: 'ri-group-line', label: 'Untuk Setiap Kelas' },
                { icon: 'ri-user-star-line', label: 'Untuk Setiap Guru' },
                { icon: 'ri-user-smile-line', label: 'Untuk Setiap Siswa' },
              ]" :key="who.label" class="flex flex-col items-center text-center p-3 rounded-xl border"
                :class="themeStore.mode === 'dark' ? 'border-green-500/20 bg-green-500/5' : 'border-red-100 bg-red-50'">
                <i :class="who.icon" class="text-xl mb-1"
                  :style="themeStore.mode === 'dark' ? 'color:#4ade80' : 'color:#ef4444'" />
                <p class="text-[10px] font-bold"
                  :class="themeStore.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'">
                  {{ who.label }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Fitur -->
    <section id="fitur" class="py-20 border-t"
      :class="themeStore.mode === 'dark' ? 'border-gray-800' : 'border-gray-100'">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-12">
          <p class="text-xs font-bold uppercase tracking-widest mb-2"
            :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
            Fitur Unggulan
          </p>
          <h2 class="text-3xl font-black">Semua yang Dibutuhkan<br>
            <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">Guru Modern</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(f, idx) in features" :key="f.title" class="p-5 rounded-2xl border transition-all cursor-default"
            :class="[
              activeFeature === idx
                ? (themeStore.mode === 'dark' ? 'border-green-500/50 bg-green-500/10' : 'border-red-300 bg-red-50')
                : (themeStore.mode === 'dark' ? 'border-gray-800 bg-[#1a1a1a] hover:border-gray-700' : 'border-gray-200 bg-white hover:border-red-200')
            ]">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              :class="themeStore.mode === 'dark' ? 'bg-green-500/20' : 'bg-red-50'">
              <i :class="f.icon" class="text-lg"
                :style="themeStore.mode === 'dark' ? 'color:#4ade80' : 'color:#ef4444'" />
            </div>
            <p class="font-bold text-sm mb-1" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
              {{ f.title }}
            </p>
            <p class="text-xs leading-relaxed" :class="themeStore.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'">
              {{ f.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Cara Mulai -->
    <section class="py-20 border-t"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#141414]' : 'border-gray-100 bg-gray-50'">
      <div class="max-w-4xl mx-auto px-6">
        <div class="text-center mb-12">
          <p class="text-xs font-bold uppercase tracking-widest mb-2"
            :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
            Mulai dalam 4 Langkah
          </p>
          <h2 class="text-3xl font-black">Cara Mulai Menggunakan<br>
            <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">ClassOS</span>
          </h2>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="step in steps" :key="step.num" class="relative text-center">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-3 border"
              :class="themeStore.mode === 'dark'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-50 border-red-200 text-red-500'">
              {{ step.num }}
            </div>
            <p class="font-bold text-sm mb-1" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
              {{ step.title }}
            </p>
            <p class="text-xs leading-relaxed" :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-500'">
              {{ step.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Paket -->
    <section class="py-20 border-t" :class="themeStore.mode === 'dark' ? 'border-gray-800' : 'border-gray-100'">
      <div class="max-w-5xl mx-auto px-6">
        <div class="text-center mb-12">
          <p class="text-xs font-bold uppercase tracking-widest mb-2"
            :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
            Pilih Paket
          </p>
          <h2 class="text-3xl font-black">Sesuaikan dengan<br>
            <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">Kebutuhan Sekolah</span>
          </h2>
        </div>
        <div class="grid sm:grid-cols-3 gap-5">
          <div v-for="p in paket" :key="p.name" class="relative p-6 rounded-2xl border flex flex-col" :class="p.highlight
            ? (themeStore.mode === 'dark' ? 'border-green-500/50 bg-green-500/5' : 'border-red-300 bg-red-50/50 shadow-xl shadow-red-100')
            : (themeStore.mode === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-200 bg-white')">

            <!-- Badge -->
            <span class="absolute -top-3 left-4 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
              :class="p.badgeColor">
              {{ p.badge }}
            </span>

            <p class="font-black text-lg mt-2" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
              {{ p.name }}
            </p>
            <p class="text-2xl font-black my-2"
              :class="p.highlight ? (themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500') : (themeStore.mode === 'dark' ? 'text-gray-300' : 'text-gray-700')">
              {{ p.price }}
            </p>
            <p class="text-xs mb-4" :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-500'">
              {{ p.desc }}
            </p>

            <ul class="space-y-2 flex-1 mb-6">
              <li v-for="item in p.items" :key="item" class="flex items-start gap-2 text-xs">
                <i class="ri-check-line mt-0.5 flex-shrink-0"
                  :class="p.highlight ? (themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500') : (themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-400')" />
                <span :class="themeStore.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'">{{ item }}</span>
              </li>
            </ul>

            <a :href="WA_URL" target="_blank"
              class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
              :class="p.highlight
                ? 'bg-red-500 dark:bg-green-600 text-white hover:bg-red-600 dark:hover:bg-green-500'
                : (themeStore.mode === 'dark' ? 'border border-gray-700 text-gray-300 hover:bg-gray-800' : 'border border-gray-300 text-gray-700 hover:bg-gray-50')">
              <i class="ri-whatsapp-line" />
              {{ p.cta }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Final -->
    <section class="py-20 border-t"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#141414]' : 'border-gray-100'">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <h2 class="text-3xl font-black mb-3">
          Mulai Transformasi Kelas Anda<br>
          <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
            menuju Kelas Pintar Indonesia!
          </span>
        </h2>
        <p class="text-sm mb-8" :class="themeStore.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'">
          Bersama mewujudkan 1 Juta Kelas Pintar Indonesia.
          Hubungi kami sekarang untuk konsultasi gratis.
        </p>
        <a :href="WA_URL" target="_blank"
          class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-105 shadow-xl"
          :class="themeStore.mode === 'dark' ? 'bg-green-600 hover:bg-green-500 shadow-green-900' : 'bg-red-500 hover:bg-red-600 shadow-red-200'">
          <i class="ri-whatsapp-line text-xl" />
          <div class="text-left">
            <div>INFORMASI LEBIH LANJUT</div>
            <div class="text-lg font-black">0821 4663 3466</div>
          </div>
        </a>
        <p class="text-xs mt-4" :class="themeStore.mode === 'dark' ? 'text-gray-600' : 'text-gray-400'">
          Hubungi kami melalui WhatsApp untuk informasi dan konsultasi
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t py-6"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#0a0a0a]' : 'border-gray-100 bg-gray-50'">
      <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="font-black text-sm">
          Class<span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">OS</span>
          <span class="font-normal text-xs ml-2"
            :class="themeStore.mode === 'dark' ? 'text-gray-600' : 'text-gray-400'">
            Smart Classroom Ecosystem
          </span>
        </span>
        <p class="text-xs" :class="themeStore.mode === 'dark' ? 'text-gray-600' : 'text-gray-400'">
          ClassOS – Belajar, Berkarakter, Berprestasi 💚
        </p>
        <div class="flex items-center gap-3">
          <span class="text-xs" :class="themeStore.mode === 'dark' ? 'text-gray-600' : 'text-gray-400'">
            Powered by
          </span>
          <span class="text-xs font-black" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-700'">
            <span class="text-green-600">BAMBOO</span>MEDIA
          </span>
          <span class="text-xs font-bold text-orange-500">SpeedID</span>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>