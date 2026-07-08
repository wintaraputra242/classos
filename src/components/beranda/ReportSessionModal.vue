<!-- components/beranda/SessionReportModal.vue -->
<script setup lang="ts">
defineProps<{
  modelValue: boolean
  capturedPhoto?: string | null
  faceCount?: number | null
  listeningStartTime?: string | null
  listeningStopTime?: string | null
  summaryText?: string
  endClassNote?: string
  animatedScoreDisplay?: number
  sessionScoreReason?: string
  scoreAnimating?: boolean
  showScoreReason?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

function formatSessionDuration(start: string | null | undefined, stop: string | null | undefined): string {
  if (!start || !stop) return '—'
  const diffSec = Math.floor((new Date(stop).getTime() - new Date(start).getTime()) / 1000)
  const m = Math.floor(Math.max(0, diffSec) / 60).toString().padStart(2, '0')
  const s = Math.floor(Math.max(0, diffSec) % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatClockTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function sanitizeAiText(text: string | undefined): string {
  if (!text) return ''
  return text.replace(/[*#`]/g, '').trim()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div
          class="relative w-full max-w-4xl dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-5 border-b dark:border-zinc-700 border-gray-100 flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="ri-file-chart-2-fill dark:text-brand-green text-brand-red text-lg" />
              <h3 class="font-bold dark:text-white text-gray-900 text-base">Laporan Sesi Mengajar</h3>
            </div>
          </div>

          <!-- Body -->
          <div class="overflow-y-auto flex-1">

            <!-- Foto -->
            <div class="relative">
              <img v-if="capturedPhoto" :src="capturedPhoto"
                class="w-full aspect-[16/9] md:aspect-[21/9] object-cover" />
              <div v-else
                class="w-full aspect-[16/9] md:aspect-[21/9] dark:bg-zinc-800 bg-gray-100 flex items-center justify-center">
                <span class="text-xs dark:text-gray-500 text-gray-400">Tidak ada foto</span>
              </div>

              <div
                class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
              <div class="absolute bottom-3 left-4 flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-brand-green/90 flex items-center justify-center flex-shrink-0">
                  <i class="ri-group-line text-white text-sm" />
                </div>
                <div>
                  <p class="text-[10px] text-white/80 leading-none mb-0.5">Siswa Terdeteksi</p>
                  <p class="text-base font-black text-white leading-none">
                    {{ faceCount ?? 0 }} <span class="text-xs font-normal text-white/80">orang</span>
                  </p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div class="grid md:grid-cols-2 gap-6">

                <!-- Kolom kiri -->
                <div class="space-y-3">
                  <div
                    class="rounded-xl dark:bg-zinc-800 bg-gray-50 border dark:border-zinc-700 border-gray-200 px-4 py-3">
                    <p class="text-[10px] dark:text-gray-500 text-gray-400 mb-0.5">Durasi Listening</p>
                    <p class="text-lg font-black dark:text-white text-gray-900">
                      {{ formatSessionDuration(listeningStartTime, listeningStopTime) }}
                    </p>
                  </div>

                  <div class="flex items-center justify-between text-xs dark:text-gray-400 text-gray-500 px-1">
                    <span><i class="ri-play-circle-line mr-1" />Mulai: {{ formatClockTime(listeningStartTime) }}</span>
                    <span><i class="ri-stop-circle-line mr-1" />Selesai: {{ formatClockTime(listeningStopTime) }}</span>
                  </div>

                  <div v-if="summaryText">
                    <p class="text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5 mt-2">Ringkasan Kelas</p>
                    <div
                      class="rounded-xl dark:bg-zinc-800 bg-gray-50 border dark:border-zinc-700 border-gray-200 px-4 py-3 max-h-40 overflow-y-auto scrollbar-hide">
                      <p class="text-xs dark:text-gray-300 text-gray-600 leading-relaxed whitespace-pre-line">
                        {{ sanitizeAiText(summaryText) }}
                      </p>
                    </div>
                  </div>

                  <div v-if="endClassNote">
                    <p class="text-xs font-bold dark:text-gray-300 text-gray-700 mb-1.5">Catatan Guru</p>
                    <p class="text-xs dark:text-gray-400 text-gray-500 leading-relaxed">{{ endClassNote }}</p>
                  </div>
                </div>

                <!-- Kolom kanan: Score -->
                <div
                  class="flex flex-col items-center justify-center py-4 rounded-2xl dark:bg-zinc-800/60 bg-gray-50 border dark:border-zinc-700 border-gray-100">
                  <p class="text-[10px] font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-1">
                    Skor Sesi
                  </p>
                  <div class="relative flex items-center justify-center">
                    <span class="font-mono font-black leading-none transition-colors"
                      :class="scoreAnimating ? 'text-6xl dark:text-gray-400 text-gray-400' : 'text-7xl text-brand-red dark:text-brand-green'">
                      {{ animatedScoreDisplay }}
                    </span>
                    <span class="text-lg font-bold dark:text-gray-500 text-gray-400 ml-1 mt-6">/100</span>
                  </div>

                  <Transition name="fade">
                    <p v-if="showScoreReason && sessionScoreReason"
                      class="text-xs dark:text-gray-400 text-gray-500 leading-relaxed text-center mt-3 px-4 whitespace-pre-line">
                      {{ sanitizeAiText(sessionScoreReason) }}
                    </p>
                    <p v-else-if="showScoreReason && !sessionScoreReason"
                      class="text-xs dark:text-gray-500 text-gray-400 italic text-center mt-3 px-4">
                      Tidak ada catatan alasan dari sistem.
                    </p>
                  </Transition>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-5 border-t dark:border-zinc-700 border-gray-100 flex-shrink-0">
            <button @click="$emit('close')" :disabled="scoreAnimating"
              class="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
              {{ scoreAnimating ? 'Menghitung skor...' : 'Selesai' }}
              <i v-if="!scoreAnimating" class="ri-check-line" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>