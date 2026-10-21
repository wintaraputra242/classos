<!-- components/EndClassModal.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
  capturedPhoto: string | null
  faceCount: number | null
  countdown: number
  showFlash: boolean
  endClassNote: string
  isRecordingNote: boolean
  submittingEndClass: boolean
  isDetecting: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:faceCount', value: number): void
  (e: 'update:endClassNote', value: string): void
  (e: 'close'): void
  (e: 'toggle-note-recording'): void
  (e: 'take-photo'): void
  (e: 'retake'): void
  (e: 'submit'): void
}>()

// ✅ Refs template tetap di sini, tapi di-expose supaya parent tetap bisa akses
// langsung (videoEndClassRef.value.videoWidth, canvasRef.value.getContext, dll)
// tanpa perlu refactor besar logic kamera yang sudah ada di parent.
const videoEndClassRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

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

// ✅ Model deteksinya cukup besar (~99MB), jadi loading-nya memang bisa makan
// waktu di koneksi lambat. Supaya tidak terasa "diam/macet", teks status
// bergilir tiap beberapa detik — bukan progress asli (kita tidak punya info
// persentase dari tf.loadGraphModel), tapi cukup untuk kasih kesan masih aktif.
const detectingMessages = [
  'Mempersiapkan detektor...',
  'Mengunduh model deteksi...',
  'Hampir siap...',
]
const detectingMessageIndex = ref(0)
let _detectingMessageTimer: ReturnType<typeof setInterval> | null = null

watch(() => props.isDetecting, (detecting) => {
  if (detecting) {
    detectingMessageIndex.value = 0
    _detectingMessageTimer = setInterval(() => {
      detectingMessageIndex.value = (detectingMessageIndex.value + 1) % detectingMessages.length
    }, 2500)
  } else if (_detectingMessageTimer) {
    clearInterval(_detectingMessageTimer)
    _detectingMessageTimer = null
  }
}, { immediate: true })

onUnmounted(() => {
  if (_detectingMessageTimer) clearInterval(_detectingMessageTimer)
})

defineExpose({ videoEndClassRef, canvasRef })
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
                class="w-full h-full object-cover" />
              <!-- <video v-if="!capturedPhoto" ref="videoEndClassRef" autoplay playsinline
                class="w-full h-full object-cover" /> -->
              <img v-else :src="capturedPhoto" class="w-full h-full object-cover" />
              <canvas ref="canvasRef" class="hidden" />

              <Transition name="countdown-pop" mode="out-in">
                <div v-if="countdown > 0" :key="countdown"
                  class="absolute inset-0 flex items-center justify-center bg-black/0">
                  <span class="text-white font-black drop-shadow-lg" style="font-size: 9rem;">
                    {{ countdown }}
                  </span>
                </div>
              </Transition>

              <div v-if="!capturedPhoto" class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div class="bg-black/70 rounded-2xl px-5 py-3 overflow-hidden" :class="isDetecting ? 'w-56' : ''">
                  <div class="flex items-center gap-2.5">
                    <i v-if="isDetecting" class="ri-loader-4-line animate-spin text-white text-xl flex-shrink-0" />
                    <i v-else class="ri-camera-fill text-white text-xl flex-shrink-0" />
                    <Transition name="fade" mode="out-in">
                      <span :key="isDetecting ? detectingMessageIndex : 'ready'" class="text-white text-sm font-bold">
                        {{ isDetecting ? detectingMessages[detectingMessageIndex] : 'Siap mengambil foto' }}
                      </span>
                    </Transition>
                  </div>
                  <div v-if="isDetecting" class="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
                    <div class="h-full w-1/3 rounded-full bg-white/80" style="animation: indeterminate 1.2s ease-in-out infinite" />
                  </div>
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
                  <p v-if="isDetecting && faceCount === null"
                    class="text-sm font-bold dark:text-gray-300 text-gray-600 flex items-center gap-1.5">
                    <i class="ri-loader-4-line animate-spin text-xs" />
                    Menganalisa foto...
                  </p>
                  <p v-else class="text-base font-black dark:text-white text-gray-900 leading-none">
                    {{ faceCount ?? 0 }}
                    <span class="text-xs font-normal dark:text-gray-400 text-gray-500 ml-1">orang</span>
                  </p>
                </div>

                <!-- Mode tampil -->
                <button v-if="!isEditingFaceCount && !(isDetecting && faceCount === null)" @click="startEditFaceCount"
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
              <button @click="emit('take-photo')" :disabled="isDetecting || countdown > 0"
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
              <button @click="emit('submit')" :disabled="submittingEndClass || (isDetecting && faceCount === null)"
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

<style scoped>
@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(300%);
  }
}
</style>