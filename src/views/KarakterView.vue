<script setup lang="ts">
import { ref, computed } from 'vue'
import { karakterData } from '@/data/mockData'
import type { KarakterItem } from '@/types'

// Tab filter
const tabs = [
  { label: 'Semua', value: 'all', icon: 'ri-apps-line' },
  { label: 'Karakter', value: 'karakter', icon: 'ri-user-heart-line' },
  { label: 'Habit', value: 'habit', icon: 'ri-checkbox-circle-line' },
]
const activeTab = ref<string>('all')

const filteredData = computed(() => {
  if (activeTab.value === 'all') return karakterData
  return karakterData.filter(k => k.category === activeTab.value)
})

// Highlight hari ini — rotasi berdasarkan tanggal
const dayIndex = new Date().getDate()
const habitData = computed(() => karakterData.filter(k => k.category === 'habit'))
const karaterDataArr = computed(() => karakterData.filter(k => k.category === 'karakter'))

const todayHighlight = computed<KarakterItem | undefined>(() => {
  const pool = activeTab.value === 'karakter'
    ? karaterDataArr.value
    : activeTab.value === 'habit'
      ? habitData.value
      : karakterData
  return pool[dayIndex % pool.length]
})

// Refleksi
const refleksiList = [
  'Apa satu kebiasaan kecil yang bisa kamu mulai hari ini untuk menjadi lebih baik?',
  'Siapa orang yang paling menginspirasimu? Apa yang kamu pelajari darinya?',
  'Apa hal terbaikmu hari ini? Bagaimana kamu bisa mengulanginya besok?',
  'Karakter apa yang ingin paling kamu kuatkan minggu ini?',
  'Habit mana yang paling sulit kamu jaga? Apa yang membuatnya sulit?',
]
const todayRefleksi = refleksiList[dayIndex % refleksiList.length]

// Selected detail
const selectedItem = ref<KarakterItem | null>(null)

// Checklist habit
const checkedHabits = ref<Set<string>>(new Set())

function toggleHabit(id: string) {
  if (checkedHabits.value.has(id)) checkedHabits.value.delete(id)
  else checkedHabits.value.add(id)
}

