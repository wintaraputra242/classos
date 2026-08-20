/**
 * StikerNews API Service
 * BASE_BETA : https://id-beta.isn-speed.com  → write ops & data
 * BASE_PROD : https://id.isn-speed.com        → analytics (read-only prod)
 * BASE_DASHBOARD : https://classos.isn-speed.com/api → auth & dashboard
 */

const BASE_BETA = 'https://id-beta.isn-speed.com'
const BASE_PROD = 'https://id.isn-speed.com'
// const BASE_DASHBOARD = 'https://classos.isn-speed.com/api'
const BASE_DASHBOARD = import.meta.env.DEV
  ? '/api-dashboard'  // ← pakai proxy saat development
  : 'https://classos.isn-speed.com/api'
// : 'https://classos-beta.isn-speed.com/api'

// ─── token storage ───────────────────────────────────────────────────────────

let _accessToken: string | null = localStorage.getItem('sn_access_token')
let _refreshToken: string | null = localStorage.getItem('sn_refresh_token')
let _isRefreshing = false
let _refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function setTokens(accessToken: string, refreshToken: string) {
  _accessToken = accessToken
  _refreshToken = refreshToken
  localStorage.setItem('sn_access_token', accessToken)
  localStorage.setItem('sn_refresh_token', refreshToken)
}

function clearTokens() {
  _accessToken = null
  _refreshToken = null
  localStorage.removeItem('sn_access_token')
  localStorage.removeItem('sn_refresh_token')
}

// ─── refresh token logic ─────────────────────────────────────────────────────

async function doRefreshToken(): Promise<string> {
  if (!_refreshToken) throw new Error('No refresh token')

  const res = await fetch(`${BASE_DASHBOARD}/v1/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: _refreshToken }),
  })

  if (!res.ok) {
    clearTokens()
    throw new Error('Refresh token expired, please login again')
  }

  const data = await res.json()
  console.log(data);

  const newAccess = data?.data?.accessToken
  const newRefresh = data?.data?.refreshToken

  if (!newAccess) throw new Error('Invalid refresh token response')

  setTokens(newAccess, newRefresh ?? _refreshToken)
  return newAccess
}

// ✅ Single-flight refresh — SATU-SATUNYA tempat yang boleh memanggil doRefreshToken().
// Dipakai baik oleh getValidAccessToken() (saat belum ada access token) maupun oleh
// blok retry-401 di dashboardPost/dashboardGet. Sebelumnya blok retry-401 memanggil
// doRefreshToken() langsung, tidak lewat guard ini — kalau 2 request kena 401 bersamaan,
// keduanya refresh pakai refresh token yang sama, request kedua ditolak backend
// ("Login attempt with invalid token") lalu clearTokens() menghapus token baru yang
// baru saja berhasil di-set oleh request pertama. Menyatukan lewat sini mencegah itu.
async function ensureFreshToken(): Promise<string> {
  if (_isRefreshing) {
    return new Promise((resolve, reject) => {
      _refreshQueue.push({ resolve, reject })
    })
  }

  _isRefreshing = true
  try {
    const token = await doRefreshToken()
    _refreshQueue.forEach(({ resolve }) => resolve(token))
    _refreshQueue = []
    return token
  } catch (e) {
    // ✅ Reject semua yang antri juga — sebelumnya queue ini dibiarkan menggantung
    // selamanya (tidak resolve maupun reject) kalau refresh gagal.
    _refreshQueue.forEach(({ reject }) => reject(e))
    _refreshQueue = []
    throw e
  } finally {
    _isRefreshing = false
  }
}

async function getValidAccessToken(): Promise<string> {
  if (_accessToken) return _accessToken
  return ensureFreshToken()
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function postForm(baseUrl: string, path: string, params: Record<string, string | number>, accessToken?: string) {
  const body = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => body.append(k, String(v)))

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${baseUrl}/${path}`, {
    method: 'POST',
    headers,
    body,
  })

  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

async function getQuery(
  baseUrl: string,
  path: string,
  params: Record<string, string | number | null | undefined> = {}
) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') qs.append(k, String(v))
  })
  const sep = qs.toString() ? '?' : ''
  const res = await fetch(`${baseUrl}/${path}${sep}${qs}`, { method: 'GET' })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

// ─── Error Event System ───────────────────────────────────────────────────────

type ApiErrorHandler = (error: { status: number; message: string; path: string }) => void
let _errorHandler: ApiErrorHandler | null = null

