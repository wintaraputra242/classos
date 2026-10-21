<?php
// detect-head-count.php
//
// Endpoint standalone untuk hitung jumlah kepala lewat Roboflow Hosted
// Inference API.
//
// ⚠️ RIWAYAT PENEMPATAN (penting kalau mau dipindah lagi nanti):
// 1. public/api/detect-head-count.php di classos-beta.isn-speed.com → gagal,
//    prefix /api/ sudah direservasi & di-reverse-proxy ke backend Node/Express,
//    request kecegat duluan sebelum sampai ke file ini (dapat 500 generik
//    Express "Internal server error").
// 2. public/detect/detect-head-count.php di classos-beta.isn-speed.com → tetap
//    gagal, ternyata server classos-beta itu PURE Node/Express untuk tampilan
//    saja, TIDAK ada PHP-FPM dikonfigurasi sama sekali di nginx-nya (dapat 405
//    Not Allowed dari nginx sendiri, bukan dari PHP — nginx nolak method POST
//    untuk file statis karena tidak ada handler PHP untuk itu).
// 3. SEKARANG: dipindah ke server TERPISAH yang memang menjalankan PHP, yaitu
//    isn-speed.com, di folder /api-detect-head/. Karena ini domain BEDA dari
//    tempat SPA-nya di-serve (classos-beta.isn-speed.com), request dari
//    browser ke sini jadi CROSS-ORIGIN — makanya perlu header CORS di bawah.
//    Kalau nanti classos-beta ternyata dipasangi PHP-FPM, bisa dipertimbangkan
//    pindah balik supaya jadi same-origin lagi (header CORS jadi tidak perlu).
//
// File ini juga disimpan di repo frontend (public/detect/) untuk keperluan
// testing lokal lewat `php -S localhost:8000 -t public` + proxy dev di
// vite.config.ts — tapi yang BENERAN dipakai production/beta adalah salinan
// manual di server isn-speed.com ini (bukan ikut ter-deploy dari dist/ SPA).

header('Content-Type: application/json');

// ⚠️ CORS — wajib karena endpoint ini di domain BEDA dari SPA-nya (lihat
// riwayat penempatan di atas, poin 3). "*" dipakai karena endpoint ini tidak
// pakai cookie/kredensial apa pun, cuma terima foto + balikin jumlah deteksi.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Browser kirim preflight OPTIONS dulu sebelum POST ber-body JSON — jawab
// langsung tanpa proses apa-apa.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method tidak diizinkan']);
    exit;
}

// API key disimpan terpisah di roboflow-config.php (di-gitignore, isinya cuma
// ada di server — sama seperti .env untuk frontend). Lihat
// roboflow-config.example.php untuk contoh isinya.
$configPath = __DIR__ . '/roboflow-config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['message' => 'roboflow-config.php belum dibuat di server ini. Lihat roboflow-config.example.php']);
    exit;
}
$config = include $configPath;
$ROBOFLOW_API_KEY = $config['api_key'] ?? '';

if (!$ROBOFLOW_API_KEY) {
    http_response_code(500);
    echo json_encode(['message' => 'api_key kosong di roboflow-config.php']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$imageBase64 = $input['image_base64'] ?? null;
if (!$imageBase64) {
    http_response_code(400);
    echo json_encode(['message' => 'image_base64 wajib diisi']);
    exit;
}

// Buang prefix "data:image/jpeg;base64,"
$base64 = preg_replace('#^data:image/\w+;base64,#', '', $imageBase64);

// ⚠️ Endpoint & cara auth ini HARUS persis sama dengan contoh di modal
// "Deploy Model" > tab JavaScript di halaman model Roboflow-nya. Kalau
// model/versinya diganti lagi nanti, cek ulang contoh kode di modal itu —
// jangan asumsikan formatnya sama kayak sekarang.
$MODEL = 'head-detection-vornn/2';

$ch = curl_init("https://serverless.roboflow.com/$MODEL");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $base64);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $ROBOFLOW_API_KEY",
    'Content-Type: application/x-www-form-urlencoded',
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['message' => 'Gagal menghubungi Roboflow', 'detail' => $curlError ?: $response]);
    exit;
}

$result = json_decode($response, true);
$count = isset($result['predictions']) && is_array($result['predictions']) ? count($result['predictions']) : 0;

echo json_encode(['count' => $count]);
