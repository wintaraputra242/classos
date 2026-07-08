<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppRightSidebar from '@/components/layout/AppRightSidebar.vue'
import BottomPlayer from '@/components/player/BottomPlayer.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const showTrialModal = ref(true)
const trialStep = ref(1)
const surveySubmitting = ref(false)

const surveyForm = ref({
  namaSekolah: '',
  namaAnda: '',
  nomorWA: '',
  id_provinsi: '' as string | number,
  provinsi: '',
  id_kabupaten_kota: '' as string | number,
  kabupaten: '',
  jumlahKelas: '',
  jumlahSmartboard: '',
  pakaiSmartTV: '',
  pakaiAC: '',
})

const isSurveyValid = computed(() => {
  const f = surveyForm.value
  return !!(
    f.namaSekolah.trim() &&
    f.namaAnda.trim() &&
    f.nomorWA.trim() &&
    f.id_provinsi &&       // cukup cek ID-nya saja
    f.id_kabupaten_kota && // cukup cek ID-nya saja
    f.jumlahKelas &&
    f.jumlahSmartboard &&
    f.pakaiSmartTV &&
    f.pakaiAC
  )
})

// async function submitSurvey() {
//   if (!isSurveyValid.value) return
//   surveySubmitting.value = true
//   try {
//     // Kirim ke API jika ada, atau simpan lokal dulu
//     // await api.submitSurvey({ ...surveyForm.value, token: auth.token })
//     console.log('Survey submitted:', surveyForm.value)
//     await new Promise(r => setTimeout(r, 800)) // simulasi
//     localStorage.setItem('sn_trial_survey_done', '1')
//     showTrialModal.value = false
//   } finally {
//     surveySubmitting.value = false
//   }
// }

watch(showTrialModal, async (val) => {
  if (val) await auth.fetchProv()
}, { immediate: true })

// Watch provinsi — load kabupaten saat provinsi dipilih
watch(() => surveyForm.value.id_provinsi, async (id) => {
  if (id) {
    const split = id.toString().split('-')
    await auth.fetchKab(split[0] as string)
  }
})

const showSuccessToast = ref(false)

async function submitSurvey() {
  if (!isSurveyValid.value) return
  surveySubmitting.value = true

  try {
    const result = await auth.submitFormTrial({
      nama_sekolah: surveyForm.value.namaSekolah,
      nama_pengisi: surveyForm.value.namaAnda,
      nomor_wa: surveyForm.value.nomorWA,
      id_provinsi: Number((surveyForm.value.id_provinsi as string).split('-')[0]),
      provinsi: (surveyForm.value.id_provinsi as string).split('-')[1] as string,
      id_kabupaten_kota: Number((surveyForm.value.id_kabupaten_kota as string).split('-')[0]),
      kabupaten_kota: (surveyForm.value.id_kabupaten_kota as string).split('-')[1] as string,
      jumlah_kelas: Number(surveyForm.value.jumlahKelas),
      jumlah_smartboard: Number(surveyForm.value.jumlahSmartboard),
      pakai_smart_tv: Number(surveyForm.value.pakaiSmartTV),
      pakai_ac: Number(surveyForm.value.pakaiAC),
    })
    if (result.success) {
      showTrialModal.value = false

      // Tampilkan toast
      showSuccessToast.value = true
      isSubmitFormTrial.value = true
      setTimeout(() => showSuccessToast.value = false, 3500)
    }
    else console.error(result.error)
  } finally {
    surveySubmitting.value = false
  }
}

function onProvChange() {
  surveyForm.value.id_kabupaten_kota = ''
  surveyForm.value.kabupaten = ''
  const found = auth.provList.find(p => p.id === surveyForm.value.id_provinsi)
  surveyForm.value.provinsi = found?.nama ?? ''
}

// Watch kabupaten untuk sync namanya
watch(() => surveyForm.value.id_kabupaten_kota, (id) => {
  const found = auth.kabList.find(k => k.id === id)
  surveyForm.value.kabupaten = found?.nama ?? ''
})

const isSubmitFormTrial = ref(localStorage.getItem('sn_trial_survey_done') === '1' ? true : false)

onMounted(() => {
  // Tampilkan modal jika: sudah login, token berstatus trial, belum pernah isi survei
  const surveyDone = localStorage.getItem('sn_trial_survey_done')
  const isTrial = auth.isLoggedIn && (auth.siteName?.toLowerCase().includes('trial') || auth.token === 'DEMO-001')

  if (isTrial && !surveyDone) {
    showTrialModal.value = true
  }
})
</script>


