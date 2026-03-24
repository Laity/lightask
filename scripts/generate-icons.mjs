import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dirname, '../public/icons/icon.svg')
const outDir = resolve(__dirname, '../public/icons')

const svg = readFileSync(svgPath)
const sizes = [16, 32, 48, 128]

for (const size of sizes) {
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, `icon-${size}.png`))
}

console.log(`Generated PNG icons: ${sizes.map(s => `${s}x${s}`).join(', ')}`)
