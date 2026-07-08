import { ref, onMounted, onUnmounted } from 'vue'

export function useFullscreen() {
  const isFullscreen = ref(false)

  function toggle() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => { isFullscreen.value = true })
    } else {
      document.exitFullscreen().then(() => { isFullscreen.value = false })
    }
  }

  function onFsChange() {
    isFullscreen.value = !!document.fullscreenElement
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'F11') { e.preventDefault(); toggle() }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', onFsChange)
    document.removeEventListener('keydown', onKeydown)
  })

  return { isFullscreen, toggle }
}
