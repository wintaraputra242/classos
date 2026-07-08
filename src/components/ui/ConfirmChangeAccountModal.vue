<!-- components/beranda/ConfirmGantiAkunModal.vue -->
<script setup lang="ts">
defineProps<{
  modelValue: boolean
  linkedUserName?: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="$emit('update:modelValue', false)">
        <div class="w-full max-w-sm rounded-2xl dark:bg-zinc-900 bg-white shadow-2xl p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
              <i class="ri-swap-2-line text-yellow-500 text-lg" />
            </div>
            <div>
              <p class="font-bold dark:text-white text-gray-900 text-sm">Ganti Akun?</p>
              <p class="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                Akun <strong class="dark:text-gray-200 text-gray-700">{{ linkedUserName }}</strong> akan diputuskan
              </p>
            </div>
          </div>
          <p class="text-xs dark:text-gray-400 text-gray-500 mb-5 leading-relaxed">
            Anda akan keluar dari akun saat ini dan diminta untuk scan QR atau memasukkan kode akun baru.
          </p>
          <div class="flex gap-2">
            <button @click="$emit('update:modelValue', false)"
              class="flex-1 py-2.5 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-gray-100 dark:text-gray-300 text-gray-600 hover:opacity-80 transition-opacity">
              Batal
            </button>
            <button @click="$emit('confirm')"
              class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-red dark:bg-brand-green text-white hover:opacity-80 transition-opacity">
              Ya, Ganti Akun
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>