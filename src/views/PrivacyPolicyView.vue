<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">

    <!-- Header -->
    <div class="bg-red-500 dark:bg-emerald-600 px-6 py-12 text-center">
      <span
        class="inline-block bg-white/15 text-white text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
        📋 Dokumen Resmi
      </span>
      <h1 class="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Kebijakan Privasi</h1>
      <p class="text-red-100 dark:text-emerald-100 text-sm">StikerNews &amp; ClassOS — Berlaku per 15 Juni 2026</p>
    </div>

    <div class="max-w-3xl mx-auto px-5 pb-20">

      <!-- Meta bar -->
      <div
        class="flex flex-wrap items-center justify-between gap-2 py-4 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 mb-8">
        <span>Terakhir diperbarui: <strong class="text-gray-700 dark:text-gray-300">15 Juni 2026</strong></span>
        <span>Versi: <strong class="text-gray-700 dark:text-gray-300">1.0</strong></span>
        <span>Bahasa: <strong class="text-gray-700 dark:text-gray-300">Indonesia</strong></span>
      </div>

      <!-- Intro -->
      <div
        class="bg-red-50 dark:bg-emerald-950/40 border-l-4 border-red-500 dark:border-emerald-500 rounded-lg px-5 py-4 text-sm text-red-800 dark:text-emerald-300 mb-8">
        Kebijakan Privasi ini menjelaskan bagaimana StikerNews dan ClassOS mengumpulkan, menggunakan, dan melindungi
        informasi Anda saat menggunakan aplikasi kami. Dengan menggunakan aplikasi ini, Anda menyetujui ketentuan dalam
        kebijakan ini.
      </div>

      <!-- TOC -->
      <div
        class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-l-4 border-l-red-500 dark:border-l-emerald-500 rounded-lg px-5 py-4 mb-10">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Daftar Isi</p>
        <ol class="list-decimal list-inside space-y-1.5">
          <li v-for="(item, i) in toc" :key="i">
            <a :href="`#s${i + 1}`" class="text-sm text-red-600 dark:text-emerald-400 hover:underline">
              {{ item }}
            </a>
          </li>
        </ol>
      </div>

      <div class="space-y-10">

        <!-- 1 -->
        <section id="s1">
          <SectionHeader num="1" title="Informasi yang Kami Kumpulkan" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Kami mengumpulkan informasi yang diperlukan untuk
            memberikan layanan yang optimal kepada Anda.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoCard icon="🔑" title="Token Identitas"
              desc="Token unik yang digunakan untuk mengidentifikasi dan mengautentikasi pengguna saat login." />
            <InfoCard icon="📱" title="Data Perangkat"
              desc="Jenis perangkat, sistem operasi, dan ID perangkat unik (Phone ID)." />
            <InfoCard icon="🎧" title="Data Penggunaan"
              desc="Riwayat konten yang diputar, favorit, dan interaksi dalam aplikasi." />
            <InfoCard icon="📍" title="Data Lokasi" desc="Lokasi umum yang digunakan untuk personalisasi konten." />
          </div>
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 2 -->
        <section id="s2">
          <SectionHeader num="2" title="Sistem Login & Identitas Pengguna" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Aplikasi StikerNews dan ClassOS menggunakan sistem autentikasi berbasis <strong
              class="text-gray-800 dark:text-gray-200">token unik</strong> untuk menentukan identitas setiap pengguna.
            Berikut cara kerjanya:
          </p>
          <BulletList :items="[
            'Setiap pengguna diberikan token unik yang berfungsi sebagai identitas digital di dalam sistem',
            'Token digunakan sebagai kunci autentikasi pada setiap permintaan ke server — menggantikan kebutuhan username dan password konvensional',
            'Token disimpan secara aman di perangkat pengguna dan dikirimkan secara terenkripsi ke server pada setiap sesi',
            'Jika token tidak valid atau kedaluwarsa, pengguna akan diminta untuk melakukan autentikasi ulang',
            'Token dapat dicabut sewaktu-waktu oleh sistem atau atas permintaan pengguna untuk alasan keamanan',
          ]" />
          <div
            class="mt-4 bg-red-50 dark:bg-emerald-950/40 rounded-lg px-4 py-3 text-sm text-red-800 dark:text-emerald-300">
            Token identitas tidak mengandung informasi sensitif seperti kata sandi. Token hanya digunakan untuk
            memverifikasi bahwa sesi yang berjalan adalah sesi yang sah dari pengguna yang terdaftar.
          </div>
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 3 -->
        <section id="s3">
          <SectionHeader num="3" title="Cara Kami Menggunakan Informasi" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Informasi yang dikumpulkan digunakan semata-mata
            untuk keperluan berikut:</p>
          <BulletList :items="[
            'Menyediakan dan menjalankan layanan aplikasi StikerNews dan ClassOS',
            'Mengautentikasi identitas pengguna melalui token login yang aman',
            'Mempersonalisasi konten berita, audio, dan podcast sesuai minat',
            'Mengelola program loyalitas, stamp, dan redeem hadiah',
            'Menganalisis penggunaan aplikasi untuk peningkatan layanan',
            'Mengirimkan pembaruan penting terkait layanan',
          ]" />
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 4 -->
        <section id="s4">
          <SectionHeader num="4" title="Penyimpanan & Keamanan Data" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Kami berkomitmen menjaga keamanan data Anda dengan
            standar keamanan industri:</p>
          <BulletList :items="[
            'Data disimpan di server yang berlokasi di Indonesia dan diproteksi dengan enkripsi SSL/TLS',
            'Token identitas pengguna disimpan secara terenkripsi dan tidak dapat dibaca oleh pihak yang tidak berwenang',
            'Akses data dibatasi hanya untuk tim yang berwenang dengan sistem autentikasi berlapis',
            'Kami tidak menyimpan data kartu kredit atau informasi pembayaran sensitif',
            'Riwayat aktivitas disimpan selama akun aktif dan dihapus 90 hari setelah akun ditutup',
          ]" />
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 5 -->
        <section id="s5">
          <SectionHeader num="5" title="Berbagi Data dengan Pihak Ketiga" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Kami tidak menjual atau menyewakan data pribadi Anda.
            Data hanya dibagikan dalam kondisi terbatas:</p>
          <BulletList :items="[
            'Firebase (Google): digunakan untuk layanan notifikasi dan analitik dasar aplikasi',
            'Penyedia Hosting: server penyimpanan data yang terikat perjanjian kerahasiaan dengan kami',
            'Kewajiban Hukum: data dapat dibagikan kepada otoritas berwenang jika diwajibkan oleh hukum yang berlaku di Indonesia',
          ]" />
          <div
            class="mt-4 bg-red-50 dark:bg-emerald-950/40 rounded-lg px-4 py-3 text-sm text-red-800 dark:text-emerald-300">
            Kami tidak bekerja sama dengan jaringan iklan pihak ketiga. Aplikasi ini bebas dari pelacak iklan eksternal.
          </div>
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 6 -->
        <section id="s6">
          <SectionHeader num="6" title="Izin Aplikasi" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Aplikasi kami meminta izin berikut dengan tujuan yang
            transparan:</p>
          <BulletList :items="[
            'Mikrofon: digunakan untuk fitur pengenalan suara (voice search dan mode mendengarkan). Rekaman tidak disimpan ke server.',
            'Kamera: digunakan untuk scan QR Code pada fitur verifikasi dan penukaran hadiah',
            'Notifikasi: digunakan untuk mengirimkan berita terbaru dan informasi hadiah. Dapat dinonaktifkan kapan saja melalui pengaturan perangkat.',
            'Penyimpanan: digunakan untuk menyimpan cache konten agar dapat diakses secara offline',
            'Internet: diperlukan untuk memuat konten, audio, dan sinkronisasi data akun',
          ]" />
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 7 -->
        <section id="s7">
          <SectionHeader num="7" title="Hak Pengguna" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Sebagai pengguna, Anda memiliki hak penuh atas data
            pribadi Anda:</p>
          <BulletList :items="[
            'Hak Akses: meminta salinan data pribadi yang kami miliki tentang Anda',
            'Hak Koreksi: memperbarui atau memperbaiki data yang tidak akurat',
            'Hak Penghapusan: meminta penghapusan akun dan seluruh data terkait termasuk token identitas',
            'Hak Portabilitas: meminta data dalam format yang dapat dibaca mesin',
            'Hak Keberatan: menolak pemrosesan data untuk tujuan tertentu',
            'Hak Pencabutan Token: meminta pencabutan token identitas aktif untuk alasan keamanan',
          ]" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">Untuk menggunakan hak-hak di atas, hubungi kami
            melalui informasi kontak di bagian akhir dokumen ini. Kami akan merespons dalam 14 hari kerja.</p>
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 8 -->
        <section id="s8">
          <SectionHeader num="8" title="Privasi Anak" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Aplikasi StikerNews dan ClassOS ditujukan untuk
            pengguna berusia 13 tahun ke atas. Kami tidak secara sengaja mengumpulkan data pribadi dari anak-anak di
            bawah usia 13 tahun.</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Jika Anda adalah orang tua atau wali dan mengetahui
            bahwa anak Anda telah menggunakan atau mendaftarkan token tanpa persetujuan Anda, segera hubungi kami agar
            kami dapat menonaktifkan token dan menghapus data tersebut.</p>
          <div class="bg-red-50 dark:bg-emerald-950/40 rounded-lg px-4 py-3 text-sm text-red-800 dark:text-emerald-300">
            Untuk pengguna di bawah 17 tahun, kami merekomendasikan penggunaan aplikasi di bawah pengawasan orang tua
            atau wali.
          </div>
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 9 -->
        <section id="s9">
          <SectionHeader num="9" title="Perubahan Kebijakan" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Kami dapat memperbarui Kebijakan Privasi ini
            sewaktu-waktu. Jika ada perubahan signifikan, kami akan memberitahu Anda melalui:</p>
          <BulletList :items="[
            'Notifikasi dalam aplikasi',
            'Pembaruan tanggal Terakhir Diperbarui di bagian atas halaman ini',
            'Notifikasi yang dikirimkan ke perangkat terdaftar',
          ]" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">Penggunaan berkelanjutan atas aplikasi setelah
            perubahan kebijakan dianggap sebagai persetujuan terhadap kebijakan yang diperbarui.</p>
        </section>

        <hr class="border-gray-100 dark:border-gray-800" />

        <!-- 10 -->
        <section id="s10">
          <SectionHeader num="10" title="Hubungi Kami" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Jika Anda memiliki pertanyaan, keluhan, atau
            permintaan terkait privasi data Anda, jangan ragu menghubungi kami:</p>
          <div class="space-y-3">
            <ContactCard icon="✉️" title="Email Dukungan" value="privacy@stikernews.id"
              href="mailto:privacy@stikernews.id" />
            <ContactCard icon="🌐" title="Website Resmi" value="https://stikernews.id" href="https://stikernews.id" />
            <ContactCard icon="📍" title="Alamat" value="Indonesia" />
          </div>
        </section>

      </div>
    </div>

    <!-- Footer -->
    <div
      class="text-center text-xs text-gray-400 dark:text-gray-600 py-6 border-t border-gray-100 dark:border-gray-800">
      © {{ new Date().getFullYear() }} StikerNews &amp; ClassOS. Seluruh hak dilindungi undang-undang. · Kebijakan ini
      berlaku untuk aplikasi
      Android dan WebView.
    </div>

  </div>
