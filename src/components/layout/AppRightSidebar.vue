<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import quotesData from '@/data/quote.json'

const dayIndex = new Date().getDate() % quotesData.length
const featured = ref(quotesData[dayIndex])

const todayQuote = computed(() => featured.value)

const shuffle = ref(0) // trigger manual

const otherQuotes = computed(() => {
  shuffle.value // dibaca agar computed reaktif terhadap perubahan shuffle
  const filtered = quotesData.filter(q => q.text !== featured.value?.text)
  return filtered.sort(() => Math.random() - 0.5).slice(0, 6)
})

// Re-shuffle setiap 5 menit
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => shuffle.value++, 5 * 60 * 1000) })
onUnmounted(() => clearInterval(timer))

function setFeatured(quote: typeof quotesData[0]) {
  featured.value = quote
}

const speakingQuote = ref<{ text: string, author: string, emoji: string } | null>(null)
let _utterance: SpeechSynthesisUtterance | null = null

function toggleSpeak(quote: { text: string, author: string, emoji: string } | null) {
  if (!quote) return

  // Jika quote yang sama sedang dibacakan → stop
  if (speakingQuote.value?.text === quote.text) {
    window.speechSynthesis.cancel()
    speakingQuote.value = null
    return
  }

  window.speechSynthesis.cancel()
  speakingQuote.value = null

  const message = `Menurut ${quote.author}, yang mengatakan bahwa, ${quote.text}`

  _utterance = new SpeechSynthesisUtterance(message)
  _utterance.lang = 'id-ID'
  _utterance.rate = 1

  _utterance.onend = () => {
    speakingQuote.value = null
  }

  _utterance.onerror = () => {
    speakingQuote.value = null
  }

  // ← delay kecil, fix bug Chrome cancel+speak langsung
  setTimeout(() => {
    speakingQuote.value = quote
    window.speechSynthesis.speak(_utterance!)
  }, 100)
}

// Hentikan suara saat komponen unmount
onUnmounted(() => {
  window.speechSynthesis.cancel()
})
</script>

<template>
  <aside
    class="w-64 flex-shrink-0 hidden xl:flex flex-col gap-4 px-4 py-5 overflow-y-auto scrollbar-hide dark:bg-brand-dark bg-gray-50 border-l dark:border-gray-800 border-gray-200 pb-28">

    <!-- Header -->
    <div class="flex items-center gap-2 px-1">
      <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <p class="text-xs font-bold uppercase tracking-wider dark:text-gray-400 text-gray-500">Quote Hari Ini</p>
    </div>

    <!-- Quote of the day (berdasarkan tanggal) -->
    <div class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100 relative">
      <div class="flex items-start justify-between mb-3">
        <div class="text-3xl">{{ todayQuote?.emoji }}</div>
        <!-- <button class="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          :class="speakingQuote?.text === todayQuote?.text
            ? 'bg-brand-red/10 dark:bg-brand-green/10 text-brand-red dark:text-brand-green'
            : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-400 text-gray-400 hover:dark:text-gray-200 hover:text-gray-600'" @click="toggleSpeak(todayQuote)">
          <i :class="speakingQuote?.text === todayQuote?.text ? 'ri-volume-up-fill' : 'ri-volume-up-line'"
            class="text-sm" />
        </button> -->
      </div>
      <p class="dark:text-gray-200 text-gray-700 text-sm leading-relaxed">
        {{ todayQuote?.text }}
      </p>
      <p class="text-xs dark:text-gray-500 text-gray-400 italic mt-3">— {{ todayQuote?.author }}</p>
    </div>

    <!-- Quote lainnya -->
    <p class="text-xs font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 px-1">Quotes Lainnya</p>

    <div v-for="(quote, i) in otherQuotes" :key="i"
      class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100 cursor-pointer hover:dark:border-gray-600 hover:border-gray-300 transition-colors"
      @click="setFeatured(quote)">
      <div class="flex items-start gap-3">
        <span class="text-xl flex-shrink-0">{{ quote.emoji }}</span>
        <div class="min-w-0 flex-1">
          <p class="dark:text-gray-300 text-gray-600 text-xs leading-relaxed line-clamp-3">{{ quote.text }}</p>
          <p class="text-[10px] dark:text-gray-600 text-gray-400 italic mt-1.5">— {{ quote.author }}</p>
        </div>
        <!-- <button class="w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          :class="speakingQuote?.text === quote?.text
            ? 'bg-brand-red/10 dark:bg-brand-green/10 text-brand-red dark:text-brand-green'
            : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-400 text-gray-400 hover:dark:text-gray-200 hover:text-gray-600'" @click.stop="toggleSpeak(quote)">
          <i :class="speakingQuote?.text === quote?.text ? 'ri-volume-up-fill' : 'ri-volume-up-line'" class="text-xs" />
        </button> -->
      </div>
    </div>

  </aside>
</template>