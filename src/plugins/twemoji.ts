/**
 * Render emoji konsisten di semua browser/OS lewat Twemoji (gaya flat
 * berwarna, mirip emoji Chrome/Android modern) — dipakai supaya emoji yang
 * tersebar di banyak konten ClassOS (quote, sapaan, badge channel, dll)
 * tidak bergantung ke font emoji sistem (yang beda-beda tampilannya di
 * Windows/Mac/Linux/browser lama).
 *
 * Caranya: observe seluruh DOM, dan setiap kali ada teks baru masuk (hasil
 * render Vue), otomatis di-scan + emoji di dalamnya diganti jadi <img> SVG
 * dari CDN Twemoji. Dipasang sekali di main.ts, tidak perlu disentuh lagi di
 * tiap komponen yang pakai emoji.
 */
import twemoji from 'twemoji'

function parseEmoji(root: Node) {
  // ⚠️ root bisa berupa Text node polos (lihat alasannya di komentar
  // scheduleParse di bawah) — twemoji.parse() paling aman dipanggil di atas
  // Element, jadi selalu dinormalisasi ke parentElement-nya dulu.
  const target = root instanceof HTMLElement || root instanceof Document
    ? root
    : root.parentElement
  if (!target) return

  twemoji.parse(target, {
    folder: 'svg',
    ext: '.svg',
    className: 'twemoji-icon',
  })
}

let _rafId: number | null = null
const _pendingRoots = new Set<Node>()

function scheduleParse(root: Node) {
  _pendingRoots.add(root)
  if (_rafId !== null) return

  _rafId = requestAnimationFrame(() => {
    _rafId = null
    const roots = Array.from(_pendingRoots)
    _pendingRoots.clear()
    roots.forEach(parseEmoji)
  })
}

export function setupTwemoji() {
  // Parse apa yang sudah ada di halaman saat pertama kali dipasang
  scheduleParse(document.body)

  // ✅ MutationObserver — tangkap render/update Vue berikutnya (channel
  // switch, konten baru dari API, dll) tanpa perlu panggil manual di tiap
  // komponen. twemoji.parse() sendiri idempotent (skip teks yang sudah
  // ke-convert jadi <img>), jadi aman di-re-run berulang kali.
  //
  // ⚠️ BUG YANG SUDAH DIPERBAIKI: sebelumnya di sini kita schedule-parse tiap
  // node di `mutation.addedNodes` satu-satu. Masalahnya, saat Vue nge-patch
  // teks sebuah elemen (mis. pas pindah filter Karakter/Habit), Vue sering
  // mengganti SELURUH anak elemen itu via textContent — yang bikin addedNodes
  // isinya cuma SATU TEXT NODE MENTAH (bukan Element). Fungsi lama langsung
  // skip Text node itu (gagal `instanceof HTMLElement`), jadi emoji mentah
  // yang baru di-set Vue tidak pernah sempat di-convert ulang ke Twemoji.
  // Sekarang pakai `mutation.target` — untuk childList itu SELALU elemen
  // induk yang anaknya berubah (bukan node yang berubah itu sendiri), jadi
  // tidak pernah salah tipe lagi.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        scheduleParse(mutation.target)
      } else if (mutation.type === 'characterData') {
        scheduleParse(mutation.target)
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  return observer
}
