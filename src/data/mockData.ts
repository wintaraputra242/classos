import type { Content, LaguEdukasi, KarakterItem } from '@/types'

export const stikerNewsData: Content[] = [
  { id: 'sn1', type: 'stikernews', title: 'Bijak di Dunia Digital', description: 'Teknologi membuat hidup lebih mudah, tapi kita harus bijak menggunakannya. Yuk, jadi pelajar cerdas digital!', emoji: '���', jenjang: ['SMP', 'SMA', 'SMK'], duration: '5 min', views: 1200, publishedAt: '2026-05-28', category: 'Literasi Digital' },
  { id: 'sn2', type: 'stikernews', title: 'Sampah Plastik dan Bumi Kita', description: 'Setiap tahun jutaan ton sampah plastik mencemari lautan. Apa yang bisa pelajar lakukan untuk mengatasinya?', emoji: '���', jenjang: ['SD', 'SMP'], duration: '4 min', views: 2500, publishedAt: '2026-05-28', category: 'Lingkungan' },
  { id: 'sn3', type: 'stikernews', title: 'Mengelola Emosi Dengan Baik', description: 'Emosi adalah bagian dari diri kita. Belajar mengelolanya adalah kunci menjadi pribadi yang sehat dan bahagia.', emoji: '���', jenjang: ['SMP', 'SMA'], duration: '6 min', views: 1800, publishedAt: '2026-05-28', category: 'Karakter' },
  { id: 'sn4', type: 'stikernews', title: 'Kenali Bahaya Cyberbullying', description: 'Bullying di dunia maya sama bahayanya dengan di dunia nyata. Pelajari cara melindungi dirimu dan temanmu.', emoji: '���️', jenjang: ['SMP', 'SMA', 'SMK'], duration: '5 min', views: 1200, publishedAt: '2026-05-27', category: 'Literasi Digital' },
  { id: 'sn5', type: 'stikernews', title: 'Semangat Belajar, Bangga Negeri', description: 'Indonesia punya ribuan potensi. Kamu adalah salah satunya. Terus belajar, terus berkarya!', emoji: '�����', jenjang: ['SMA', 'SMK'], duration: '4 min', views: 0, publishedAt: '2026-05-27', category: 'Kebangsaan' },
  { id: 'sn6', type: 'stikernews', title: 'Percaya Diri, Berani Mencoba', description: 'Kegagalan bukan akhir dari segalanya. Berani mencoba adalah langkah pertama menuju keberhasilan.', emoji: '���', jenjang: ['SD', 'SMP', 'SMA', 'SMK'], duration: '5 min', views: 2200, publishedAt: '2026-05-26', category: 'Karakter' },
  { id: 'sn7', type: 'stikernews', title: 'Membaca: Jendela Dunia', description: 'Satu buku bisa membawamu ke ribuan tempat yang belum pernah kamu kunjungi.', emoji: '���', jenjang: ['SD', 'SMP'], duration: '3 min', views: 980, publishedAt: '2026-05-26', category: 'Literasi' },
  { id: 'sn8', type: 'stikernews', title: 'Hidup Bersih, Hidup Sehat', description: 'Kebiasaan menjaga kebersihan dimulai dari hal kecil yang kamu lakukan setiap hari.', emoji: '���', jenjang: ['SD'], duration: '3 min', views: 750, publishedAt: '2026-05-25', category: 'Kesehatan' },
]

export const laguEdukasiData: LaguEdukasi[] = [
  { id: 'lg1', type: 'lagu', title: 'Langkah Kecil Hari Ini', description: 'Lagu tentang memulai dari langkah terkecil untuk meraih mimpi besar.', emoji: '👣', jenjang: ['SD'], duration: '1:02', isFavorite: false, publishedAt: '2026-05-01', artist: 'StikerNews' },
  { id: 'lg2', type: 'lagu', title: 'Jangan Menunda', description: 'Lagu motivasi untuk tidak menunda pekerjaan dan belajar.', emoji: '⏱️', jenjang: ['SMP'], duration: '1:08', isFavorite: false, publishedAt: '2026-05-05', artist: 'StikerNews' },
  { id: 'lg3', type: 'lagu', title: 'Disiplin Itu Kebebasan', description: 'Lagu tentang pentingnya mengatur waktu dan menjadi pribadi yang konsisten.', emoji: '🎯', jenjang: ['SMP'], duration: '1:05', isFavorite: true, publishedAt: '2026-05-10', artist: 'StikerNews' },
  { id: 'lg4', type: 'lagu', title: 'Berani Jadi Diri Sendiri', description: 'Lagu tentang kepercayaan diri dan keberanian untuk tampil apa adanya.', emoji: '🦋', jenjang: ['SMA', 'SMK'], duration: '1:12', isFavorite: false, publishedAt: '2026-05-12', artist: 'StikerNews' },
  { id: 'lg5', type: 'lagu', title: 'Bersyukur Setiap Hari', description: 'Lagu yang mengajarkan rasa syukur dan melihat hal positif dalam setiap situasi.', emoji: '🌻', jenjang: ['SD', 'SMP'], duration: '1:00', isFavorite: false, publishedAt: '2026-05-15', artist: 'StikerNews' },
  { id: 'lg6', type: 'lagu', title: 'Indonesia Tanah Airku', description: 'Lagu kebangsaan edukasi tentang cinta tanah air untuk generasi muda.', emoji: '🇮🇩', jenjang: ['SD', 'SMP', 'SMA', 'SMK'], duration: '1:15', isFavorite: false, publishedAt: '2026-05-17', artist: 'StikerNews' },
]

