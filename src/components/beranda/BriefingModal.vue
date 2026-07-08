<!-- components/BriefingModal.vue -->
<script setup lang="ts">
defineProps<{
  modelValue: boolean
  briefingText: string
  loading: boolean
  error: string | null
  isSpeaking: boolean
  isPaused: boolean
  speakingStep: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'restart-tts'): void
  (e: 'toggle-tts'): void
  (e: 'complete'): void
  (e: 'retry'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="emit('update:modelValue', false); emit('close')" />
        <div class="relative w-full max-w-lg dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b dark:border-zinc-700 border-gray-100">
            <div class="flex items-center gap-2">
              <i class="ri-megaphone-fill dark:text-brand-green text-brand-red" />
              <h3 class="font-bold dark:text-white text-gray-900 text-sm">Briefing</h3>
              <span class="text-[10px] dark:text-gray-500 text-gray-400">Langkah 1 dari 4</span>
            </div>
            <button @click="emit('update:modelValue', false); emit('close')"
              class="w-7 h-7 rounded-full dark:bg-zinc-800 bg-gray-100 flex items-center justify-center dark:text-gray-400 text-gray-500">
              <i class="ri-close-line text-sm" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-5">

            <!-- Animasi saat TTS playing -->
            <div v-if="isSpeaking && !isPaused && speakingStep === 'briefing'"
              class="flex flex-col items-center py-4 mb-4">
              <div class="relative w-16 h-16 flex items-center justify-center mb-3">
                <div class="absolute inset-0 rounded-full bg-brand-red/10 dark:bg-brand-green/10 animate-ping" />
                <div class="absolute inset-2 rounded-full bg-brand-red/15 dark:bg-brand-green/15 animate-ping"
                  style="animation-delay:0.3s" />
                <div
                  class="relative w-10 h-10 rounded-full bg-brand-red/20 dark:bg-brand-green/20 border border-brand-red/40 dark:border-brand-green/40 flex items-center justify-center">
                  <i class="ri-volume-up-fill text-brand-red dark:text-brand-green text-lg" />
                </div>
              </div>

              <div class="flex items-end gap-1 h-8 mb-3">
                <div v-for="i in 7" :key="i" class="w-1.5 rounded-full bg-brand-red dark:bg-brand-green" :style="{
                  height: `${[50, 80, 40, 100, 60, 85, 45][i - 1]}%`,
                  animation: `soundBar 0.8s ease-in-out infinite alternate`,
                  animationDelay: `${(i - 1) * 0.1}s`
                }" />
              </div>

              <p class="text-xs font-medium dark:text-brand-green text-brand-red">Sedang membacakan briefing...</p>
            </div>

            <!-- Loading state -->
            <div v-if="loading && !briefingText" class="py-2">
              <div class="flex items-center gap-2 mb-4">
                <div class="flex gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-red dark:bg-brand-green animate-bounce"
                    style="animation-delay: 0ms" />
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-red dark:bg-brand-green animate-bounce"
                    style="animation-delay: 150ms" />
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-red dark:bg-brand-green animate-bounce"
                    style="animation-delay: 300ms" />
                </div>
                <span class="text-xs font-medium dark:text-gray-400 text-gray-500">Menyusun briefing...</span>
              </div>

              <div class="space-y-2.5">
                <div class="h-3 rounded-full dark:bg-zinc-800 bg-gray-100 overflow-hidden relative shimmer-line"
                  style="width: 92%" />
                <div class="h-3 rounded-full dark:bg-zinc-800 bg-gray-100 overflow-hidden relative shimmer-line"
                  style="width: 100%; animation-delay: 0.15s" />
                <div class="h-3 rounded-full dark:bg-zinc-800 bg-gray-100 overflow-hidden relative shimmer-line"
                  style="width: 75%; animation-delay: 0.3s" />
                <div class="h-3 rounded-full dark:bg-zinc-800 bg-gray-100 overflow-hidden relative shimmer-line"
                  style="width: 88%; animation-delay: 0.45s" />
              </div>
            </div>

            <!-- Error state -->
            <div v-else-if="error && !briefingText" class="py-6 flex flex-col items-center text-center gap-2">
              <i class="ri-error-warning-line text-2xl text-red-500" />
              <p class="text-xs dark:text-gray-400 text-gray-500">Gagal memuat briefing. Silakan coba lagi.</p>
              <button @click="emit('retry')"
                class="mt-1 px-3 py-1.5 rounded-lg text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600">
                Coba Lagi
              </button>
            </div>

            <!-- Teks briefing -->
            <div v-else class="max-h-60 overflow-y-auto scrollbar-hide">
              <p class="text-sm dark:text-gray-300 text-gray-600 leading-relaxed whitespace-pre-line">
                {{ briefingText }}<span v-if="loading"
                  class="inline-block w-1.5 h-3.5 bg-brand-red dark:bg-brand-green ml-0.5 align-middle animate-pulse" />
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-5 pb-5 flex gap-2">
            <button @click="emit('restart-tts')"
              class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity">
              <i class="ri-restart-line text-base" />
            </button>

            <button @click="emit('toggle-tts')"
              class="flex-1 py-2.5 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5">
              <i :class="isSpeaking && speakingStep === 'briefing' ? 'ri-stop-fill' : 'ri-volume-up-line'" />
              {{ isSpeaking && speakingStep === 'briefing' ? 'Hentikan Suara' : 'Dengarkan Briefing' }}
            </button>

            <button @click="emit('complete')"
              class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
              Lanjut
              <i class="ri-arrow-right-line" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>