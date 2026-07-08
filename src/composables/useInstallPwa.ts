// src/composables/useInstallPwa.ts
import { ref, onMounted, onUnmounted } from 'vue'

const deferredPrompt = ref<any>(null)
const isInstallable = ref(false)
const isInstalled = ref(false)

export function useInstallPwa() {
  function onBeforeInstall(e: Event) {
    e.preventDefault()
    deferredPrompt.value = e
    isInstallable.value = true
  }

  function onAppInstalled() {
    isInstalled.value = true
    isInstallable.value = false
    deferredPrompt.value = null
  }

  async function install() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      isInstalled.value = true
      isInstallable.value = false
    }
    deferredPrompt.value = null
  }

  onMounted(() => {
    // Cek apakah sudah terinstall
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    window.removeEventListener('appinstalled', onAppInstalled)
  })

  return { isInstallable, isInstalled, install }
}