import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'

// Buat icon hijau sederhana sementara sebelum logo asli tersedia
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1DB954"/>
  <text x="256" y="320" font-size="280" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold">S</text>
</svg>
`

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png()
    .toFile(`public/pwa-${size}x${size}.png`)

  console.log(`✅ Generated pwa-${size}x${size}.png`)
}

// Apple touch icon
await sharp(Buffer.from(svgIcon))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png')

console.log('✅ Generated apple-touch-icon.png')