const habitProgress = computed(() =>
  habitData.value.length
    ? Math.round((checkedHabits.value.size / habitData.value.length) * 100)
    : 0
)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-lg font-extrabold dark:text-white text-gray-900 flex items-center gap-2">
          <i class="ri-seedling-line text-brand-red dark:text-brand-green" />
          Karakter & Habit
        </h1>
        <p class="text-xs dark:text-gray-400 text-gray-500 mt-0.5">Bangun karakter mulia dan kebiasaan positif setiap
          hari</p>
      </div>

      <!-- Tab filter -->
      <div class="flex gap-1.5">
        <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
          class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
          :class="activeTab === tab.value
            ? 'bg-brand-red dark:bg-brand-green text-white'
            : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-400 text-gray-500 hover:dark:bg-gray-700 hover:bg-gray-200'">
          <i :class="tab.icon" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Highlight Hari Ini -->
    <div
      class="dark:bg-gradient-to-br dark:from-[#1e3a2f] dark:to-[#1a2d1a] bg-gradient-to-br from-red-50 to-red-50 rounded-2xl p-5 border dark:border-gray-700 border-gray-200 mb-6">
      <p
        class="text-[10px] font-bold uppercase tracking-widest dark:text-brand-green text-red-600 mb-2 flex items-center gap-1">
        <i class="ri-sun-line" />
        {{ activeTab === 'habit' ? 'Habit Baik Hari Ini' : activeTab === 'karakter' ? 'Karakter Pilihan Hari Ini' :
          'Fokus Hari Ini' }}
      </p>
      <div class="flex items-start gap-4">
        <div class="text-5xl">{{ todayHighlight?.emoji }}</div>
        <div class="flex-1">
          <h2 class="text-xl font-black dark:text-white text-gray-900 mb-1">{{ todayHighlight?.title }}</h2>
          <p class="text-sm dark:text-gray-300 text-gray-600 leading-relaxed">{{ todayHighlight?.description }}</p>
          <div v-if="todayHighlight?.category === 'habit'" class="mt-3 flex items-center gap-3">
            <div class="flex-1 h-2 rounded-full dark:bg-gray-700 bg-gray-200">
              <div class="h-2 rounded-full bg-brand-red dark:bg-brand-green transition-all" style="width: 60%" />
            </div>
            <span class="text-xs font-bold dark:text-brand-green text-red-600">60%</span>
          </div>
          <span v-else
            class="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green">
            Karakter
          </span>
        </div>
      </div>
    </div>

    <!-- Refleksi -->
    <div class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100 mb-6">
      <p
        class="text-[10px] font-bold uppercase tracking-widest dark:text-teal-400 text-red-600 mb-2 flex items-center gap-1">
        <i class="ri-question-mark" /> Refleksi Hari Ini
      </p>
      <p class="text-sm dark:text-gray-200 text-gray-700 leading-relaxed mb-3">{{ todayRefleksi }}</p>
      <button
        class="bg-brand-red dark:bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-red-400 dark:hover:bg-green-400 transition-colors">
        Diskusi di Kelas →
      </button>
    </div>

    <!-- Grid -->
    <h2
      class="text-xs font-bold uppercase tracking-wider dark:text-gray-500 text-gray-400 mb-3 flex items-center gap-1.5">
      <i class="ri-grid-line" />
      Semua {{ activeTab === 'all' ? 'Karakter & Habit' : activeTab === 'karakter' ? 'Karakter' : 'Habit' }}
    </h2>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="item in filteredData" :key="item.id"
        class="card-hover dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100 cursor-pointer text-center transition-all"
        :class="selectedItem?.id === item.id ? 'ring-2 ring-brand-red dark:ring-brand-green' : ''"
        @click="selectedItem = selectedItem?.id === item.id ? null : item">
        <div class="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-2" :class="item.bgClass">
          {{ item.emoji }}
        </div>
        <span class="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1" :class="item.category === 'karakter'
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
          : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300'">
          {{ item.category === 'karakter' ? 'Karakter' : 'Habit' }}
        </span>
        <p class="font-bold dark:text-white text-gray-900 text-sm mb-1">{{ item.title }}</p>
        <p class="text-xs dark:text-gray-400 text-gray-500 leading-relaxed">{{ item.description }}</p>
      </div>
    </div>

    <!-- Selected Detail -->
    <Transition name="slide-up">
      <div v-if="selectedItem"
        class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-5 border dark:border-brand-green border-brand-blue mb-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" :class="selectedItem.bgClass">
            {{ selectedItem.emoji }}
          </div>
          <div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="selectedItem.category === 'karakter'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
              : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300'">
              {{ selectedItem.category === 'karakter' ? 'Karakter' : 'Habit' }}
            </span>
            <h3 class="text-lg font-black dark:text-white text-gray-900 mt-1">{{ selectedItem.title }}</h3>
            <p class="text-sm dark:text-gray-400 text-gray-500">{{ selectedItem.description }}</p>
          </div>
        </div>
        <p class="text-sm dark:text-gray-300 text-gray-600 leading-relaxed mb-3">
          <span v-if="selectedItem.category === 'karakter'">
            Karakter <strong>{{ selectedItem.title }}</strong> adalah fondasi penting bagi setiap pelajar Indonesia.
            Dengan membangun nilai ini sejak dini, kamu akan tumbuh menjadi pribadi yang lebih baik dan siap menghadapi
            tantangan masa depan.
          </span>
          <span v-else>
            Habit <strong>{{ selectedItem.title }}</strong> adalah kebiasaan kecil yang berdampak besar.
            Lakukan setiap hari secara konsisten dan rasakan perubahan positifnya dalam hidupmu.
          </span>
        </p>
        <div class="flex justify-end gap-2">
          <!-- <button
            class="flex-1 bg-brand-green text-white text-xs font-bold py-2 rounded-full hover:bg-green-400 transition-colors flex items-center justify-center gap-1.5">
            <i class="ri-book-open-line" />
            Pelajari Lebih Lanjut
          </button> -->
          <button @click="selectedItem = null"
            class="px-4 py-2.5 bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 rounded-full">
            <i class="ri-close-line" />
            Tutup
          </button>
        </div>
      </div>
    </Transition>

    <!-- Checklist Habit -->
    <div class="dark:bg-[#1e1e1e] bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-100">
      <h2 class="text-sm font-extrabold dark:text-gray-200 text-gray-800 mb-3 flex items-center gap-2">
        <i class="ri-checkbox-circle-line text-brand-red dark:text-brand-green" />
        Checklist Habit Hari Ini
      </h2>
      <div class="space-y-2">
        <div v-for="habit in habitData" :key="habit.id"
          class="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors" :class="checkedHabits.has(habit.id)
            ? 'dark:bg-brand-green/10 bg-red-50'
            : 'hover:dark:bg-gray-800 hover:bg-gray-50'" @click="toggleHabit(habit.id)">
          <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
            :class="checkedHabits.has(habit.id)
              ? 'bg-brand-red border-brand-red dark:bg-brand-green dark:border-brand-green'
              : 'dark:border-gray-600 border-gray-300'">
            <i v-if="checkedHabits.has(habit.id)" class="ri-check-line text-white text-xs" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold dark:text-gray-200 text-gray-800 transition-colors"
              :class="{ 'line-through dark:text-gray-500 text-gray-400': checkedHabits.has(habit.id) }">
              {{ habit.title }}
            </p>
            <p class="text-[10px] dark:text-gray-500 text-gray-400">{{ habit.description }}</p>
          </div>
          <span class="text-lg">{{ habit.emoji }}</span>
        </div>
      </div>

      <!-- Progress summary -->
      <div class="mt-4 pt-3 border-t dark:border-gray-800 border-gray-100 flex items-center gap-3">
        <div class="flex-1 h-2 rounded-full dark:bg-gray-700 bg-gray-200">
          <div class="h-2 rounded-full bg-brand-red dark:bg-brand-green transition-all duration-500"
            :style="{ width: habitProgress + '%' }" />
        </div>
        <span class="text-xs font-bold dark:text-brand-green text-red-600 flex-shrink-0">
          {{ checkedHabits.size }}/{{ habitData.length }} selesai
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
