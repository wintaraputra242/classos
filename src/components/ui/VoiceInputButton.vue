<!-- components/ui/VoiceInputButton.vue -->
<!-- Tombol mic kecil untuk isi input via suara — dipasang di pojok kanan input/textarea -->
<script setup lang="ts">
withDefaults(defineProps<{
  active: boolean
  variant?: 'input' | 'textarea'
}>(), {
  variant: 'input',
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button type="button" @click="emit('click')" :title="active ? 'Berhenti merekam' : 'Isi dengan suara'"
    class="absolute right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
    :class="[
      variant === 'textarea' ? 'top-2' : 'top-1/2 -translate-y-1/2',
      active
        ? 'bg-red-500 text-white'
        : 'dark:bg-zinc-700 bg-gray-200 dark:text-gray-300 text-gray-500 hover:dark:bg-zinc-600 hover:bg-gray-300'
    ]">
    <span v-if="active" class="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
    <i class="relative text-xs" :class="active ? 'ri-mic-fill' : 'ri-mic-line'" />
  </button>
</template>
