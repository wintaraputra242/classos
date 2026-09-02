<!-- components/ui/ReportKontenModal.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useSpeechToText } from '@/composables/useSpeechToText'
import VoiceInputButton from '@/components/ui/VoiceInputButton.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const auth = useAuthStore()
const playerStore = usePlayerStore()

const reportedTrack = computed(() => {
  if (playerStore.isPreview && playerStore.previewTrack) return playerStore.previewTrack
  return playerStore.currentTrack
})

const kelasOptions = Array.from({ length: 12 }, (_, i) => `Kelas ${i + 1}`)

const form = ref({
  nama: '',
  id_provinsi: '' as string | number,
  id_kabupaten_kota: '' as string | number,
  sekolah: '',
  tingkat: '',
  alasan: '',
})

const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

function resetForm() {
  form.value = {
    nama: auth.linkedUser?.name ?? '',
    id_provinsi: '',
    id_kabupaten_kota: '',
    sekolah: auth.siteName ?? '',
    tingkat: '',
    alasan: '',
  }
  submitError.value = ''
  submitSuccess.value = false
}

watch(() => props.modelValue, async (isOpen) => {
  if (!isOpen) {
    stt.stop()
    return
  }
  resetForm()
  await auth.fetchProv()
})

watch(() => form.value.id_provinsi, async (id) => {
  form.value.id_kabupaten_kota = ''
  if (!id) return
  const split = id.toString().split('-')
  await auth.fetchKab(split[0] as string)
})

const isValid = computed(() => {
  const f = form.value
  return !!(f.nama.trim() && f.id_provinsi && f.id_kabupaten_kota && f.sekolah.trim() && f.tingkat && f.alasan.trim())
})

function close() {
  emit('update:modelValue', false)
}

// ✅ Isi field via suara — reuse Web Speech API (sama pola dengan catatan kelas)
const stt = useSpeechToText()

function appendVoiceText(field: 'nama' | 'sekolah' | 'alasan', text: string) {
  form.value[field] = form.value[field] ? form.value[field] + ' ' + text : text
}

function toggleVoice(field: 'nama' | 'sekolah' | 'alasan') {
  stt.toggle(field, (text) => appendVoiceText(field, text))
}

