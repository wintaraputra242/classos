<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const WA_NUMBER = '6282146633466'
const WA_MESSAGE = encodeURIComponent('Halo, saya ingin mengetahui lebih lanjut tentang ClassOS dan Solusi Kelas Pintar (SKP).')
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`

const DRIVE_URL = 'https://drive.google.com/drive/folders/1ONPvBbYtcCXJARHXUcqHnGA0QXm24rhO'
const FORM_PREMIUM_URL = 'https://forms.gle/jrVQorJVoPVX33uQ8'
const SKP_IMAGE_URL = '/images/skp-flyer.jpeg'

const isScrolled = ref(false)
const showSKPModal = ref(false)

const steps = [
  {
    num: '01',
    title: 'Start Trial',
    desc: 'Dapatkan kode trial untuk mencoba, aktifkan ClassOS di Smartboard, ikuti Panduan (Sekolah, Guru, Siswa)',
  },
  {
    num: '02',
    title: 'Pilih Paket',
    desc: 'Kami bantu memilih paket yang paling sesuai anggaran dan kebutuhan (jumlah perangkat dan sesi mengajar)',
  },
  {
    num: '03',
    title: 'On-Boarding',
    desc: 'Adaptasi ClassOS di Sekolah: Akun Sekolah, Akses Dashboard, Dukungan Teknis',
  },
  {
    num: '04',
    title: '1st Year Journey',
    desc: 'Laporan berkala: Sesi Mengajar, Guru aktif, Siswa aktif, Durasi belajar, Quality score, Jumlah Playlist & Content',
  },
  {
    num: '05',
    title: 'Review & Analytics',
    desc: 'Analisa data, evaluasi manfaat pembelajaran, serta persiapan Renewal Token tahun berikutnya',
  },
]

function onScroll() {
  isScrolled.value = window.scrollY > 60
}

function downloadSKP() {
  const link = document.createElement('a')
  link.href = SKP_IMAGE_URL
  link.download = 'Solusi-Kelas-Pintar-ClassOS.jpg'
  link.click()
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="min-h-screen font-poppins"
    :class="themeStore.mode === 'dark' ? 'bg-[#0f0f0f] text-white' : 'bg-white text-gray-900'">

    <!-- Navbar -->
    <!-- <nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-500" :class="isScrolled
      ? (themeStore.mode === 'dark'
        ? 'bg-[#0f0f0f]/95 border-b border-gray-800 shadow-xl backdrop-blur-sm'
        : 'bg-white/95 border-b border-gray-200 shadow-md backdrop-blur-sm')
      : 'bg-gradient-to-b from-black/40 to-transparent backdrop-blur-none'">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl font-black" :class="isScrolled
            ? (themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900')
            : 'text-white'">
            Class<span :class="themeStore.mode === 'dark' || !isScrolled ? 'text-green-400' : 'text-red-500'">OS</span>
          </span>
          <span class="text-[10px] hidden sm:block" :class="isScrolled
            ? (themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-400')
            : 'text-white/70'">
            AI Classroom Operating System
          </span>
        </div>
        <a :href="WA_URL" target="_blank"
          class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-colors" :class="isScrolled
            ? (themeStore.mode === 'dark' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-500 hover:bg-red-600')
            : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30'">
          <i class="ri-whatsapp-line" />
          Hubungi Kami
        </a>
      </div>
    </nav> -->

    <!-- ===== HERO: Image Utama ClassOS ===== -->
    <section class="relative">
      <div class="w-full">
        <!-- Gambar full tanpa crop -->
        <img src="/images/classos-hero.jpeg" alt="ClassOS — Guru Super, kini hadir di seluruh Nusantara"
          class="w-full h-auto block" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
      </div>

      <!-- Text expose di bawah gambar — lebih besar dan mencolok -->
      <div class="py-10 text-center" :class="themeStore.mode === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'">
        <p class="text-sm font-bold uppercase tracking-widest mb-2"
          :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
          Program Nasional Transformasi Pendidikan
        </p>
        <h2 class="text-2xl lg:text-4xl font-black leading-tight"
          :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
          ClassOS mendukung target
          <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
            1 Juta Smartboard (IFP)
          </span>
          <br class="hidden lg:block" />
          di Seluruh Indonesia
        </h2>
      </div>

      <!-- Divider -->
      <div class="h-px" :class="themeStore.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-200'" />
    </section>

    <!-- ===== VIDEO YOUTUBE ===== -->
    <section class="py-16 border-b"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#0f0f0f]' : 'border-gray-100 bg-white'">
      <div class="max-w-4xl mx-auto px-6">
        <div class="aspect-video rounded-2xl overflow-hidden border shadow-2xl"
          :class="themeStore.mode === 'dark' ? 'border-gray-800' : 'border-gray-200'">
          <iframe class="w-full h-full" src="https://www.youtube.com/embed/FlerC_MDQL0?si=s9m6mabaWL7BKDTb"
            title="ClassOS Video" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen />
        </div>
      </div>
    </section>

    <!-- ===== CARA MULAI MENGGUNAKAN CLASSOS ===== -->
    <section class="py-20 border-b"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#141414]' : 'border-gray-100 bg-gray-50'">
      <div class="max-w-6xl mx-auto px-6">

        <div class="text-center mb-12">
          <p class="text-xs font-bold uppercase tracking-widest mb-2"
            :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
            Journey Bersama ClassOS
          </p>
          <h2 class="text-3xl font-black">
            Cara Mulai Menggunakan<br>
            <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">ClassOS</span>
          </h2>
        </div>

        <!-- Steps -->
        <div class="relative">
          <!-- Connector line -->
          <div class="hidden lg:block absolute top-10 left-0 right-0 h-px"
            :class="themeStore.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-200'" style="margin: 0 10%;" />

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div v-for="step in steps" :key="step.num" class="relative flex flex-col items-center text-center">
              <!-- Number bubble -->
              <div
                class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black mb-4 border-2 relative z-10"
                :class="themeStore.mode === 'dark'
                  ? 'bg-[#141414] border-green-500/50 text-green-400'
                  : 'bg-white border-red-300 text-red-500 shadow-md'">
                {{ step.num }}
              </div>
              <p class="font-black text-sm mb-2" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
                {{ step.title }}
              </p>
              <p class="text-xs leading-relaxed"
                :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-500'">
                {{ step.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== SESUAIKAN DENGAN KEBUTUHAN ANDA ===== -->
    <section class="py-20 border-b"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#0f0f0f]' : 'border-gray-100 bg-white'">
      <div class="max-w-5xl mx-auto px-6">

        <div class="text-center mb-12">
          <p class="text-xs font-bold uppercase tracking-widest mb-2"
            :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
            Pilih Paket
          </p>
          <h2 class="text-3xl font-black">
            Sesuaikan dengan<br>
            <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">Kebutuhan Anda</span>
          </h2>
        </div>

        <div class="grid sm:grid-cols-3 gap-6">

          <!-- Paket 1: Coba Gratis / Trial -->
          <div class="relative flex flex-col p-6 rounded-2xl border"
            :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-200 bg-white shadow-sm'">
            <span class="absolute -top-3 left-4 px-2.5 py-1 rounded-full text-[10px] font-black text-white bg-blue-500">
              Coba Gratis
            </span>
            <p class="font-black text-lg mt-2" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
              Trial</p>
            <p class="text-2xl font-black my-2" :class="themeStore.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'">
              Gratis</p>
            <p class="text-xs mb-5" :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-500'">
              Coba ClassOS tanpa biaya, cocok untuk mengenal platform sebelum berlangganan.
            </p>
            <ul class="space-y-2 flex-1 mb-6 text-xs">
              <li
                v-for="item in ['Akses konten terbatas', 'Mode trial 30 hari', 'Tanpa token sekolah', 'Panduan lengkap tersedia', 'Support dasar']"
                :key="item" class="flex items-start gap-2">
                <i class="ri-check-line mt-0.5 text-blue-400 flex-shrink-0" />
                <span :class="themeStore.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'">{{ item }}</span>
              </li>
            </ul>
            <a :href="DRIVE_URL" target="_blank"
              class="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:scale-105 border"
              :class="themeStore.mode === 'dark' ? 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10' : 'border-blue-300 text-blue-600 hover:bg-blue-50'">
              <i class="ri-download-line" />
              Download Panduan
            </a>
          </div>

          <!-- Paket 2: Paling Populer / Premium -->
          <div class="relative flex flex-col p-6 rounded-2xl border" :class="themeStore.mode === 'dark'
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-red-300 bg-red-50/50 shadow-xl shadow-red-100'">
            <span class="absolute -top-3 left-4 px-2.5 py-1 rounded-full text-[10px] font-black text-white bg-red-500">
              Paling Populer
            </span>
            <p class="font-black text-lg mt-2" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">
              Premium</p>
            <p class="text-2xl font-black my-2" :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
              Paket Layanan</p>
            <p class="text-xs mb-5" :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-500'">
              Solusi lengkap untuk sekolah yang siap hadirkan Kelas Pintar dengan AI Teacher Assistant.
            </p>
            <ul class="space-y-2 flex-1 mb-6 text-xs">
              <li
                v-for="item in ['Akses penuh konten StikerNews', 'AI Briefing & Summary otomatis', 'Listening & Recording kelas', 'Class Selfie & laporan sesi', 'Multi device & multi kelas', 'Support prioritas']"
                :key="item" class="flex items-start gap-2">
                <i class="ri-check-line mt-0.5 flex-shrink-0"
                  :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'" />
                <span :class="themeStore.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'">{{ item }}</span>
              </li>
            </ul>
            <a :href="FORM_PREMIUM_URL" target="_blank"
              class="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 shadow-lg"
              :class="themeStore.mode === 'dark' ? 'bg-green-600 hover:bg-green-500 shadow-green-900' : 'bg-red-500 hover:bg-red-600 shadow-red-200'">
              <i class="ri-file-list-3-line" />
              Dapatkan Premium
            </a>
          </div>

          <!-- Paket 3: Solusi Kelas Pintar -->
          <div class="relative flex flex-col p-6 rounded-2xl border"
            :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-200 bg-white shadow-sm'">
            <span
              class="absolute -top-3 left-4 px-2.5 py-1 rounded-full text-[10px] font-black text-white bg-green-600">
              Solusi Kelas Pintar
            </span>
            <p class="font-black text-lg mt-2" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-900'">SKP
            </p>
            <p class="text-2xl font-black my-2"
              :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-green-600'">Hubungi Kami</p>
            <p class="text-xs mb-5" :class="themeStore.mode === 'dark' ? 'text-gray-500' : 'text-gray-500'">
              Paket lengkap perangkat Smart TV + konten ClassOS untuk transformasi kelas digital.
            </p>
            <ul class="space-y-2 flex-1 mb-6 text-xs">
              <li
                v-for="item in ['Smart TV Full HD / 4K', 'Wireless Keyboard & Mouse', 'Akses ClassOS Premium', 'Instalasi & setup perangkat', 'Garansi & dukungan teknis']"
                :key="item" class="flex items-start gap-2">
                <i class="ri-check-line mt-0.5 text-green-500 flex-shrink-0" />
                <span :class="themeStore.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'">{{ item }}</span>
              </li>
            </ul>
            <button @click="showSKPModal = true"
              class="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:scale-105 border"
              :class="themeStore.mode === 'dark' ? 'border-green-500/50 text-green-400 hover:bg-green-500/10' : 'border-green-400 text-green-700 hover:bg-green-50'">
              <i class="ri-image-line" />
              Lihat Info SKP
            </button>
          </div>

        </div>
      </div>
    </section>

    <!-- ===== CTA FINAL ===== -->
    <section class="py-20 border-b"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#141414]' : 'border-gray-100 bg-gray-50'">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <p class="text-xs font-bold uppercase tracking-widest mb-3"
          :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">
          Mulai Sekarang
        </p>
        <h2 class="text-3xl font-black mb-3">
          Mulai Transformasi AI
          <span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'"> Sekarang</span>
        </h2>
        <p class="text-sm mb-8" :class="themeStore.mode === 'dark' ? 'text-gray-400' : 'text-gray-500'">
          Bersama mewujudkan Generasi Hebat Indonesia.
          Hubungi kami untuk konsultasi gratis.
        </p>
        <a :href="WA_URL" target="_blank"
          class="inline-flex items-center gap-4 px-8 py-5 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-2xl"
          :class="themeStore.mode === 'dark' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/50' : 'bg-red-500 hover:bg-red-600 shadow-red-200'">
          <i class="ri-whatsapp-line text-3xl" />
          <div class="text-left">
            <div class="text-xs opacity-80 font-normal">INFORMASI LEBIH LANJUT</div>
            <div class="text-xl font-black tracking-wide">WA: 0821 4663 3466</div>
          </div>
        </a>
        <p class="text-xs mt-4" :class="themeStore.mode === 'dark' ? 'text-gray-600' : 'text-gray-400'">
          Hubungi kami melalui WhatsApp untuk informasi dan konsultasi
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t py-6"
      :class="themeStore.mode === 'dark' ? 'border-gray-800 bg-[#0a0a0a]' : 'border-gray-100 bg-white'">
      <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="font-black text-sm">
          Class<span :class="themeStore.mode === 'dark' ? 'text-green-400' : 'text-red-500'">OS</span>
          <span class="font-normal text-xs ml-2"
            :class="themeStore.mode === 'dark' ? 'text-gray-600' : 'text-gray-400'">
            AI Classroom Operating System
          </span>
        </span>
        <p class="text-xs" :class="themeStore.mode === 'dark' ? 'text-gray-600' : 'text-gray-400'">
          Bersama Mewujudkan Generasi Hebat Indonesia 💚
        </p>
        <div class="flex items-center gap-3">
          <span class="text-xs font-black" :class="themeStore.mode === 'dark' ? 'text-white' : 'text-gray-700'">
            <span class="text-green-600">BAMBOO</span>MEDIA
          </span>
          <span class="text-xs font-bold text-orange-500">SpeedID</span>
        </div>
      </div>
    </footer>

    <!-- Modal SKP Image -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showSKPModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          @click.self="showSKPModal = false">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showSKPModal = false" />
          <div class="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <!-- Close -->
            <button @click="showSKPModal = false"
              class="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors">
              <i class="ri-close-line text-white text-sm" />
            </button>
            <!-- Gambar SKP -->
            <img :src="SKP_IMAGE_URL" alt="Solusi Kelas Pintar" class="w-full h-auto block" />
            <!-- Tombol WA di bawah -->
            <div class="bg-white dark:bg-zinc-900 px-4 py-3 flex gap-2 justify-center">
              <button @click="downloadSKP"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-bold dark:text-gray-300 text-gray-700">
                <i class="ri-download-line" />
                Download
              </button>
              <a :href="WA_URL" target="_blank"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 transition-colors text-white text-sm font-bold">
                <i class="ri-whatsapp-line" />
                0821 4663 3466
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
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