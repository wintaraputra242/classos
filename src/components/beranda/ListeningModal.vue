<!-- components/ListeningModal.vue -->
<script setup lang="ts">
defineProps<{
  modelValue: boolean
  listeningElapsed: number
  listeningStatus: boolean
  stepStatus: 'locked' | 'active' | 'done'
  submittingListening: boolean
  formatListeningTime: (secs: number) => string
  transcriptValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'toggle'): void
  (e: 'complete'): void
}>()
</script>

<template>
  <!-- Modal utama -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="emit('update:modelValue', false)" />
        <div class="relative w-full max-w-md dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b dark:border-zinc-700 border-gray-100">
            <div class="flex items-center gap-2">
              <i class="ri-headphone-fill dark:text-brand-green text-brand-red" />
              <h3 class="font-bold dark:text-white text-gray-900 text-sm">Listening</h3>
              <span class="text-[10px] dark:text-gray-500 text-gray-400">Langkah 2 dari 4</span>
            </div>
            <button @click="emit('update:modelValue', false)"
              class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-800 bg-gray-100 hover:dark:bg-zinc-700 hover:bg-gray-200 transition-colors">
              <i class="ri-close-line text-sm dark:text-gray-400 text-gray-500" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 text-center">
            <div class="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <template v-if="listeningStatus">
                <div class="absolute inset-0 rounded-full bg-brand-red/10 animate-ping" />
                <div class="absolute inset-2 rounded-full bg-brand-red/15 animate-ping" style="animation-delay:0.3s" />
              </template>
              <div class="relative w-14 h-14 rounded-full flex items-center justify-center"
                :class="listeningStatus ? 'bg-brand-red/20' : 'dark:bg-zinc-800 bg-gray-100'">
                <i class="ri-mic-fill text-2xl"
                  :class="listeningStatus ? 'text-brand-red' : 'dark:text-gray-500 text-gray-400'" />
              </div>
            </div>

            <p class="text-3xl font-mono font-black dark:text-white text-gray-900 mb-1">
              {{ formatListeningTime(listeningElapsed) }}
            </p>
            <p class="text-xs dark:text-gray-500 text-gray-400 mb-5">
              {{ listeningStatus ? 'Sedang mendengarkan...' : (listeningElapsed > 0 ? 'Dijeda' : 'Belum dimulai') }}
            </p>

            <button @click="emit('toggle')" :disabled="stepStatus === 'done'"
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="listeningStatus ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-brand-red dark:bg-brand-green hover:opacity-80'">
              <i :class="listeningStatus ? 'ri-pause-fill' : 'ri-play-fill'" />
              {{ stepStatus === 'done' ? 'Listening Selesai' : listeningStatus ? 'Jeda Listening' : (listeningElapsed >
                0 ?
                'Lanjutkan' : 'Mulai Listening') }}
            </button>

            <button @click="emit('complete')"
              :disabled="listeningElapsed === 0 || stepStatus === 'done' || submittingListening"
              class="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-red text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              :class="{ '!bg-brand-green': stepStatus === 'done' }">
              <i v-if="submittingListening" class="ri-loader-4-line animate-spin" />
              {{ submittingListening ? 'Menyimpan...' : stepStatus === 'done' ? 'Sudah Selesai' : 'Selesai & Lanjut' }}
              <i v-if="!submittingListening" :class="stepStatus === 'done' ? 'ri-check-line' : 'ri-arrow-right-line'" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Floating mini widget -->
  <Teleport to="body">
    <Transition name="slide-in">
      <div v-if="!modelValue && listeningElapsed > 0 && stepStatus === 'active'"
        class="fixed bottom-24 right-4 z-[9998]">
        <div
          class="dark:bg-zinc-900 bg-white rounded-2xl shadow-xl border dark:border-zinc-700 border-gray-200 px-4 py-3 flex items-center gap-3 min-w-[200px]">

          <!-- Mic icon + pulse -->
          <div class="relative flex-shrink-0">
            <div class="w-9 h-9 rounded-full flex items-center justify-center"
              :class="listeningStatus ? 'bg-brand-red/15 dark:bg-brand-red/20' : 'dark:bg-zinc-800 bg-gray-100'">
              <i class="ri-mic-fill text-base"
                :class="listeningStatus ? 'text-brand-red' : 'dark:text-gray-500 text-gray-400'" />
            </div>
            <span v-if="listeningStatus"
              class="absolute inset-0 rounded-full border border-brand-red animate-ping opacity-50" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold dark:text-white text-gray-900">Listening</p>
            <p class="text-xs font-mono font-black tabular-nums"
              :class="listeningStatus ? 'text-brand-red' : 'dark:text-gray-500 text-gray-400'">
              {{ formatListeningTime(listeningElapsed) }}
            </p>
          </div>

          <!-- Tombol pause/play -->
          <button @click="emit('toggle')"
            class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0" :class="listeningStatus
              ? 'bg-brand-red/10 hover:bg-brand-red/20'
              : 'dark:bg-zinc-800 bg-gray-100 hover:dark:bg-zinc-700 hover:bg-gray-200'">
            <i class="text-sm" :class="listeningStatus
              ? 'ri-pause-fill text-brand-red'
              : 'ri-play-fill dark:text-gray-400 text-gray-500'" />
          </button>

          <!-- Tombol buka popup -->
          <button @click="emit('update:modelValue', true)"
            class="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-zinc-800 bg-gray-100 hover:dark:bg-zinc-700 hover:bg-gray-200 transition-colors flex-shrink-0">
            <i class="ri-arrow-up-s-line text-sm dark:text-gray-400 text-gray-500" />
          </button>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>