<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />
      <div class="flex flex-1 overflow-hidden">
        <main class="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 pb-28 dark:bg-brand-dark bg-gray-50">
          <RouterView v-slot="{ Component, route }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </main>
        <AppRightSidebar />
      </div>
    </div>
  </div>
  <BottomPlayer />

  <!-- Modal Trial -->
  <Teleport to="body">
    <!-- v-if="auth.isTrial && !isSubmitFormTrial" -->
    <Transition name="fade">
      <div v-if="auth.isTrial && !isSubmitFormTrial"
        class=" fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <Transition name="slide-up" mode="out-in">

          <!-- Step 1: Pemberitahuan Trial -->
          <div v-if="trialStep === 1" key="step1"
            class="w-full max-w-md rounded-2xl dark:bg-zinc-900 bg-white shadow-2xl overflow-auto">
            <!-- Header hijau -->
            <div class="bg-gradient-to-br from-brand-green to-green-400 p-6 text-center">
              <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <i class="ri-vip-crown-2-fill text-3xl text-white" />
              </div>
              <h2 class="text-xl font-black text-white">Akun Trial</h2>
              <p class="text-green-100 text-sm mt-1">ClassOS</p>
            </div>

            <!-- Body -->
            <div class="p-6 text-center">
              <p class="text-sm dark:text-gray-300 text-gray-600 leading-relaxed mb-2">
                Selamat datang! Anda sedang menggunakan <strong class="dark:text-white text-gray-900">akun
                  trial</strong> ClassOS.
              </p>
              <p class="text-sm dark:text-gray-400 text-gray-500 leading-relaxed mb-6">
                Nikmati semua fitur secara gratis selama masa trial. Untuk mendapatkan akses penuh dan permanen, hubungi
                tim kami.
              </p>

              <div class="dark:bg-zinc-800 bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div class="flex items-center gap-2 text-xs dark:text-gray-300 text-gray-600">
                  <i class="ri-check-line text-brand-green" /> Akses semua konten StikerNews
                </div>
                <div class="flex items-center gap-2 text-xs dark:text-gray-300 text-gray-600">
                  <i class="ri-check-line text-brand-green" /> Lagu Edukasi & Podcast tersedia
                </div>
                <div class="flex items-center gap-2 text-xs dark:text-gray-400 text-gray-400">
                  <i class="ri-check-line text-brand-green" /> Favorite dan Playlist
                </div>
                <div class="flex items-center gap-2 text-xs dark:text-gray-300 text-gray-600">
                  <i class="ri-check-line text-brand-green" /> Fitur Listening & Briefing aktif
                </div>
              </div>

              <button @click="trialStep = 2"
                class="w-full py-3 rounded-xl bg-brand-green text-white font-bold text-sm hover:bg-green-400 transition-colors flex items-center justify-center gap-2">
                Lanjutkan
                <i class="ri-arrow-right-line" />
              </button>
            </div>
          </div>

          <!-- Step 2: Form Survei -->
          <div v-else-if="trialStep === 2" key="step2"
            class="w-full max-w-lg rounded-2xl dark:bg-zinc-900 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <!-- Header -->
            <div class="p-5 border-b dark:border-zinc-800 border-gray-100 flex-shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center">
                  <i class="ri-survey-line text-brand-green text-sm" />
                </div>
                <div>
                  <h2 class="text-sm font-black dark:text-white text-gray-900">Formulir Data Sekolah</h2>
                  <p class="text-[10px] dark:text-gray-400 text-gray-500">Bantu kami mengenal sekolah Anda lebih baik
                  </p>
                </div>
              </div>
            </div>

            <!-- Form scroll -->
            <div class="overflow-y-auto scrollbar-hide p-5 space-y-4 flex-1">

              <!-- Nama Sekolah -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Nama Sekolah <span class="text-red-400">*</span>
                </label>
                <input v-model="surveyForm.namaSekolah" type="text" placeholder="Contoh: SMPN 1 Bangli"
                  class="form-input" />
              </div>

              <!-- Nama Anda -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Nama Anda <span class="text-red-400">*</span>
                </label>
                <input v-model="surveyForm.namaAnda" type="text" placeholder="Nama lengkap Anda" class="form-input" />
              </div>

              <!-- Nomor WA -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Nomor WhatsApp <span class="text-red-400">*</span>
                </label>
                <div class="flex gap-2">
                  <span
                    class="flex items-center px-3 rounded-xl dark:bg-zinc-800 bg-gray-100 dark:border-zinc-700 border-gray-200 border text-xs dark:text-gray-400 text-gray-500 flex-shrink-0">
                    +62
                  </span>
                  <input v-model="surveyForm.nomorWA" type="tel" placeholder="0812XXXXXXXX" class="form-input flex-1"
                    @input="surveyForm.nomorWA = surveyForm.nomorWA.replace(/[^0-9]/g, '')" />
                </div>
              </div>

              <!-- Provinsi -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Provinsi <span class="text-red-400">*</span>
                </label>
                <select v-model="surveyForm.id_provinsi" @change="onProvChange" class="form-input"
                  :disabled="auth.loadingProv">
                  <option value="" disabled>{{ auth.loadingProv ? 'Memuat...' : 'Pilih provinsi' }}</option>
                  <option v-for="prov in auth.provList" :key="prov.id_prov" :value="`${prov.id_prov}-${prov.prov}`">
                    {{ prov.prov }}
                  </option>
                </select>
              </div>

              <!-- Kabupaten/Kota -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Kabupaten / Kota <span class="text-red-400">*</span>
                </label>
                <select v-model="surveyForm.id_kabupaten_kota" class="form-input"
                  :disabled="!surveyForm.id_provinsi || auth.loadingKab">
                  <option value="" disabled>
                    {{ !surveyForm.id_provinsi ?
                      'Pilih provinsi dulu' : auth.loadingKab ?
                        'Memuat...' : 'Pilih kabupaten/kota' }}
                  </option>
                  <option v-for="kab in auth.kabList" :key="kab.id_kab" :value="`${kab.id_kab}-${kab.kab}`">
                    {{ kab.kab }}
                  </option>
                </select>
              </div>

              <!-- Jumlah Kelas -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Berapa jumlah kelas yang dimiliki sekolah? <span class="text-red-400">*</span>
                </label>
                <select v-model="surveyForm.jumlahKelas" class="form-input">
                  <option value="" disabled>Pilih jumlah kelas</option>
                  <option value="1">1-5 Kelas</option>
                  <option value="2">5-10 Kelas</option>
                  <option value="3">10-15 Kelas</option>
                  <option value="4">15-20 Kelas</option>
                  <option value="5">Lebih dari 20 Kelas</option>
                </select>
              </div>

              <!-- Jumlah Smartboard -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Berapa Smartboard (IFP) yang dimiliki sekolah? <span class="text-red-400">*</span>
                </label>
                <select v-model="surveyForm.jumlahSmartboard" class="form-input">
                  <option value="" disabled>Pilih jumlah smartboard</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5 atau lebih">5 atau lebih</option>
                </select>
              </div>

              <!-- SmartTV -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Apakah kelas-kelas di sekolah sudah menggunakan SmartTV / GoogleTV dalam KBM?
                </label>
                <select v-model="surveyForm.pakaiSmartTV" class="form-input">
                  <option value="" disabled>Pilih jawaban</option>
                  <option value="1">Belum sama sekali</option>
                  <option value="2">Ada beberapa kelas saja</option>
                  <option value="3">Sudah semua kelas</option>
                </select>
              </div>

              <!-- AC -->
              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Apakah kelas menggunakan AC?
                </label>
                <select v-model="surveyForm.pakaiAC" class="form-input">
                  <option value="" disabled>Pilih jawaban</option>
                  <option value="1">Tidak ada</option>
                  <option value="2">Sebagian kecil</option>
                  <option value="3">Sebagian besar</option>
                  <option value="4">Semua kelas</option>
                </select>
              </div>

            </div>

            <!-- Footer -->
            <div class="p-5 border-t dark:border-zinc-800 border-gray-100 flex-shrink-0 flex gap-2">
              <button @click="trialStep = 1"
                class="px-4 py-2.5 rounded-xl text-xs font-bold dark:text-gray-400 text-gray-500 dark:bg-zinc-800 bg-gray-100 hover:opacity-80 transition-opacity">
                <i class="ri-arrow-left-line mr-1" /> Kembali
              </button>
              <button @click="submitSurvey" :disabled="!isSurveyValid || surveySubmitting"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-green text-white hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <i v-if="surveySubmitting" class="ri-loader-4-line animate-spin" />
                <i v-else class="ri-check-line" />
                {{ surveySubmitting ? 'Menyimpan...' : 'Simpan & Mulai' }}
              </button>
            </div>
          </div>

        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast Sukses -->
  <Teleport to="body">
    <Transition name="slide-down">
      <div v-if="showSuccessToast"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-brand-green text-white shadow-2xl">
        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <i class="ri-check-line text-base" />
        </div>
        <div>
          <p class="text-sm font-black">Data berhasil disimpan!</p>
          <p class="text-[10px] text-green-100">Selamat menggunakan ClassOS 🎉</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.form-input {
  @apply w-full px-3 py-2.5 rounded-xl dark:bg-zinc-800 bg-gray-50 dark:border-zinc-700 border-gray-200 border text-xs dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green dark:placeholder-gray-500 placeholder-gray-400 transition-all;
  appearance: auto;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>