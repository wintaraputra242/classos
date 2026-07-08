import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ActiveMenu, ActiveSidebar, Jenjang } from '@/types'

export const useAppStore = defineStore('app', () => {
  const activeMenu = ref<ActiveMenu>('beranda')
  const activeSidebar = ref<ActiveSidebar>('beranda')
  const activeJenjangFilter = ref<Jenjang[]>(['SD', 'SMP', 'SMA', 'SMK'])
  const searchQuery = ref('')
  const isFullscreen = ref(false)

  function setActiveMenu(menu: ActiveMenu) { activeMenu.value = menu }
  function setActiveSidebar(item: ActiveSidebar) { activeSidebar.value = item }
  function setSearch(q: string) { searchQuery.value = q }

  function toggleJenjangFilter(j: Jenjang) {
    const idx = activeJenjangFilter.value.indexOf(j)
    if (idx > -1) {
      if (activeJenjangFilter.value.length > 1) activeJenjangFilter.value.splice(idx, 1)
    } else {
      activeJenjangFilter.value.push(j)
    }
  }

  const searchInputRef = ref<HTMLInputElement | null>(null)

  function registerSearchInput(el: HTMLInputElement | null) {
    searchInputRef.value = el
  }

  function focusSearchInput() {
    searchInputRef.value?.focus()
  }

  return { activeMenu, activeSidebar, activeJenjangFilter, searchQuery, isFullscreen, searchInputRef, setActiveMenu, setActiveSidebar, setSearch, toggleJenjangFilter, registerSearchInput, focusSearchInput }
})
