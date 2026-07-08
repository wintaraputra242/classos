<!-- components/EndClassModal.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
  capturedPhoto: string | null
  faceCount: number | null
  countdown: number
  showFlash: boolean
  endClassNote: string
  isRecordingNote: boolean
  submittingEndClass: boolean
  // isDetecting: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:faceCount', value: number): void
  (e: 'update:endClassNote', value: string): void
  (e: 'close'): void
  (e: 'toggle-note-recording'): void
  (e: 'start-countdown'): void
  (e: 'retake'): void
  (e: 'submit'): void
}>()

// ✅ Refs template tetap di sini, tapi di-expose supaya parent tetap bisa akses
// langsung (videoEndClassRef.value.videoWidth, canvasRef.value.getContext, dll)
// tanpa perlu refactor besar logic kamera yang sudah ada di parent.
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
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />
        <div class="relative w-full max-w-3xl dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b dark:border-zinc-700 border-gray-100">
            <div class="flex items-center gap-2">
              <i class="ri-camera-fill dark:text-brand-green text-brand-red text-lg" />
              <h3 class="font-bold dark:text-white text-gray-900 text-base">End-Class Foto</h3>
              <span class="text-xs dark:text-gray-500 text-gray-400">Langkah 4 dari 4</span>
            </div>
            <button @click="emit('close')"
              class="w-8 h-8 rounded-full dark:bg-zinc-800 bg-gray-100 flex items-center justify-center dark:text-gray-400 text-gray-500">
              <i class="ri-close-line text-base" />
            </button>
          </div>

          <div :class="{ 'max-h-[32rem] overflow-auto': capturedPhoto }">
            <!-- Kamera / Hasil Foto -->
            <div class="relative bg-black aspect-video">
              <video v-if="!capturedPhoto" ref="videoEndClassRef" autoplay playsinline muted
                class="w-full h-full object-cover" style="transform: scaleX(-1);" />
              <!-- <video v-if="!capturedPhoto" ref="videoEndClassRef" autoplay playsinline
                class="w-full h-full object-cover" /> -->
              <img v-else :src="capturedPhoto" class="w-full h-full object-cover" />
              <canvas ref="canvasRef" class="hidden" />

              <canvas v-if="!capturedPhoto" ref="overlayCanvasRef"
                class="absolute inset-0 w-full h-full pointer-events-none" style="object-fit: cover;" />

              <Transition name="countdown-pop" mode="out-in">
                <div v-if="countdown > 0" :key="countdown"
                  class="absolute inset-0 flex items-center justify-center bg-black/0">
                  <span class="text-white font-black drop-shadow-lg" style="font-size: 9rem;">
                    {{ countdown }}
                  </span>
                </div>
              </Transition>

              <div v-if="!capturedPhoto" class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <!-- <div v-if="isDetecting" class="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full">
                  <i class="ri-loader-4-line animate-spin text-white text-xs" />
                  <span class="text-white text-[10px] font-bold">Memuat detektor...</span>
                </div> -->

                <!-- <div v-else class="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full">
                  <i class="ri-group-line text-white text-xs" />
                  <span class="text-white text-[10px] font-bold">
                    {{ faceCount === null ? 'Mendeteksi...' : `${faceCount} wajah terdeteksi` }}
                  </span>
                </div> -->

                <div class="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span class="text-white text-[10px] font-bold">LIVE</span>
                </div>
              </div>

              <Transition name="flash">
                <div v-if="showFlash" class="absolute inset-0 bg-white" />
              </Transition>
            </div>

            <!-- Hasil foto -->
            <div v-if="capturedPhoto" class="px-6 pt-4">
              <div
                class="rounded-xl dark:bg-zinc-800 bg-gray-50 border dark:border-zinc-700 border-gray-200 px-4 py-3 flex items-center gap-3">

                <div class="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0">
                  <i class="ri-group-line text-brand-green text-sm" />
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-[10px] dark:text-gray-500 text-gray-400">Siswa terdeteksi</p>
                  <p class="text-base font-black dark:text-white text-gray-900 leading-none">
                    {{ faceCount ?? 0 }}
                    <span class="text-xs font-normal dark:text-gray-400 text-gray-500 ml-1">orang</span>
                  </p>
                </div>

                <!-- Mode tampil -->
                <button v-if="!isEditingFaceCount" @click="startEditFaceCount"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg dark:bg-zinc-700 bg-gray-200 hover:opacity-80 transition-opacity flex-shrink-0">
                  <i class="ri-pencil-line text-[10px] dark:text-gray-300 text-gray-500" />
                  <span class="text-[10px] font-bold dark:text-gray-300 text-gray-500">Edit</span>
                </button>

                <!-- Mode edit -->
                <div v-else class="flex items-center gap-1.5 flex-shrink-0">
                  <button @click="adjustFaceCount(-1)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-700 bg-gray-200 hover:opacity-80 transition-opacity">
                    <i class="ri-subtract-line text-sm dark:text-gray-300 text-gray-600" />
                  </button>
                  <input v-model.number="editFaceCountValue" type="number" min="0" max="999"
                    class="w-12 text-center text-sm font-black dark:text-white text-gray-900 dark:bg-zinc-900 bg-white rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-brand-green border dark:border-zinc-600 border-gray-300"
                    @keyup.enter="confirmEditFaceCount" />
                  <button @click="adjustFaceCount(1)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-700 bg-gray-200 hover:opacity-80 transition-opacity">
                    <i class="ri-add-line text-sm dark:text-gray-300 text-gray-600" />
                  </button>
                  <button @click="confirmEditFaceCount"
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-green text-white hover:opacity-80 transition-opacity">
                    <i class="ri-check-line text-sm" />
                  </button>
                </div>

              </div>
            </div>

            <!-- Form Note -->
            <div v-if="capturedPhoto" class="px-6 pt-3">
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold dark:text-gray-300 text-gray-700">
                  Catatan sesi (opsional)
                </label>

                <button type="button" @click="emit('toggle-note-recording')"
                  class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                  :class="isRecordingNote ? 'bg-red-500/15 text-red-500' : 'dark:bg-zinc-800 bg-gray-100 dark:text-gray-400 text-gray-500 hover:opacity-80'">
                  <span v-if="isRecordingNote" class="relative w-1.5 h-1.5 rounded-full bg-red-500">
                    <span class="absolute inset-0 rounded-full bg-red-500 animate-ping" />
                  </span>
                  <i v-else class="ri-mic-line text-xs" />
                  {{ isRecordingNote ? 'Merekam...' : 'Rekam Suara' }}
                </button>
              </div>

              <div class="relative">
                <textarea :value="endClassNote"
                  @input="emit('update:endClassNote', ($event.target as HTMLTextAreaElement).value)" rows="3"
                  placeholder="Tulis catatan tambahan tentang sesi ini, atau tekan 'Rekam Suara'..."
                  class="w-full text-xs px-3 py-2.5 rounded-xl dark:bg-zinc-800 bg-gray-50 dark:text-white text-gray-900 border dark:border-zinc-700 border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green resize-none transition-colors"
                  :class="isRecordingNote && '!border-red-400 dark:!border-red-500'" />

                <div v-if="isRecordingNote" class="absolute bottom-2 right-2 flex items-center gap-1">
                  <span class="w-1 h-1 rounded-full bg-red-500 animate-bounce" style="animation-delay: 0ms" />
                  <span class="w-1 h-1 rounded-full bg-red-500 animate-bounce" style="animation-delay: 150ms" />
                  <span class="w-1 h-1 rounded-full bg-red-500 animate-bounce" style="animation-delay: 300ms" />
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="p-5 flex gap-3">
            <template v-if="!capturedPhoto">
              <button @click="emit('close')"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity">
                Batal
              </button>
              <button @click="emit('start-countdown')" :disabled="countdown > 0"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                <i class="ri-camera-fill" />
                {{ countdown > 0 ? `Bersiap... ${countdown}` : 'Ambil Foto Sekarang' }}
              </button>
            </template>
            <template v-else>
              <button @click="emit('retake')"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity flex items-center justify-center gap-1">
                <i class="ri-refresh-line" />
                Ulangi
              </button>
              <button @click="emit('submit')" :disabled="submittingEndClass"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                <i :class="submittingEndClass ? 'ri-loader-4-line animate-spin' : 'ri-check-line'" />
                {{ submittingEndClass ? 'Mengevaluasi...' : 'Selesaikan Sesi' }}
              </button>
            </template>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>