export const karakterData: KarakterItem[] = [
  // KARAKTER
  { id: "1", title: 'Jujur', description: 'Selalu berkata dan berbuat sesuai kebenaran', emoji: '🤝', bgClass: 'bg-blue-100 dark:bg-blue-900/40', category: 'karakter' },
  { id: "2", title: 'Disiplin', description: 'Taat aturan dan tepat waktu setiap hari', emoji: '⏰', bgClass: 'bg-orange-100 dark:bg-orange-900/40', category: 'karakter' },
  { id: "3", title: 'Tanggung Jawab', description: 'Berani menanggung akibat dari setiap pilihan', emoji: '💪', bgClass: 'bg-red-100 dark:bg-red-900/40', category: 'karakter' },
  { id: "4", title: 'Empati', description: 'Merasakan dan memahami perasaan orang lain', emoji: '❤️', bgClass: 'bg-pink-100 dark:bg-pink-900/40', category: 'karakter' },
  { id: "5", title: 'Kreatif', description: 'Berani berpikir beda dan menciptakan hal baru', emoji: '🎨', bgClass: 'bg-purple-100 dark:bg-purple-900/40', category: 'karakter' },
  { id: "6", title: 'Gotong Royong', description: 'Bekerja bersama demi tujuan yang lebih besar', emoji: '🤲', bgClass: 'bg-teal-100 dark:bg-teal-900/40', category: 'karakter' },
  { id: "7", title: 'Berani', description: 'Menghadapi tantangan tanpa rasa takut berlebih', emoji: '🦁', bgClass: 'bg-yellow-100 dark:bg-yellow-900/40', category: 'karakter' },
  { id: "8", title: 'Rendah Hati', description: 'Tidak sombong meski memiliki banyak kelebihan', emoji: '🌾', bgClass: 'bg-green-100 dark:bg-green-900/40', category: 'karakter' },
  { id: "9", title: 'Religius', description: 'Menjalankan ajaran agama dalam kehidupan sehari', emoji: '🕌', bgClass: 'bg-emerald-100 dark:bg-emerald-900/40', category: 'karakter' },
  { id: "10", title: 'Nasionalis', description: 'Mencintai bangsa dan tanah air Indonesia', emoji: '🇮🇩', bgClass: 'bg-red-100 dark:bg-red-900/40', category: 'karakter' },

  // HABIT
  { id: "11", title: 'Baca 10 Menit', description: 'Membaca buku setiap hari meski sebentar', emoji: '📖', bgClass: 'bg-blue-100 dark:bg-blue-900/40', category: 'habit' },
  { id: "12", title: 'Sholat Tepat Waktu', description: 'Tidak menunda ibadah wajib setiap waktu', emoji: '🙏', bgClass: 'bg-emerald-100 dark:bg-emerald-900/40', category: 'habit' },
  { id: "13", title: 'Olahraga Pagi', description: 'Gerak minimal 15 menit setiap pagi hari', emoji: '🏃', bgClass: 'bg-orange-100 dark:bg-orange-900/40', category: 'habit' },
  { id: "14", title: 'Ucap Terima Kasih', description: 'Biasakan bersyukur kepada siapa saja', emoji: '🙌', bgClass: 'bg-yellow-100 dark:bg-yellow-900/40', category: 'habit' },
  { id: "15", title: 'Rapikan Kamar', description: 'Mulai hari dengan tempat tidur yang rapi', emoji: '🛏️', bgClass: 'bg-indigo-100 dark:bg-indigo-900/40', category: 'habit' },
  { id: "16", title: 'Minum Air Putih', description: 'Cukupi 8 gelas air putih setiap hari', emoji: '💧', bgClass: 'bg-cyan-100 dark:bg-cyan-900/40', category: 'habit' },
  { id: "17", title: 'Tidur Cukup', description: 'Istirahat 7–8 jam untuk tubuh yang segar', emoji: '😴', bgClass: 'bg-violet-100 dark:bg-violet-900/40', category: 'habit' },
  { id: "18", title: 'Kurangi Gadget', description: 'Batasi layar maksimal 2 jam di luar belajar', emoji: '📵', bgClass: 'bg-slate-100 dark:bg-slate-900/40', category: 'habit' },
  { id: "19", title: 'Catat Ilmu', description: 'Tulis poin penting dari pelajaran hari ini', emoji: '✏️', bgClass: 'bg-lime-100 dark:bg-lime-900/40', category: 'habit' },
  { id: "20", title: 'Bantu Orang Tua', description: 'Lakukan satu pekerjaan rumah setiap hari', emoji: '🏡', bgClass: 'bg-amber-100 dark:bg-amber-900/40', category: 'habit' },
]


export function getRandomItems<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count)
}

export function getTodayItems<T>(arr: T[], count: number): T[] {
  if (!arr.length) return []
  const dayIndex = new Date().getDay()
  const start = (dayIndex * count) % arr.length
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    result.push(arr[(start + i) % arr.length] as T)
  }
  return result
}
