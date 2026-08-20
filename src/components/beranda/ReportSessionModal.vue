<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  capturedPhoto: string | null
  listeningStartTime: string | null
  listeningStopTime: string | null
  summaryText: string
  endClassNote: string
  animatedScoreDisplay: number
  sessionScoreReason: string
  scoreAnimating: boolean
  showScoreReason: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—'
  const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  const m = Math.floor(diff / 60).toString().padStart(2, '0')
  const s = (diff % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const scoreColor = computed(() => {
  const s = props.animatedScoreDisplay
  if (s >= 80) return { text: 'text-green-400', bg: 'bg-green-400', ring: 'ring-green-400/30' }
  if (s >= 40) return { text: 'text-blue-400', bg: 'bg-blue-400', ring: 'ring-blue-400/30' }
  return { text: 'text-red-400', bg: 'bg-red-400', ring: 'ring-red-400/30' }
})

</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />

        <div
          class="relative w-full max-w-4xl dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style="max-height: 90vh;">

          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-3.5 border-b dark:border-zinc-700 border-gray-100 flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="ri-file-chart-line dark:text-brand-green text-brand-red text-sm" />
              <h3 class="font-bold dark:text-white text-gray-900 text-sm">Laporan Sesi Mengajar</h3>
            </div>
          </div>

          <!-- Content — grid 2 kolom, no scroll -->
          <div class="flex-1 overflow-hidden">
            <div class="grid grid-cols-2 h-full">

              <!-- Kolom kiri -->
              <div class="flex flex-col border-r dark:border-zinc-700 border-gray-100"
                style="height: calc(90vh - 120px);">

                <!-- Foto kelas — fixed height -->
                <div class="relative flex-shrink-0" style="height: 180px;">
                  <img v-if="capturedPhoto" :src="capturedPhoto" alt="Foto kelas" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center dark:bg-zinc-800 bg-gray-100">
                    <div class="text-center">
                      <i class="ri-image-line text-3xl dark:text-zinc-600 text-gray-300 block mb-1" />
                      <p class="text-xs dark:text-zinc-600 text-gray-400">Tidak ada foto</p>
                    </div>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                    <p class="text-white text-xs font-bold">Foto Kelas</p>
                  </div>
                </div>

                <!-- Durasi listening — fixed -->
                <div class="px-4 py-3 border-b dark:border-zinc-700 border-gray-100 flex-shrink-0">
                  <p class="text-[10px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-1">
                    Durasi Listening
                  </p>
                  <p class="text-2xl font-black dark:text-white text-gray-900">
                    {{ formatDuration(listeningStartTime, listeningStopTime) }}
                  </p>
                  <div class="flex items-center gap-4 mt-1">
                    <span class="text-[10px] dark:text-gray-500 text-gray-400 flex items-center gap-1">
                      <i class="ri-time-line" /> Mulai: {{ formatTime(listeningStartTime) }}
                    </span>
                    <span class="text-[10px] dark:text-gray-500 text-gray-400 flex items-center gap-1">
                      <i class="ri-time-line" /> Selesai: {{ formatTime(listeningStopTime) }}
                    </span>
                  </div>
                </div>

                <!-- ✅ Scrollable area — ringkasan + catatan guru -->
                <div class="flex-1 overflow-y-auto" style="min-height: 0;">

                  <!-- Ringkasan AI -->
                  <div class="px-4 py-3 border-b dark:border-zinc-700 border-gray-100">
                    <p class="text-[10px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-2">
                      Ringkasan
                    </p>
                    <p v-if="summaryText"
                      class="text-xs dark:text-gray-300 text-gray-700 leading-relaxed whitespace-pre-line">
                      {{ summaryText }}
                    </p>
                    <p v-else class="text-xs dark:text-gray-600 text-gray-400 italic">
                      Tidak ada ringkasan
                    </p>
                  </div>

                  <!-- ✅ Catatan guru -->
                  <div class="px-4 py-3">
                    <p class="text-[10px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-2">
                      Catatan Guru
                    </p>
                    <p v-if="endClassNote" class="text-xs dark:text-gray-300 text-gray-700 leading-relaxed">
                      {{ endClassNote }}
                    </p>
                    <p v-else class="text-xs dark:text-gray-600 text-gray-400 italic">
                      Tidak ada catatan
                    </p>
                  </div>

                </div>

              </div>

              <!-- Kolom kanan — SKOR -->
              <div class="flex flex-col items-center justify-center px-6 py-6 gap-5"
                style="height: calc(90vh - 120px); overflow-y: auto;">

                <div class="flex flex-col items-center text-center">
                  <p class="text-[10px] font-bold uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-4">
                    Skor Sesi Mengajar
                  </p>

                  <!-- Lingkaran skor -->
                  <div
                    class="relative w-44 h-44 rounded-full flex items-center justify-center ring-8 mb-4 transition-all duration-500"
                    :class="[scoreColor.ring, 'dark:bg-zinc-800 bg-gray-50']">

                    <!-- Animasi ping saat scoring -->
                    <div v-if="scoreAnimating" class="absolute inset-0 rounded-full animate-ping opacity-20"
                      :class="scoreColor.bg" />

                    <div class="text-center">
                      <p class="text-6xl font-black leading-none transition-all duration-300" :class="scoreColor.text">
                        {{ animatedScoreDisplay }}
                      </p>
                      <p class="text-sm dark:text-gray-400 text-gray-500 mt-1">/ 100</p>
                    </div>
                  </div>

                  <!-- ✅ Label + animasi — hanya muncul setelah animasi angka selesai -->
                  <Transition name="score-reveal">
                    <div v-if="!scoreAnimating && showScoreReason" class="flex flex-col items-center gap-3 w-full">

                      <!-- Range 0-40: merah + shake -->
                      <template v-if="animatedScoreDisplay <= 40">
                        <div class="px-5 py-2 rounded-full font-black text-sm bg-red-500 text-white animate-score-low">
                          😟 Perlu Ditingkatkan
                        </div>
                        <p class="text-xs dark:text-gray-400 text-gray-500 text-center">
                          Sesi ini memerlukan perhatian lebih. Tingkatkan durasi dan kualitas listening.
                        </p>
                      </template>

                      <!-- Range 40-80: kuning + bounce -->
                      <template v-else-if="animatedScoreDisplay <= 80">
                        <div
                          class="px-5 py-2 rounded-full font-black text-sm bg-yellow-500 text-white animate-score-mid">
                          🙂 Cukup Baik
                        </div>
                        <p class="text-xs dark:text-gray-400 text-gray-500 text-center">
                          Sesi berjalan dengan baik. Masih ada ruang untuk perbaikan.
                        </p>
                      </template>

                      <!-- Range 80+: hijau + bounce besar -->
                      <template v-else>
                        <div
                          class="px-5 py-2 rounded-full font-black text-sm bg-green-500 text-white animate-score-high">
                          🎉 Sangat Baik!
                        </div>
                        <p class="text-xs dark:text-gray-400 text-gray-500 text-center">
                          Luar biasa! Sesi mengajar berjalan sangat efektif.
                        </p>
                      </template>

                    </div>
                  </Transition>

                  <!-- Loading state saat animasi masih jalan -->
                  <div v-if="scoreAnimating" class="flex flex-col items-center gap-2 mt-2">
                    <div class="h-3 w-32 rounded dark:bg-zinc-700 bg-gray-200 animate-pulse" />
                  </div>

                </div>

                <!-- Evaluasi AI — muncul setelah animasi selesai -->
                <Transition name="score-reveal">
                  <div v-if="showScoreReason && sessionScoreReason && !scoreAnimating"
                    class="w-full rounded-xl dark:bg-zinc-800 bg-gray-50 border dark:border-zinc-700 border-gray-200 px-4 py-3">
                    <p class="text-[10px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-2">
                      Evaluasi AI
                    </p>
                    <p class="text-xs dark:text-gray-300 text-gray-700 leading-relaxed">
                      {{ sessionScoreReason }}
                    </p>
                  </div>
                </Transition>

              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t dark:border-zinc-700 border-gray-100 flex-shrink-0">
            <button @click="emit('close')"
              class="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 bg-brand-red dark:bg-brand-green flex items-center justify-center gap-2">
              <i class="ri-check-line" />
              Selesai
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Label muncul dengan fade + slide up */
.score-reveal-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.score-reveal-leave-active {
  transition: all 0.2s ease;
}

.score-reveal-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.score-reveal-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* 0-40: shake merah */
@keyframes score-low {

  0%,
  100% {
    transform: translateX(0);
  }

  15% {
    transform: translateX(-6px) rotate(-2deg);
  }

  30% {
    transform: translateX(6px) rotate(2deg);
  }

  45% {
    transform: translateX(-4px);
  }

  60% {
    transform: translateX(4px);
  }

  75% {
    transform: translateX(-2px);
  }
}

.animate-score-low {
  animation: score-low 0.6s ease-in-out;
}

/* 40-80: bounce sedang kuning */
@keyframes score-mid {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }

  60% {
    transform: scale(1.05);
  }

  80% {
    transform: scale(0.97);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-score-mid {
  animation: score-mid 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 80+: bounce besar + glow hijau */
@keyframes score-high {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }

  50% {
    transform: scale(1.2);
  }

  70% {
    transform: scale(0.95);
  }

  85% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-score-high {
  animation: score-high 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
}
</style>