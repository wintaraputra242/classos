import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeMode } from '@/types'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(
    (localStorage.getItem('theme') as ThemeMode) || 'dark'
  )

  function apply() {
    const html = document.documentElement
    if (mode.value === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    localStorage.setItem('theme', mode.value)
  }

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
    apply()
  }

  // Apply on load
  apply()

  return { mode, toggle, apply }
})
