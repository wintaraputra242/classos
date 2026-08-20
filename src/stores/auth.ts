import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Jenjang, StikerNewsSetting, ProvinsiItem, KabupatenItem, ScanUniqIdData } from '@/types'
import { fetchSetting, saveSetting, login as loginDashboard, logout as logoutDashboard, scanUniqId as scanUniqIdApi, apiProv, apiKab, apiFormTrial, apiReportKonten, apiRequestKonten, clearTokenCache } from '@/services/api'
import { usePlayerStore } from '@/stores/player'

export const useAuthStore = defineStore('auth', () => {
  interface LinkedUser { name: string; token: string; userId: string, photo: string }
  const linkedUser = ref<LinkedUser | null>(
    JSON.parse(localStorage.getItem('sn_linked_user') ?? 'null')
  )
  const token = ref<string | null>(
    localStorage.getItem('sn_token')
  )
  const setting = ref<StikerNewsSetting>({ auto_play: 1, play_mode: 0 })
  const settingLoaded = ref(false)
  const loading = ref(false)

  // Info site dari dashboard API
  const siteName = ref<string | null>(localStorage.getItem('sn_site_name'))
  const siteLogo = ref<string | null>(localStorage.getItem('sn_site_logo'))
  const isTrial = ref<boolean | null>(localStorage.getItem('sn_trial') === '1' ? true : false)
  const expiredDate = ref<string | null>(localStorage.getItem('sn_expired_at'))
  const estimationDay = ref<string | null>(localStorage.getItem('sn_estimation_day'))

  const isLoggedIn = computed(() => {
    if (!token.value) return false
    return true
    // return new Date(token.value.expiresAt) > new Date()
  })

  // TODO: response login dashboard API belum menyertakan id_user/jenjang milik user
  // yang login — token di sini hanya berisi accessToken (string), berbeda dari alur
  // demo lama yang menyimpan objek Token lengkap. Sampai backend menambahkan field
  // tsb, jenjang & userId tetap pakai fallback (identik dengan perilaku sebelumnya).
  const jenjang = computed<Jenjang | null>(() => null)

  const userId = computed<number>(() => 2)

  // ── login ──────────────────────────────────────────────────────────────────
  async function login(code: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true

    try {
      const dashboardRes = await loginDashboard(code.trim())
      if (dashboardRes?.data) {
        siteName.value = dashboardRes.data.name_site ?? null
        siteLogo.value = dashboardRes.data.logo_site ?? null
        isTrial.value = dashboardRes.data.isTrial ?? false
        expiredDate.value = dashboardRes.data.expired_at ?? null
        estimationDay.value = dashboardRes.data.sisa_hari_aktif ?? null
        token.value = dashboardRes.data.tokens.accessToken ?? null
        localStorage.setItem('sn_token', String(token.value))
        if (siteName.value) localStorage.setItem('sn_site_name', siteName.value)
        if (siteLogo.value) localStorage.setItem('sn_site_logo', siteLogo.value)
        if (isTrial.value) localStorage.setItem('sn_trial', isTrial.value ? '1' : '0')
        if (expiredDate.value) localStorage.setItem('sn_expired_at', expiredDate.value)
        if (estimationDay.value) localStorage.setItem('sn_estimation_day', estimationDay.value)

        // Non-blocking: load setting
        loadSetting()
      }

      return {
        success: dashboardRes?.success ?? false,
        error: dashboardRes?.success ? undefined : (dashboardRes?.message ?? 'Login gagal'),
      }
    } catch (e) {
      console.warn('[login] dashboard login failed (non-critical):', e)
      return { success: false, error: e instanceof Error ? e.message : 'Login gagal' }
    } finally {
      loading.value = false
    }
  }

  // ── logout ─────────────────────────────────────────────────────────────────
  function logout() {
    const playerStore = usePlayerStore()

    // ✅ Stop audio sebelum clear session
    playerStore.stop()
    playerStore.clearPreview()
    playerStore.setNullQueue()
    playerStore.resetPlayer()

    // Reset currentTrack agar BottomPlayer hilang
    playerStore.currentTrack = null

    token.value = null
    settingLoaded.value = false
    siteName.value = null
    siteLogo.value = null
    localStorage.removeItem('sn_token')
    localStorage.removeItem('sn_access_token')
    localStorage.removeItem('sn_refresh_token')
    localStorage.removeItem('sn_site_name')
    localStorage.removeItem('sn_site_logo')
    localStorage.removeItem('sn_trial')
    localStorage.removeItem('sn_linked_user')
    localStorage.removeItem('sn_expired_at')
    localStorage.removeItem('sn_estimation_day')
    localStorage.removeItem('playlist_selected')
    localStorage.removeItem('classos_session_state')
    localStorage.removeItem('classos_id_state')
    clearTokenCache()
    logoutDashboard() // ← hapus accessToken & refreshToken dari localStorage
  }

  // ── setting ────────────────────────────────────────────────────────────────
  // TODO: sama seperti TODO userId di atas — belum ada id_user untuk request
  // setting per-user, jadi tetap no-op (identik dengan perilaku sebelumnya).
  const SETTING_SYNC_ENABLED = false

  async function loadSetting() {
    if (!SETTING_SYNC_ENABLED) return
    try {
      const data = await fetchSetting(userId.value)
      if (data) {
        setting.value = {
          auto_play: data.auto_play ?? 1,
          play_mode: data.play_mode ?? 0,
        }
      }
    } catch (e) {
      console.warn('[loadSetting] fallback to default:', e)
    } finally {
      settingLoaded.value = true
    }
  }

  async function updateSetting(patch: Partial<StikerNewsSetting>) {
    if (!SETTING_SYNC_ENABLED) return
    setting.value = { ...setting.value, ...patch }
    try {
      await saveSetting({
        userid: userId.value,
        auto_play: setting.value.auto_play as 0 | 1,
        play_mode: setting.value.play_mode as 0 | 1,
      })
    } catch (e) {
      console.warn('[updateSetting] save failed:', e)
    }
  }

  // Load setting jika sudah login saat app boot
  if (isLoggedIn.value) {
    loadSetting()
  }

  async function scanUniqId(code: string): Promise<{ success: boolean; error?: string; data?: ScanUniqIdData }> {
    loading.value = true

    try {
      const res = await scanUniqIdApi(code.trim(), token.value ?? undefined)

      if (res?.data) {
        return {
          success: true,
          data: res.data,
        }
      }

      return {
        success: false,
        error: res?.message ?? 'Kode tidak valid atau sudah kadaluarsa.',
      }
    } catch (e) {
      console.warn('[scanUniqId] failed:', e)
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Gagal memverifikasi. Periksa koneksi internet.',
      }
    } finally {
      loading.value = false
    }
  }

  // ── Trial Form ─────────────────────────────────────────────────────────────
  const provList = ref<ProvinsiItem[]>([])
  const kabList = ref<KabupatenItem[]>([])
  const loadingProv = ref(false)
  const loadingKab = ref(false)
  const loadingSubmitTrial = ref(false)

  async function fetchProv() {
    loadingProv.value = true
    try {
      const res = await apiProv()
      provList.value = res?.data ?? []
    } catch (e) {
      console.warn('[fetchProv] failed:', e)
    } finally {
      loadingProv.value = false
    }
  }

  async function fetchKab(idProv: string | number) {
    loadingKab.value = true
    kabList.value = []
    try {
      const res = await apiKab(idProv)
      kabList.value = res?.data ?? []
    } catch (e) {
      console.warn('[fetchKab] failed:', e)
    } finally {
      loadingKab.value = false
    }
  }

  async function submitFormTrial(data: {
    nama_sekolah: string
    nama_pengisi: string
    nomor_wa: string
    id_provinsi: string | number
    provinsi: string
    id_kabupaten_kota: string | number
    kabupaten_kota: string
    jumlah_kelas: string | number
    jumlah_smartboard: string | number
    pakai_smart_tv: string | number
    pakai_ac: string | number
  }): Promise<{ success: boolean; error?: string }> {
    loadingSubmitTrial.value = true
    try {
      const res = await apiFormTrial(data)
      if (res?.data || res?.success) {
        localStorage.setItem('sn_trial_survey_done', '1')
        return { success: true }
      }
      return { success: false, error: res?.message ?? 'Gagal menyimpan data.' }
    } catch (e) {
      console.warn('[submitFormTrial] failed:', e)
      return { success: false, error: e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.' }
    } finally {
      loadingSubmitTrial.value = false
    }
  }

  // ── Report & Request Konten ───────────────────────────────────────────────
  const loadingSubmitReport = ref(false)
  const loadingSubmitRequest = ref(false)

  async function submitReportKonten(data: {
    id_konten: string | number
    judul_konten: string
    nama: string
    id_provinsi: string | number
    provinsi: string
    id_kabupaten_kota: string | number
    kabupaten_kota: string
    sekolah: string
    tingkat: string
    alasan: string
  }): Promise<{ success: boolean; error?: string }> {
    loadingSubmitReport.value = true
    try {
      const res = await apiReportKonten(data)
      if (res?.data || res?.success) return { success: true }
      return { success: false, error: res?.message ?? 'Gagal mengirim laporan.' }
    } catch (e) {
      console.warn('[submitReportKonten] failed:', e)
      return { success: false, error: e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.' }
    } finally {
      loadingSubmitReport.value = false
    }
  }

  async function submitRequestKonten(data: {
    request_id: string
    nama: string
    id_provinsi: string | number
    provinsi: string
    id_kabupaten_kota: string | number
    kabupaten_kota: string
    sekolah: string
    tingkat: string
    fase: string
    judul: string
    penjelasan_konten: string
    capaian_pembelajaran: string
    tujuan_pembelajaran: string
    link_referensi?: string
    alasan_penting: string
  }): Promise<{ success: boolean; error?: string }> {
    loadingSubmitRequest.value = true
    try {
      const res = await apiRequestKonten(data)
      if (res?.data || res?.success) return { success: true }
      return { success: false, error: res?.message ?? 'Gagal mengirim permintaan.' }
    } catch (e) {
      console.warn('[submitRequestKonten] failed:', e)
      return { success: false, error: e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.' }
    } finally {
      loadingSubmitRequest.value = false
    }
  }

  return {
    token, isLoggedIn, jenjang, userId, setting, settingLoaded, siteName, siteLogo, isTrial, loading, linkedUser, provList, kabList, loadingProv, loadingKab, loadingSubmitTrial, expiredDate, estimationDay, fetchProv, fetchKab, submitFormTrial, scanUniqId, login, logout, loadSetting, updateSetting,
    loadingSubmitReport, loadingSubmitRequest, submitReportKonten, submitRequestKonten
  }
})
