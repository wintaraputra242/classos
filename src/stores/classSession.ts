import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiSummerizeStream,
  apiBriefStream,
  apiListening,
  apiEvaluate,
  apiReqUrlUploadImg,
  apiUploadImage,
  apiStopClass,
} from '@/services/api'

const SESSION_STATE_KEY = 'classos_session_state'

interface StreamState {
  loading: boolean
  error: string | null
  text: string
  done: boolean
}

function _initStreamState(): StreamState {
  return { loading: false, error: null, text: '', done: false }
}

// ✅ Helper: selalu baca ulang localStorage TERBARU, jangan simpan ke variable/const
function _patchSessionState(patch: Record<string, any>) {
  try {
    const current = localStorage.getItem(SESSION_STATE_KEY)
    const parsed = current ? JSON.parse(current) : {}
    const merged = { ...parsed, ...patch }
    localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(merged))
  } catch {
    // kalau localStorage rusak/tidak bisa diparse, timpa langsung dengan patch-nya saja
    localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(patch))
  }
}

export const useClassSessionStore = defineStore('classSession', () => {
  const sessionId = ref<string | null>(null)

  function setSessionId(id: string) {
    sessionId.value = id
  }

  // ── Summarize (streaming) ────────────────────────────────
  const summarize = ref<StreamState>(_initStreamState())
  let _summarizeController: AbortController | null = null

  async function runSummarize(transcript: string) {
    if (!sessionId.value) {
      summarize.value.error = 'session_id belum diset'
      return
    }

    _summarizeController?.abort()
    _summarizeController = new AbortController()

    summarize.value = _initStreamState()
    summarize.value.loading = true

    try {
      await apiSummerizeStream(
        { session_id: sessionId.value, transcript },
        (_delta, fullText) => {
          summarize.value.text = fullText
          _patchSessionState({ summarize: { text: fullText, done: false } }) // ✅ selalu baca localStorage terbaru
        },
        _summarizeController.signal
      )
      summarize.value.done = true
      _patchSessionState({ summarize: { text: summarize.value.text, done: true } })
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        summarize.value.error = e instanceof Error ? e.message : String(e)
      }
    } finally {
      summarize.value.loading = false
    }
  }

  function stopSummarize() {
    _summarizeController?.abort()
  }

  // ── Brief (streaming) ─────────────────────────────────────
  const brief = ref<StreamState>(_initStreamState())
  let _briefController: AbortController | null = null

  async function runBrief(playlistId: string, teacherId: string) {
    if (!sessionId.value) {
      brief.value.error = 'session_id belum diset'
      return
    }

    _briefController?.abort()
    _briefController = new AbortController()

    brief.value = _initStreamState()
    brief.value.loading = true

    try {
      await apiBriefStream(
        { session_id: sessionId.value, playlist_id: playlistId, teacher_id: teacherId },
        (_delta, fullText) => {
          brief.value.text = fullText
          _patchSessionState({ brief: { text: fullText, done: false } }) // ✅ selalu baca localStorage terbaru
        },
        _briefController.signal
      )
      brief.value.done = true
      _patchSessionState({ brief: { text: brief.value.text, done: true } })
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        brief.value.error = e instanceof Error ? e.message : String(e)
      }
    } finally {
      brief.value.loading = false
    }
  }

  function stopBrief() {
    _briefController?.abort()
  }

  // ── Listening (non-streaming) ─────────────────────────────
  const listening = ref({ loading: false, error: null as string | null, result: null as any })

  async function saveListening(payload: {
    listening_start_time: string
    listening_stop_time: string
    listening_text: string
  }) {
    if (!sessionId.value) {
      listening.value.error = 'session_id belum diset'
      return
    }
    listening.value.loading = true
    listening.value.error = null
    try {
      listening.value.result = await apiListening({ session_id: sessionId.value, ...payload })
    } catch (e: unknown) {
      listening.value.error = e instanceof Error ? e.message : String(e)
    } finally {
      listening.value.loading = false
    }
  }

  // ── Evaluate (non-streaming) ──────────────────────────────
  const evaluate = ref({ loading: false, error: null as string | null, result: null as any })

  async function evaluateClass(teacherNote: string) {
    if (!sessionId.value) {
      evaluate.value.error = 'session_id belum diset'
      return
    }
    evaluate.value.loading = true
    evaluate.value.error = null
    try {
      evaluate.value.result = await apiEvaluate({ session_id: sessionId.value, teacher_note: 'test' })
    } catch (e: unknown) {
      evaluate.value.error = e instanceof Error ? e.message : String(e)
    } finally {
      evaluate.value.loading = false
    }
  }


  // ── Restore saat store dibuat ──────────────────────────────
  // ✅ Baca localStorage di sini juga fine karena cuma dipakai sekali untuk restore awal,
  //    BUKAN dipakai lagi setelahnya untuk keputusan nulis (itu yang jadi bug sebelumnya)
  const initialSaved = localStorage.getItem(SESSION_STATE_KEY)
  if (initialSaved) {
    try {
      const parsed = JSON.parse(initialSaved)
      summarize.value.text = parsed.summarize?.text ?? ''
      summarize.value.done = parsed.summarize?.done ?? false
      brief.value.text = parsed.brief?.text ?? ''
      brief.value.done = parsed.brief?.done ?? false
    } catch {
      localStorage.removeItem(SESSION_STATE_KEY)
    }
  }

  const stopClassState = ref({
    loading: false,
    error: null as string | null,
    result: null as any,
    finalImageUrl: null as string | null,
  })

  async function uploadEndClassPhoto(payload: {
    file: File
    studentCounting: number
  }) {
    if (!sessionId.value) {
      stopClassState.value.error = 'session_id belum diset'
      return
    }

    stopClassState.value.loading = true
    stopClassState.value.error = null
    stopClassState.value.result = null
    stopClassState.value.finalImageUrl = null

    try {
      // Tahap 1: Request pre-signed URL
      const urlRes = await apiReqUrlUploadImg({
        session_id: sessionId.value,
        file_name: payload.file.name,
        file_type: payload.file.type,
      })

      if (!urlRes?.data?.upload_url) {
        throw new Error(urlRes?.message ?? 'Gagal mendapatkan URL upload')
      }

      const uploadUrl: string = urlRes.data.upload_url
      const finalImageUrl: string = urlRes.data.final_image_url

      // Tahap 2: Upload file langsung ke S3
      await apiUploadImage({
        url_upload: uploadUrl,
        file: payload.file,
      })

      // Tahap 3: Kirim data ke backend
      const stopRes = await apiStopClass({
        session_id: sessionId.value,
        student_counting: payload.studentCounting,
        stop_class_image: finalImageUrl,
      })

      stopClassState.value.result = stopRes
      stopClassState.value.finalImageUrl = finalImageUrl

    } catch (e: unknown) {
      stopClassState.value.error = e instanceof Error ? e.message : String(e)
    } finally {
      stopClassState.value.loading = false
    }
  }

  function resetSession() {
    sessionId.value = null
    summarize.value = _initStreamState()
    brief.value = _initStreamState()
    listening.value = { loading: false, error: null, result: null }
    evaluate.value = { loading: false, error: null, result: null }
    stopClassState.value = { loading: false, error: null, result: null, finalImageUrl: null } // ← tambahkan
  }

  return {
    sessionId, setSessionId,
    summarize, runSummarize, stopSummarize,
    brief, runBrief, stopBrief,
    listening, saveListening,
    evaluate, evaluateClass,
    stopClassState, uploadEndClassPhoto,
    resetSession,
  }
})