</template>

<script setup lang="ts">
const toc = [
  'Informasi yang Kami Kumpulkan',
  'Sistem Login & Identitas Pengguna',
  'Cara Kami Menggunakan Informasi',
  'Penyimpanan & Keamanan Data',
  'Berbagi Data dengan Pihak Ketiga',
  'Izin Aplikasi',
  'Hak Pengguna',
  'Privasi Anak',
  'Perubahan Kebijakan',
  'Hubungi Kami',
]
</script>

<script lang="ts">
import { defineComponent, h } from 'vue'

const SectionHeader = defineComponent({
  props: { num: String, title: String },
  setup(props) {
    return () => h('div', { class: 'flex items-center gap-3 mb-4' }, [
      h('div', { class: 'w-8 h-8 rounded-full bg-red-100 dark:bg-emerald-950 text-red-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0' }, props.num),
      h('h2', { class: 'text-base font-bold tracking-tight' }, props.title),
    ])
  }
})

const BulletList = defineComponent({
  props: { items: Array as () => string[] },
  setup(props) {
    return () => h('ul', { class: 'space-y-0 divide-y divide-gray-100 dark:divide-gray-800' },
      props.items?.map(item =>
        h('li', { class: 'flex items-start gap-3 py-2.5 text-sm text-gray-700 dark:text-gray-300' }, [
          h('span', { class: 'mt-2 w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-emerald-500 flex-shrink-0' }),
          item,
        ])
      )
    )
  }
})

const InfoCard = defineComponent({
  props: { icon: String, title: String, desc: String },
  setup(props) {
    return () => h('div', { class: 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4' }, [
      h('div', { class: 'text-2xl mb-2' }, props.icon),
      h('h3', { class: 'text-sm font-bold text-gray-800 dark:text-gray-200 mb-1' }, props.title),
      h('p', { class: 'text-xs text-gray-500 dark:text-gray-400' }, props.desc),
    ])
  }
})

const ContactCard = defineComponent({
  props: { icon: String, title: String, value: String, href: String },
  setup(props) {
    return () => h('div', { class: 'flex items-center gap-4 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3' }, [
      h('div', { class: 'w-10 h-10 rounded-full bg-red-50 dark:bg-emerald-950 flex items-center justify-center text-lg flex-shrink-0' }, props.icon),
      h('div', [
        h('p', { class: 'text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5' }, props.title),
        props.href
          ? h('a', { href: props.href, class: 'text-sm text-red-600 dark:text-emerald-400' }, props.value)
          : h('p', { class: 'text-sm text-gray-700 dark:text-gray-300' }, props.value),
      ])
    ])
  }
})

export { SectionHeader, BulletList, InfoCard, ContactCard }
</script>