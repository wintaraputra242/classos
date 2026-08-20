<!-- components/ui/RequestKontenModal.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDate } from '@/composables/useDate'
import { useSpeechToText } from '@/composables/useSpeechToText'
import VoiceInputButton from '@/components/ui/VoiceInputButton.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const auth = useAuthStore()
const { formatDate, formatTime } = useDate()

const jenjangOptions = ['SD', 'SMP', 'SMA', 'SMK']
const faseOptions = ['A', 'B', 'C', 'D', 'E', 'F']

const requestId = ref('')
const requestDate = ref(new Date())

const form = ref({
  nama: '',
  id_provinsi: '' as string | number,
  id_kabupaten_kota: '' as string | number,
  sekolah: '',
  tingkat: '',
  fase: '',
  judul: '',
  penjelasan_konten: '',
  capaian_pembelajaran: '',
  tujuan_pembelajaran: '',
  link_referensi: '',
  alasan_penting: '',
})

const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

function resetForm() {
  requestId.value = `REQ-${Date.now()}`
  requestDate.value = new Date()
  form.value = {
    nama: auth.linkedUser?.name ?? '',
    id_provinsi: '',
    id_kabupaten_kota: '',
    sekolah: auth.siteName ?? '',
    tingkat: auth.jenjang ?? '',
    fase: '',
    judul: '',
    penjelasan_konten: '',
    capaian_pembelajaran: '',
    tujuan_pembelajaran: '',
    link_referensi: '',
    alasan_penting: '',
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
  return !!(
    f.nama.trim() && f.id_provinsi && f.id_kabupaten_kota && f.sekolah.trim() && f.tingkat && f.fase &&
    f.judul.trim() && f.penjelasan_konten.trim() && f.capaian_pembelajaran.trim() &&
    f.tujuan_pembelajaran.trim() && f.alasan_penting.trim()
  )
})

function close() {
  emit('update:modelValue', false)
}

// ✅ Isi field via suara — reuse Web Speech API (sama pola dengan catatan kelas)
const stt = useSpeechToText()

type VoiceField = 'nama' | 'sekolah' | 'judul' | 'penjelasan_konten' | 'capaian_pembelajaran' | 'tujuan_pembelajaran' | 'alasan_penting'

function appendVoiceText(field: VoiceField, text: string) {
  form.value[field] = form.value[field] ? form.value[field] + ' ' + text : text
}

function toggleVoice(field: VoiceField) {
  stt.toggle(field, (text) => appendVoiceText(field, text))
}

