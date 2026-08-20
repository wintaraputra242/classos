<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
  capturedPhoto: string | null
  countdown: number
  showFlash: boolean
  endClassNote: string
  isRecordingNote: boolean
  submittingEndClass: boolean
  submitError?: string | null
  faceCount: number | null
  isDetecting?: boolean
  isLoadingModel?: boolean
  modelLoadProgress?: 'idle' | 'loading-tf' | 'loading-model' | 'ready'
  showFaceConfirm?: boolean // ← dari beranda
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:endClassNote': [value: string]
  'update:faceCount': [value: number]
  'close': []
  'toggle-note-recording': []
  'retake': []
  'take-photo': []
  'confirm-take': []   // ← trigger countdown
  'request-confirm': [] // ← user klik ambil foto → minta konfirmasi
  'confirm-yes': []    // ← user konfirmasi ya → jalankan countdown
  'confirm-no': []     // ← user konfirmasi tidak → batal
  'submit': []
}>()

const videoEndClassRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const overlayCanvasRef = ref<HTMLCanvasElement | null>(null)
const isEditingFaceCount = ref(false)
const editFaceCountValue = ref(0)

function startEditFaceCount() {
  editFaceCountValue.value = props.faceCount ?? 0
  isEditingFaceCount.value = true
}

function adjustFaceCount(delta: number) {
  editFaceCountValue.value = Math.max(0, editFaceCountValue.value + delta)
}

function confirmEditFaceCount() {
  emit('update:faceCount', editFaceCountValue.value)
  isEditingFaceCount.value = false
}

