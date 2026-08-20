// composables/useVersionCheck.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { apiVersion } from '@/services/api'

const VERSION_KEY = 'app_version'

// State di-scope di luar function -> singleton, dipakai bersama di seluruh app
// (supaya router.beforeEach dan komponen popup selalu lihat status yang sama)
const hasNewVersion = ref(false)
const newVersion = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | null = null
let checking = false

const releaseDate = ref('')  // ← tambahkan

async function fetchVersion(): Promise<string | { version: string; releaseDate?: string } | null> {
  try {
    const data = await apiVersion()
    return data ?? null
  } catch {
    return null
  }
}

export async function checkVersion() {
  if (hasNewVersion.value || checking) return
  checking = true

  try {
    const res = await fetchVersion()
    if (!res) return

    // Sesuaikan dengan struktur response API Anda
    const latest = typeof res === 'string' ? res : res.version
    const date = typeof res === 'string' ? '' : (res.releaseDate ?? '')

    const saved = localStorage.getItem(VERSION_KEY)

    if (!saved) {
      localStorage.setItem(VERSION_KEY, latest)
      return
    }

    if (latest !== saved) {
      newVersion.value = latest
      releaseDate.value = date  // ← simpan releaseDate
      hasNewVersion.value = true
      stopCheck()
    }
  } finally {
    checking = false
  }
}


function reload() {
  if (newVersion.value) {
    localStorage.setItem(VERSION_KEY, newVersion.value)
  }
  window.location.href = window.location.href
}

function stopCheck() {
  if (timer) { clearInterval(timer); timer = null }
}

function startCheck() {
  if (timer) return
  timer = setInterval(checkVersion, 5 * 60 * 1000)
}

export function useVersionCheck() {
  onMounted(async () => {
    await checkVersion()
    startCheck()
  })

  onUnmounted(() => {
    // Timer sengaja tidak di-stop di sini karena state-nya singleton (dipakai global).
    // Kalau composable ini cuma dipakai di 1 komponen spesifik dan tidak dipasang global,
    // panggil stopCheck() di sini.
  })

  return { hasNewVersion, newVersion, releaseDate, reload }
}