async function submit() {
  if (!isValid.value || submitting.value) return
  submitting.value = true
  submitError.value = ''

  const [idProv, ...provRest] = form.value.id_provinsi.toString().split('-')
  const [idKab, ...kabRest] = form.value.id_kabupaten_kota.toString().split('-')

  const result = await auth.submitRequestKonten({
    request_id: requestId.value,
    nama: form.value.nama.trim(),
    id_provinsi: idProv ?? '',
    provinsi: provRest.join('-'),
    id_kabupaten_kota: idKab ?? '',
    kabupaten_kota: kabRest.join('-'),
    sekolah: form.value.sekolah.trim(),
    tingkat: form.value.tingkat,
    fase: form.value.fase,
    judul: form.value.judul.trim(),
    penjelasan_konten: form.value.penjelasan_konten.trim(),
    capaian_pembelajaran: form.value.capaian_pembelajaran.trim(),
    tujuan_pembelajaran: form.value.tujuan_pembelajaran.trim(),
    link_referensi: form.value.link_referensi.trim() || undefined,
    alasan_penting: form.value.alasan_penting.trim(),
  })

  submitting.value = false

  if (result.success) {
    submitSuccess.value = true
  } else {
    submitError.value = result.error ?? 'Gagal mengirim permintaan. Coba lagi.'
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

        <div class="relative w-full max-w-xl rounded-2xl dark:bg-zinc-900 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          <!-- Header -->
          <div class="p-5 border-b dark:border-zinc-800 border-gray-100 flex-shrink-0 flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-brand-green/15 flex items-center justify-center flex-shrink-0">
                <i class="ri-add-circle-line text-brand-green text-sm" />
              </div>
              <div>
                <h2 class="text-sm font-black dark:text-white text-gray-900">Request Konten</h2>
                <p class="text-[10px] dark:text-gray-400 text-gray-500">
                  Anda bisa ikut berkontribusi pada koleksi konten edukasi ClassOS. Mohon isi dengan cermat.
                </p>
                <p class="text-[10px] dark:text-gray-600 text-gray-400 mt-1 font-mono">
                  {{ requestId }} &middot; {{ formatDate(requestDate) }}, {{ formatTime(requestDate) }}
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
            <p class="text-sm font-bold dark:text-white text-gray-900">Permintaan berhasil dikirim</p>
            <p class="text-xs dark:text-gray-400 text-gray-500 mb-2">{{ requestId }}</p>
            <div class="flex flex-col gap-1.5 w-full max-w-xs">
              <div class="flex items-center justify-between px-3 py-2 rounded-xl dark:bg-zinc-800 bg-gray-50 text-xs">
                <span class="dark:text-gray-400 text-gray-500">Status Permintaan</span>
                <span class="font-bold text-yellow-500">Menunggu Review</span>
              </div>
              <div class="flex items-center justify-between px-3 py-2 rounded-xl dark:bg-zinc-800 bg-gray-50 text-xs">
                <span class="dark:text-gray-400 text-gray-500">Status Generate</span>
                <span class="font-bold dark:text-gray-500 text-gray-400">Belum Diproses</span>
              </div>
            </div>
            <button @click="close"
              class="mt-3 px-5 py-2 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-white text-gray-900 hover:opacity-80 transition-opacity">
              Tutup
            </button>
          </div>

          <!-- Form -->
          <template v-else>
            <div class="overflow-y-auto scrollbar-hide p-5 space-y-4 flex-1">

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

              <div class="grid grid-cols-2 gap-3">
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

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                    Tingkat <span class="text-red-400">*</span>
                  </label>
                  <select v-model="form.tingkat" class="form-input">
                    <option value="" disabled>Pilih tingkat</option>
                    <option v-for="j in jenjangOptions" :key="j" :value="j">{{ j }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                    Fase <span class="text-red-400">*</span>
                  </label>
                  <select v-model="form.fase" class="form-input">
                    <option value="" disabled>Pilih fase</option>
                    <option v-for="f in faseOptions" :key="f" :value="f">Fase {{ f }}</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Judul <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input v-model="form.judul" type="text" placeholder="Judul konten yang diusulkan"
                    class="form-input pr-9" />
                  <VoiceInputButton v-if="stt.isSupported" :active="stt.activeField.value === 'judul'"
                    @click="toggleVoice('judul')" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Penjelasan Konten <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <textarea v-model="form.penjelasan_konten" rows="3" placeholder="Jelaskan konten yang Anda usulkan"
                    class="form-input resize-none pr-9" />
                  <VoiceInputButton v-if="stt.isSupported" variant="textarea"
                    :active="stt.activeField.value === 'penjelasan_konten'" @click="toggleVoice('penjelasan_konten')" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Capaian Pembelajaran (CP) <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <textarea v-model="form.capaian_pembelajaran" rows="2" placeholder="Capaian Pembelajaran terkait"
                    class="form-input resize-none pr-9" />
                  <VoiceInputButton v-if="stt.isSupported" variant="textarea"
                    :active="stt.activeField.value === 'capaian_pembelajaran'" @click="toggleVoice('capaian_pembelajaran')" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Tujuan Pembelajaran (TP) <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <textarea v-model="form.tujuan_pembelajaran" rows="2" placeholder="Tujuan Pembelajaran terkait"
                    class="form-input resize-none pr-9" />
                  <VoiceInputButton v-if="stt.isSupported" variant="textarea"
                    :active="stt.activeField.value === 'tujuan_pembelajaran'" @click="toggleVoice('tujuan_pembelajaran')" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Link Referensi <span class="dark:text-gray-500 text-gray-400 font-normal">(optional)</span>
                </label>
                <input v-model="form.link_referensi" type="url" placeholder="https://..." class="form-input" />
              </div>

              <div>
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">
                  Kenapa Konten ini Penting Ada <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <textarea v-model="form.alasan_penting" rows="3" placeholder="Jelaskan pentingnya konten ini"
                    class="form-input resize-none pr-9" />
                  <VoiceInputButton v-if="stt.isSupported" variant="textarea"
                    :active="stt.activeField.value === 'alasan_penting'" @click="toggleVoice('alasan_penting')" />
                </div>
              </div>

              <p v-if="submitError" class="text-xs text-red-500 flex items-center gap-1.5">
                <i class="ri-error-warning-line" /> {{ submitError }}
              </p>
            </div>

            <!-- Footer -->
            <div class="p-5 border-t dark:border-zinc-800 border-gray-100 flex-shrink-0">
              <button @click="submit" :disabled="!isValid || submitting"
                class="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-green text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
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