defineExpose({ videoEndClassRef, canvasRef, overlayCanvasRef })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

        <div
          class="relative w-full max-w-4xl dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style="max-height: 90vh;">

          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-3.5 border-b dark:border-zinc-700 border-gray-100 flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="ri-camera-fill dark:text-brand-green text-brand-red text-sm" />
              <h3 class="font-bold dark:text-white text-gray-900 text-sm">End Class</h3>
              <span class="text-[10px] dark:text-gray-500 text-gray-400">Langkah 4 dari 4</span>
            </div>
            <button @click="emit('close')"
              class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-800 bg-gray-100 hover:opacity-80 transition-opacity">
              <i class="ri-close-line text-sm dark:text-gray-400 text-gray-500" />
            </button>
          </div>

          <!-- Content -->
          <div class="overflow-y-auto flex-1 scrollbar-hide">

            <!-- ===== MODE KAMERA ===== -->
            <template v-if="!capturedPhoto">
              <div class="relative bg-black" style="height: calc(90vh - 200px);">
                <video ref="videoEndClassRef" autoplay playsinline muted class="w-full h-full object-cover" />

                <!-- Canvas overlay live detection -->
                <canvas ref="overlayCanvasRef" class="absolute inset-0 w-full h-full pointer-events-none" />

                <!-- Countdown overlay -->
                <Transition name="fade">
                  <div v-if="countdown > 0" class="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                    <div class="text-center">
                      <p class="text-8xl font-black text-white" style="text-shadow: 0 0 40px rgba(255,255,255,0.5)">
                        {{ countdown }}
                      </p>
                      <p class="text-white text-sm font-bold mt-2 opacity-80">Bersiap...</p>
                    </div>
                  </div>
                </Transition>

                <!-- ✅ Konfirmasi jumlah siswa — dikontrol dari beranda via showFaceConfirm -->
                <Transition name="fade">
                  <div v-if="showFaceConfirm"
                    class="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div
                      class="mx-4 w-full max-w-xs dark:bg-zinc-900 bg-white rounded-2xl p-5 text-center shadow-2xl border dark:border-zinc-700 border-gray-200">
                      <div
                        class="w-14 h-14 rounded-full bg-brand-green/20 flex items-center justify-center mx-auto mb-3">
                        <i class="ri-group-line text-2xl text-brand-green" />
                      </div>
                      <p class="font-bold dark:text-white text-gray-900 text-sm mb-1">
                        Konfirmasi Jumlah Siswa
                      </p>
                      <p class="text-[10px] dark:text-gray-400 text-gray-500 mb-3">
                        Pastikan jumlah siswa yang terdeteksi sudah benar sebelum mengambil foto
                      </p>
                      <div
                        class="py-3 px-4 rounded-xl dark:bg-zinc-800 bg-gray-50 border dark:border-zinc-700 border-gray-200 mb-4">
                        <p class="text-4xl font-black dark:text-white text-gray-900">{{ faceCount ?? 0 }}</p>
                        <p class="text-xs dark:text-gray-400 text-gray-500 mt-0.5">siswa terdeteksi</p>
                      </div>
                      <div class="flex gap-2">
                        <button @click="emit('confirm-no')"
                          class="flex-1 py-2.5 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity">
                          Batal
                        </button>
                        <button @click="emit('confirm-yes')"
                          class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                          <i class="ri-camera-fill" />
                          Ya, Ambil Foto
                        </button>
                      </div>
                    </div>
                  </div>
                </Transition>

                <!-- Indikator jumlah orang -->
                <div v-if="!showFaceConfirm && countdown === 0"
                  class="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <i class="ri-group-line text-white text-xs" />
                  <span class="text-white text-[10px] font-bold">
                    {{ faceCount === null ? 'Mendeteksi...' : `${faceCount} orang terdeteksi` }}
                  </span>
                </div>

                <!-- Live indicator -->
                <div v-if="!showFaceConfirm && countdown === 0"
                  class="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span class="text-white text-[10px] font-bold">LIVE</span>
                </div>

                <!-- Loading model -->
                <Transition name="fade">
                  <div v-if="isLoadingModel"
                    class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/85">
                    <div class="relative w-12 h-12 mb-3">
                      <div class="absolute inset-0 rounded-full border-4 border-white/10" />
                      <div
                        class="absolute inset-0 rounded-full border-4 border-t-brand-green border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                      <div class="absolute inset-0 flex items-center justify-center">
                        <i class="ri-camera-ai-line text-white text-sm" />
                      </div>
                    </div>
                    <p class="text-white text-xs font-bold mb-1">Menyiapkan Deteksi</p>
                    <p class="text-gray-400 text-[10px]">
                      <template v-if="modelLoadProgress === 'loading-tf'">Memuat TensorFlow...</template>
                      <template v-else-if="modelLoadProgress === 'loading-model'">Memuat model deteksi...</template>
                      <template v-else>Mempersiapkan...</template>
                    </p>
                  </div>
                </Transition>

                <Transition name="flash">
                  <div v-if="showFlash" class="absolute inset-0 bg-white z-20" />
                </Transition>
              </div>

              <canvas ref="canvasRef" class="hidden" />

              <div class="px-5 py-3 text-center border-t dark:border-zinc-700 border-gray-100">
                <p class="text-sm dark:text-gray-300 text-gray-600">
                  Posisikan kamera agar seluruh siswa terlihat, lalu tekan <strong>Ambil Foto</strong>
                </p>
              </div>
            </template>

            <!-- ===== MODE SETELAH FOTO ===== -->
            <template v-else>
              <div class="p-5 grid grid-cols-2 gap-5">

                <!-- Kolom kiri: foto -->
                <div class="flex flex-col gap-3">
                  <p class="text-xs font-bold dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                    Foto Kelas
                  </p>
                  <div class="rounded-xl overflow-hidden border dark:border-zinc-700 border-gray-200 relative"
                    style="height: 260px;">
                    <img :src="capturedPhoto!" alt="Foto kelas" class="w-full h-full object-cover object-center" />
                    <Transition name="fade">
                      <div v-if="isDetecting"
                        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/75">
                        <div class="relative w-10 h-10 mb-2">
                          <div class="absolute inset-0 rounded-full border-4 border-white/10" />
                          <div
                            class="absolute inset-0 rounded-full border-4 border-t-brand-green border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                          <div class="absolute inset-0 flex items-center justify-center">
                            <i class="ri-group-line text-white text-xs" />
                          </div>
                        </div>
                        <p class="text-white text-xs font-bold">Menghitung siswa...</p>
                      </div>
                    </Transition>
                  </div>

                  <!-- <div class="flex gap-2 items-center">
                    <div class="rounded-lg overflow-hidden border dark:border-zinc-700 border-gray-200 flex-shrink-0"
                      style="width: 80px; height: 55px;">
                      <img :src="capturedPhoto!" alt="Preview"
                        class="w-full h-full object-cover object-center opacity-70 hover:opacity-100 transition-opacity" />
                    </div>
                    <p class="text-[10px] dark:text-gray-500 text-gray-400 leading-relaxed">
                      Preview foto kelas yang akan disimpan dalam laporan sesi mengajar
                    </p>
                  </div> -->
                </div>

                <!-- Kolom kanan: info + catatan -->
                <div class="flex flex-col gap-4">

                  <!-- Jumlah siswa -->
                  <div>
                    <p class="text-xs font-bold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-2">
                      Jumlah Siswa
                    </p>
                    <div
                      class="rounded-xl dark:bg-zinc-800 bg-gray-50 border dark:border-zinc-700 border-gray-200 px-4 py-3 flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0">
                        <i v-if="isDetecting" class="ri-loader-4-line animate-spin text-brand-green" />
                        <i v-else class="ri-group-line text-brand-green text-lg" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-[10px] dark:text-gray-500 text-gray-400">Siswa terdeteksi</p>
                        <div v-if="isDetecting" class="flex items-center gap-2 mt-1">
                          <div class="h-5 w-20 rounded dark:bg-zinc-700 bg-gray-200 animate-pulse" />
                        </div>
                        <div v-else class="flex items-center gap-2 mt-1">
                          <template v-if="!isEditingFaceCount">
                            <p class="text-2xl font-black dark:text-white text-gray-900 leading-none">
                              {{ faceCount ?? 0 }}
                              <span class="text-sm font-normal dark:text-gray-400 text-gray-500 ml-1">orang</span>
                            </p>
                          </template>
                          <template v-else>
                            <div class="flex items-center gap-2">
                              <button @click="adjustFaceCount(-1)"
                                class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-700 bg-gray-200 hover:opacity-80">
                                <i class="ri-subtract-line text-sm" />
                              </button>
                              <input v-model.number="editFaceCountValue" type="number" min="0" max="999"
                                @keyup.enter="confirmEditFaceCount"
                                class="w-14 text-center text-lg font-black dark:text-white text-gray-900 dark:bg-zinc-900 bg-white rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-brand-green border dark:border-zinc-600 border-gray-300" />
                              <button @click="adjustFaceCount(1)"
                                class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-700 bg-gray-200 hover:opacity-80">
                                <i class="ri-add-line text-sm" />
                              </button>
                              <button @click="confirmEditFaceCount"
                                class="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-green text-white hover:opacity-80">
                                <i class="ri-check-line text-sm" />
                              </button>
                            </div>
                          </template>
                          <button v-if="!isEditingFaceCount" @click="startEditFaceCount"
                            class="flex items-center gap-1 px-2.5 py-1 rounded-lg dark:bg-zinc-700 bg-gray-200 hover:opacity-80 transition-opacity ml-auto">
                            <i class="ri-pencil-line text-xs dark:text-gray-300 text-gray-500" />
                            <span class="text-[10px] font-bold dark:text-gray-300 text-gray-500">Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <p class="text-[10px] dark:text-gray-600 text-gray-400 mt-1.5">
                      <i class="ri-information-line" /> Tap Edit untuk koreksi manual
                    </p>
                  </div>

                  <!-- Catatan sesi -->
                  <div class="flex flex-col flex-1">
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="text-xs font-bold dark:text-gray-300 text-gray-700">
                        Catatan Sesi
                        <span class="font-normal dark:text-gray-500 text-gray-400">(opsional)</span>
                      </label>
                      <button type="button" @click="emit('toggle-note-recording')"
                        class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                        :class="isRecordingNote
                          ? 'bg-red-500/15 text-red-500'
                          : 'dark:bg-zinc-800 bg-gray-100 dark:text-gray-400 text-gray-500 hover:opacity-80'">
                        <span v-if="isRecordingNote" class="relative w-1.5 h-1.5 rounded-full bg-red-500">
                          <span class="absolute inset-0 rounded-full bg-red-500 animate-ping" />
                        </span>
                        <i v-else class="ri-mic-line text-xs" />
                        {{ isRecordingNote ? 'Merekam...' : 'Rekam Suara' }}
                      </button>
                    </div>
                    <div class="relative flex-1">
                      <textarea :value="endClassNote"
                        @input="emit('update:endClassNote', ($event.target as HTMLTextAreaElement).value)" rows="6"
                        placeholder="Tulis catatan tambahan tentang sesi ini, atau tekan 'Rekam Suara'..."
                        class="w-full text-xs px-3 py-2.5 rounded-xl dark:bg-zinc-800 bg-gray-50 dark:text-white text-gray-900 border dark:border-zinc-700 border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green resize-none transition-colors"
                        :class="isRecordingNote && '!border-red-400 dark:!border-red-500'" />
                      <div v-if="isRecordingNote" class="absolute bottom-2 right-2 flex items-center gap-1">
                        <span class="w-1 h-1 rounded-full bg-red-500 animate-bounce" style="animation-delay:0ms" />
                        <span class="w-1 h-1 rounded-full bg-red-500 animate-bounce" style="animation-delay:150ms" />
                        <span class="w-1 h-1 rounded-full bg-red-500 animate-bounce" style="animation-delay:300ms" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ✅ Error saat menyimpan — sebelumnya gagal diam-diam & modal stuck di sini -->
              <div v-if="submitError" class="mx-5 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-400/30 flex items-start gap-2.5">
                <i class="ri-error-warning-line text-red-500 text-base flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-red-500 mb-0.5">Gagal menyimpan sesi</p>
                  <p class="text-[11px] dark:text-gray-400 text-gray-500 leading-relaxed">{{ submitError }}</p>
                  <p class="text-[11px] dark:text-gray-400 text-gray-500">Tekan "Selesaikan Sesi" untuk coba lagi.</p>
                </div>
              </div>
            </template>

          </div>

          <!-- Actions -->
          <div class="px-5 py-4 flex gap-2 border-t dark:border-zinc-700 border-gray-100 flex-shrink-0">
            <template v-if="!capturedPhoto">
              <button @click="emit('close')"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity">
                Tutup
              </button>
              <!-- ✅ Klik → emit request-confirm → beranda tampilkan konfirmasi -->
              <button @click="emit('request-confirm')" :disabled="isLoadingModel || countdown > 0"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                <i v-if="countdown > 0" class="ri-timer-line" />
                <i v-else class="ri-camera-fill" />
                {{ countdown > 0 ? `Mengambil dalam ${countdown}...` : 'Ambil Foto' }}
              </button>
            </template>
            <template v-else>
              <button @click="emit('retake')" :disabled="isDetecting"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
                <i class="ri-refresh-line" />
                Ulangi Foto
              </button>
              <button @click="emit('submit')" :disabled="submittingEndClass || isDetecting"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                <i v-if="submittingEndClass" class="ri-loader-4-line animate-spin" />
                <i v-else class="ri-check-line" />
                {{ submittingEndClass ? 'Menyimpan...' : 'Selesaikan Sesi' }}
              </button>
            </template>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.flash-enter-active,
.flash-leave-active {
  transition: opacity 0.15s ease;
}

.flash-enter-from,
.flash-leave-to {
  opacity: 0;
}
</style>