async function submit() {
  if (!isValid.value || submitting.value) return
  submitting.value = true
  submitError.value = ''

  const [idProv] = form.value.id_provinsi.toString().split('-')
  const [idKab] = form.value.id_kabupaten_kota.toString().split('-')

  const result = await auth.submitReportKonten({
    id_content: reportedTrack.value?.id_stikernews ?? reportedTrack.value?.id ?? '',
    nama: form.value.nama.trim(),
    provinsi: idProv ?? '',
    kab_kota: idKab ?? '',
    sekolah: form.value.sekolah.trim(),
    tingkat: form.value.tingkat,
    alasan_keliru: form.value.alasan.trim(),
  })

  submitting.value = false

  if (result.success) {
    submitSuccess.value = true
    setTimeout(() => close(), 2000)
  } else {
    submitError.value = result.error ?? 'Gagal mengirim laporan. Coba lagi.'
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

        <div class="relative w-full max-w-lg rounded-2xl dark:bg-zinc-900 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          <!-- Header -->
          <div class="p-5 border-b dark:border-zinc-800 border-gray-100 flex-shrink-0 flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <i class="ri-flag-2-line text-red-500 text-sm" />
              </div>
              <div>
                <h2 class="text-sm font-black dark:text-white text-gray-900">Report Konten</h2>
                <p class="text-[10px] dark:text-gray-400 text-gray-500">
                  Anda bisa melaporkan jika konten edukasi ClassOS mengandung kesalahan/keliru. Mohon isi dengan cermat.
                </p>
              </div>
            </div>
            <button @click="close"
              class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-800 bg-gray-100 hover:dark:bg-zinc-700 hover:bg-gray-200 transition-colors flex-shrink-0">
              <i class="ri-close-line text-sm dark:text-gray-400 text-gray-500" />
            </button>
          </div>

          <!-- Success state -->
          <div v-if="submitSuccess" class="p-8 flex flex-col items-center text-center gap-3">
            <div class="w-14 h-14 rounded-full bg-brand-green/15 flex items-center justify-center">
              <i class="ri-check-line text-2xl text-brand-green" />
            </div>
            <p class="text-sm font-bold dark:text-white text-gray-900">Laporan berhasil dikirim</p>
            <p class="text-xs dark:text-gray-400 text-gray-500">Terima kasih, tim kami akan meninjau konten ini.</p>
          </div>

          <!-- Form -->
          <template v-else>
            <div class="overflow-y-auto scrollbar-hide p-5 space-y-4 flex-1">

              <div v-if="reportedTrack?.title"
                class="px-3 py-2.5 rounded-xl dark:bg-zinc-800 bg-gray-50 text-xs dark:text-gray-300 text-gray-600">
                <span class="dark:text-gray-500 text-gray-400">Konten yang dilaporkan:</span>
                <span class="font-bold dark:text-white text-gray-900 ml-1">{{ reportedTrack.title }}</span>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Nama <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input v-model="form.nama" type="text" placeholder="Nama lengkap Anda" class="form-input pr-9" />
                  <VoiceInputButton v-if="stt.isSupported" :active="stt.activeField.value === 'nama'"
                    @click="toggleVoice('nama')" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Provinsi <span class="text-red-400">*</span>
                </label>
                <select v-model="form.id_provinsi" class="form-input" :disabled="auth.loadingProv">
                  <option value="" disabled>{{ auth.loadingProv ? 'Memuat...' : 'Pilih provinsi' }}</option>
                  <option v-for="prov in (auth.provList as any[])" :key="prov.id_prov" :value="`${prov.id_prov}-${prov.prov}`">
                    {{ prov.prov }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Kab/Kota <span class="text-red-400">*</span>
                </label>
                <select v-model="form.id_kabupaten_kota" class="form-input"
                  :disabled="!form.id_provinsi || auth.loadingKab">
                  <option value="" disabled>
                    {{ !form.id_provinsi ? 'Pilih provinsi dulu' : auth.loadingKab ? 'Memuat...' : 'Pilih kab/kota' }}
                  </option>
                  <option v-for="kab in (auth.kabList as any[])" :key="kab.id_kab" :value="`${kab.id_kab}-${kab.kab}`">
                    {{ kab.kab }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Sekolah <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input v-model="form.sekolah" type="text" placeholder="Nama sekolah" class="form-input pr-9" />
                  <VoiceInputButton v-if="stt.isSupported" :active="stt.activeField.value === 'sekolah'"
                    @click="toggleVoice('sekolah')" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Tingkat <span class="text-red-400">*</span>
                </label>
                <select v-model="form.tingkat" class="form-input">
                  <option value="" disabled>Pilih tingkat</option>
                  <option v-for="k in kelasOptions" :key="k" :value="k">{{ k }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Kenapa Konten ini Anda anggap salah/keliru? <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <textarea v-model="form.alasan" rows="4" placeholder="Jelaskan kesalahan/kekeliruan yang Anda temukan"
                    class="form-input resize-none pr-9" />
                  <VoiceInputButton v-if="stt.isSupported" variant="textarea" :active="stt.activeField.value === 'alasan'"
                    @click="toggleVoice('alasan')" />
                </div>
              </div>

              <p v-if="submitError" class="text-xs text-red-500 flex items-center gap-1.5">
                <i class="ri-error-warning-line" /> {{ submitError }}
              </p>
            </div>

            <!-- Footer -->
            <div class="p-5 border-t dark:border-zinc-800 border-gray-100 flex-shrink-0">
              <button @click="submit" :disabled="!isValid || submitting"
                class="w-full py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                <i v-if="submitting" class="ri-loader-4-line animate-spin" />
                {{ submitting ? 'Mengirim...' : 'Kirim' }}
              </button>
            </div>
          </template>

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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