export function setApiErrorHandler(handler: ApiErrorHandler) {
  _errorHandler = handler
}

function _emitError(status: number, message: string, path: string) {
  _errorHandler?.({ status, message, path })
}

// Dashboard API dengan Bearer token + auto refresh
async function dashboardPost(path: string, body: Record<string, unknown>, retry = true): Promise<any> {
  const token = await getValidAccessToken()
  const res = await fetch(`${BASE_DASHBOARD}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (res.status === 401 && retry) {
    _accessToken = null // ← invalidate dulu
    try {
      await ensureFreshToken() // ← single-flight, sudah panggil setTokens di dalamnya
      return dashboardPost(path, body, false)  // ← retry dengan token baru
    } catch {
      clearTokens()
      _emitError(401, 'Sesi habis, silakan login kembali.', path)
      throw new Error(`API 401: ${path}`)
    }
  }

  if (res.status === 429) {
    _emitError(429, 'Terlalu banyak permintaan. Mohon tunggu sebentar.', path)
    throw new Error(`API 429: ${path}`)
  }

  if (!res.ok) {
    _emitError(res.status, `Gagal mengambil data. (${res.status})`, path)
    throw new Error(`API ${res.status}: ${path}`)
  }

  return res.json()
}

// ─── Update dashboardGet ──────────────────────────────────────────────────────

async function dashboardGet(path: string, params: Record<string, string | number | null | undefined> = {}, retry = true): Promise<any> {
  const token = await getValidAccessToken()
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') qs.append(k, String(v))
  })
  const sep = qs.toString() ? '?' : ''
  const res = await fetch(`${BASE_DASHBOARD}/${path}${sep}${qs}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (res.status === 401 && retry) {
    _accessToken = null // ← invalidate dulu
    try {
      await ensureFreshToken() // ← single-flight, sudah panggil setTokens di dalamnya
      return dashboardGet(path, params, false) // ← retry
    } catch {
      clearTokens()
      _emitError(401, 'Sesi habis, silakan login kembali.', path)
      throw new Error(`API 401: ${path}`)
    }
  }

  if (res.status === 429) {
    _emitError(429, 'Terlalu banyak permintaan. Mohon tunggu sebentar.', path)
    throw new Error(`API 429: ${path}`)
  }

  if (!res.ok) {
    _emitError(res.status, `Gagal mengambil data. (${res.status})`, path)
    throw new Error(`API ${res.status}: ${path}`)
  }

  return res.json()
}



async function _streamRequest(
  url: string,
  body: unknown,
  onChunk: (delta: string, fullText: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const token = await getValidAccessToken()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`Request gagal (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    if (buffer.includes('data:')) {
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (!payload || payload === '[DONE]') continue

        let delta = payload
        try {
          const parsed = JSON.parse(payload)
          // ✅ Deteksi error JSON di tengah stream
          if (parsed.error) {
            throw new Error(typeof parsed.error === 'string' ? parsed.error : 'Terjadi kesalahan pada server')
          }
          delta = parsed.delta ?? parsed.text ?? parsed.content ?? JSON.stringify(parsed)
        } catch (err) {
          if (err instanceof Error && err.message !== payload) {
            throw err // rethrow kalau memang error dari parsed.error di atas
          }
          // bukan JSON valid, anggap plain text chunk apa adanya
        }

        fullText += delta
        onChunk(delta, fullText)
      }
    } else {
      // ✅ Cek juga kalau seluruh buffer ternyata JSON error (bukan SSE)
      const trimmedBuf = buffer.trim()
      if (trimmedBuf.startsWith('{') && trimmedBuf.includes('"error"')) {
        try {
          const parsed = JSON.parse(trimmedBuf)
          if (parsed.error) {
            throw new Error(typeof parsed.error === 'string' ? parsed.error : 'Terjadi kesalahan pada server')
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes('error')) throw err
        }
      }

      fullText += buffer
      onChunk(buffer, fullText)
      buffer = ''
    }
  }

  return fullText
}


// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /v1/login
 * Login dengan token site, mendapatkan accessToken & refreshToken
 */
export async function login(token: string) {
  const res = await fetch(`${BASE_DASHBOARD}/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const data = await res.json()

  if (data?.success && data?.data?.tokens) {
    setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken)
  }

  return data
}

/**
 * Logout - hapus semua token
 */
export function logout() {
  clearTokens()
}

// ─── API endpoints ────────────────────────────────────────────────────────────

export async function fetchLoncengWithLink(params: {
  id_user: number
  jenis?: number
  lastid?: number
  news?: number
  newsChannel?: number
}) {
  return dashboardPost('v1/getStikernews', {
    id_user: params.id_user,
    jenis: params.jenis ?? 2,
    lastid: params.lastid ?? 0,
    news: params.news ?? 1,
    newsChannel: params.newsChannel ?? 7,
  })
}

// export async function fetchLoncengWithLink(params: {
//   id_user: number
//   jenis?: number
//   lastid?: number
//   news?: number
//   newsChannel?: number
// }) {
//   return postForm(BASE_BETA, 'data_lonceng_with_link', {
//     id_user: params.id_user,
//     jenis: params.jenis ?? 2,
//     lastid: params.lastid ?? 0,
//     news: params.news ?? 1,
//     newsChannel: params.newsChannel ?? 7,
//   },)
// }

export async function logMasuk(id_user: number): Promise<void> {
  try {
    await postForm(BASE_BETA, 'Log_Masuk_Stikernews', { id_user })
  } catch (e) {
    console.warn('[logMasuk] failed (non-critical):', e)
  }
}

export async function logPlay(params: {
  id_user: number
  id_channel: number
  id_stikernews: number
  actiontype: 'start' | 'stop'
}): Promise<void> {
  try {
    await postForm(BASE_BETA, 'Log_Play_Stikernews', {
      id_user: params.id_user,
      id_channel: params.id_channel,
      id_stikernews: params.id_stikernews,
      actiontype: params.actiontype,
    })
  } catch (e) {
    console.warn('[logPlay] failed (non-critical):', e)
  }
}

export async function fetchAnalytics(params: {
  id_user?: number
  id_stikernews?: number
  id_channel?: number
  sort_by?: 'duration' | 'total_play'
  sort_dir?: 'asc' | 'desc'
  limit?: number
  start_date?: string
  end_date?: string
}) {
  return getQuery(BASE_PROD, 'Get_Stikernews_Analytics', {
    id_user: params.id_user,
    id_stikernews: params.id_stikernews,
    id_channel: params.id_channel ?? 7,
    sort_by: params.sort_by ?? 'duration',
    sort_dir: params.sort_dir ?? 'desc',
    limit: params.limit ?? 10,
    start_date: params.start_date,
    end_date: params.end_date,
  })
}

export async function fetchChannels(id_user?: number) {
  return getQuery(BASE_BETA, 'getChannelStikerNews', id_user ? { id_user } : {})
}

export async function fetchSetting(userid: number) {
  return getQuery(BASE_BETA, 'Get_Setting_Stikernews', { userid })
}

export async function saveSetting(params: {
  userid: number
  auto_play: 0 | 1
  play_mode: 0 | 1
}) {
  return postForm(BASE_BETA, 'Save_Setting_Stikernews', {
    userid: params.userid,
    auto_play: params.auto_play,
    play_mode: params.play_mode,
  })
}

export async function scanUniqId(uniqId: string, accessToken?: string) {
  return dashboardPost('v1/scan-uniq-id', {
    uniq_id: uniqId,
  })
}

export async function apiFavoriteItems(userId: string, accessToken?: string) {
  return dashboardPost('v1/Show_Favorite_List', {
    user_id: userId,
  })
}

export async function apiPlaylistItems(userId: string, accessToken?: string) {
  return dashboardPost('v1/Show_Playlists', {
    user_id: userId,
  })
}

export async function apiDetailPlaylistItems(playlistId: string, accessToken?: string) {
  return dashboardPost('v1/Show_Playlist', {
    playlist_id: playlistId,
  })
}

export async function apiProv() {
  return dashboardGet('trial/prov')
}

export async function apiKab(idProv: string | number) {
  return dashboardGet(`trial/kab?id_prov=${idProv}`)
}

export async function apiFormTrial(data: {
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
}) {
  return dashboardPost(`trial/submit`, {
    nama_sekolah: data.nama_sekolah,
    nama_pengisi: data.nama_pengisi,
    nomor_wa: data.nomor_wa,
    id_provinsi: data.id_provinsi,
    provinsi: data.provinsi,
    id_kabupaten_kota: data.id_kabupaten_kota,
    kabupaten_kota: data.kabupaten_kota,
    jumlah_kelas: data.jumlah_kelas,
    jumlah_smartboard: data.jumlah_smartboard,
    pakai_smart_tv: data.pakai_smart_tv,
    pakai_ac: data.pakai_ac,
  })
}

export async function apiVersion() {
  return dashboardGet(`version`)
}

export async function apiSummerizeStream(
  data: { session_id: string; transcript: string },
  onChunk: (delta: string, fullText: string) => void,
  signal?: AbortSignal
) {
  return _streamRequest(`${BASE_DASHBOARD}/v1/summarize-class`, data, onChunk, signal)
}

export async function apiBriefStream(
  data: { session_id: string; playlist_id: string; teacher_id: string },
  onChunk: (delta: string, fullText: string) => void,
  signal?: AbortSignal
) {
  return _streamRequest(`${BASE_DASHBOARD}/v1/briefing`, data, onChunk, signal)
}


export async function apiListening(data: {
  session_id: string
  listening_start_time: string
  listening_stop_time: string
  listening_text: string
}) {
  return dashboardPost(`v1/save-listening`, {
    session_id: data.session_id,
    listening_start_time: data.listening_start_time,
    listening_stop_time: data.listening_stop_time,
    listening_text: data.listening_text,
  })
}

export async function apiEvaluate(data: {
  session_id: string
  teacher_note: string
}) {
  return dashboardPost(`v1/evaluate-class`, {
    session_id: data.session_id,
    teacher_note: data.teacher_note,
  })
}

export async function apiReqUrlUploadImg(data: {
  session_id: string
  file_type: string
  file_name: string
}) {
  return dashboardPost(`v1/generate-upload-url`, {
    session_id: data.session_id,
    file_type: data.file_type,
    file_name: data.file_name,
  })
}

export async function apiStopClass(data: {
  session_id: string
  student_counting: number
  stop_class_image: string
}) {
  return dashboardPost(`v1/stop-class`, {
    session_id: data.session_id,
    student_counting: data.student_counting,
    stop_class_image: data.stop_class_image,
  })
}

export async function apiUploadImage(data: {
  url_upload: string
  file: File
}): Promise<boolean> {
  const response = await fetch(data.url_upload, {
    method: 'PUT',
    headers: {
      'Content-Type': data.file.type,
    },
    body: data.file,
  })

  if (!response.ok) {
    throw new Error(`Gagal upload gambar ke S3. Status: ${response.status}`)
  }

  return true
}

// ─── Report & Request Konten ──────────────────────────────────────────────────
// ⚠️ Placeholder endpoint — path belum dikonfirmasi backend, sesuaikan saat sudah tersedia

export async function apiReportKonten(data: {
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
}) {
  return dashboardPost('v1/report-content', { ...data })
}

export async function apiRequestKonten(data: {
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
}) {
  return dashboardPost('v1/request-content', { ...data })
}

export function clearTokenCache() {
  _accessToken = null
}

// ⚠️ DINONAKTIFKAN SEMENTARA — Google Vision API di-pause, rencananya dipindah ke backend
// (proxy lewat dashboard API) supaya API key tidak ikut ke-bundle di client. Lihat diskusi
// terkait: key VITE_* di Vite ter-expose plaintext ke client-side bundle.
// const VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY
//
// export async function countPeopleFromPhoto(base64Image: string): Promise<number> {
//   const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '')
//
//   const res = await fetch(
//     `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
//     {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         requests: [{
//           image: { content: imageData },
//           features: [
//             { type: 'FACE_DETECTION', maxResults: 100 },
//             { type: 'OBJECT_LOCALIZATION', maxResults: 100 }
//           ]
//         }]
//       })
//     }
//   )
//
//   if (!res.ok) throw new Error(`Vision API error: ${res.status}`)
//
//   const data = await res.json()
//   const response = data.responses?.[0]
//
//   const faceCount = response?.faceAnnotations?.length ?? 0
//   const personCount = response?.localizedObjectAnnotations
//     ?.filter((obj: any) => obj.name.toLowerCase() === 'person').length ?? 0
//
//   return Math.max(faceCount, personCount)
// }

// ─── Dashboard endpoints (dengan auth) ───────────────────────────────────────
// Siap dipakai untuk endpoint dashboard yang memerlukan Bearer token
// Contoh penggunaan:
// export async function fetchDashboardData() {
//   return dashboardGet('v1/some-endpoint')
// }