importScripts('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js')

self.onmessage = function(e) {
  const { data, width, height } = e.data
  try {
    const code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' })
    self.postMessage({ result: code?.data ?? null })
  } catch {
    self.postMessage({ result: null })
  }
}