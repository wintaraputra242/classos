// Pencatatan log kunjungan/klik landing page ke backend PHP terpisah (server prod).
// Fire-and-forget: tidak boleh blocking UI atau menampilkan error ke user kalau gagal.
// ⚠️ Sesuaikan LOG_API_URL kalau domain/path deploy log-kunjungan.php berbeda.
const LOG_API_URL = 'https://isn-speed.com/log-kunjungan.php'

export type LogKunjunganType = 'web' | 'trial' | 'premium' | 'skp'

export function logKunjungan(type: LogKunjunganType): void {
  fetch(LOG_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  }).catch((err) => console.error('[logKunjungan] gagal mencatat kunjungan:', err))
}
