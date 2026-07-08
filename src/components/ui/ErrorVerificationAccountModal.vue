<!-- components/beranda/VerifyErrorModal.vue -->
<script setup lang="ts">
defineProps<{
  modelValue: boolean
  errorMessage?: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'retry': [mode: 'camera' | 'manual' | undefined]
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4"
        @click.self="$emit('update:modelValue', false)">
        <div
          class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-6 w-full max-w-sm border dark:border-gray-800 border-gray-200 shadow-xl">

          <!-- Icon -->
          <div class="flex flex-col items-center text-center mb-4">
            <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-3">
              <i class="ri-close-circle-line text-3xl text-red-500" />
            </div>
            <p class="text-sm font-extrabold dark:text-white text-gray-900 mb-1">Verifikasi Gagal</p>
            <p class="text-xs dark:text-gray-400 text-gray-500 leading-relaxed">{{ errorMessage }}</p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2">
            <button @click="$emit('retry', 'camera')"
              class="w-full py-2.5 rounded-xl bg-brand-red dark:bg-brand-green text-white text-xs font-bold hover:bg-red-500 dark:hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
              <i class="ri-qr-scan-2-line" />
              Coba Scan Ulang
            </button>
            <button @click="$emit('retry', 'manual')"
              class="w-full py-2.5 rounded-xl border dark:border-gray-700 border-gray-200 dark:text-gray-300 text-gray-600 text-xs font-bold hover:dark:bg-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <i class="ri-keyboard-line" />
              Input Kode Manual
            </button>
            <button @click="$emit('retry', undefined)"
              class="w-full py-2 text-xs dark:text-gray-500 text-gray-400 hover:text-gray-600 transition-colors">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>