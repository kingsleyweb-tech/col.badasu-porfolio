// This script manually processes only the 4 new hero images and patches manifest.json
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const sourceRoot = path.join(root, 'src', 'assets', 'images')
const outputRoot = path.join(sourceRoot, '__optimized__')
const manifestPath = path.join(outputRoot, 'manifest.json')

const quality = 82
const heroProfile = { widths: [480, 768, 1200, 1600, 2000], fullWidth: 2000, thumbWidth: 768 }

const newImages = ['hero/graduation.jpeg', 'hero/tv3.jpeg', 'hero/ecowas.jpeg', 'hero/boundary.jpeg']

function slash(str) { return str.replace(/\\/g, '/') }
function usefulWidths(widths, sourceWidth) { return widths.filter(w => w < sourceWidth) }

async function writeWebp(buf, dest, width, lossless) {
  const img = sharp(buf).resize({ width, withoutEnlargement: true })
  const out = lossless ? await img.webp({ lossless: true }).toBuffer() : await img.webp({ quality }).toBuffer()
  await writeFile(dest, out)
  console.log(`  wrote ${path.basename(dest)} (${out.length} bytes)`)
}

async function main() {
  const manifestText = await readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(manifestText)

  for (const relativePath of newImages) {
    const file = path.join(sourceRoot, relativePath.replace(/\//g, path.sep))
    const sourceBuffer = await readFile(file)
    const sourceHash = createHash('sha256').update(sourceBuffer).digest('hex')
    const sourceStat = await stat(file)
    const metadata = await sharp(sourceBuffer).metadata()
    const sourceWidth = metadata.width ?? heroProfile.fullWidth
    const sourceHeight = metadata.height ?? heroProfile.fullWidth
    const widths = usefulWidths(heroProfile.widths, sourceWidth)
    const generatedDir = path.join(outputRoot, path.dirname(relativePath))
    const basename = path.basename(relativePath, path.extname(relativePath))
    const useLossless = Boolean(metadata.hasAlpha)

    await mkdir(generatedDir, { recursive: true })
    console.log(`Processing ${relativePath} (${sourceWidth}x${sourceHeight})...`)

    const variantPaths = widths.map(w => slash(path.join('__optimized__', path.dirname(relativePath), `${basename}-${w}.webp`)))

    await Promise.all([
      writeWebp(sourceBuffer, path.join(generatedDir, `${basename}.webp`), Math.min(heroProfile.fullWidth, sourceWidth), useLossless),
      writeWebp(sourceBuffer, path.join(generatedDir, `${basename}-thumb.webp`), Math.min(heroProfile.thumbWidth, sourceWidth), useLossless),
      writeWebp(sourceBuffer, path.join(generatedDir, `${basename}-placeholder.webp`), Math.min(32, sourceWidth), true),
      ...widths.map((w) => writeWebp(sourceBuffer, path.join(generatedDir, `${basename}-${w}.webp`), w, useLossless))
    ])

    manifest[relativePath] = {
      source: relativePath,
      sourceMtimeMs: sourceStat.mtimeMs,
      hash: sourceHash,
      width: sourceWidth,
      height: sourceHeight,
      full: slash(path.join('__optimized__', path.dirname(relativePath), `${basename}.webp`)),
      thumbnail: slash(path.join('__optimized__', path.dirname(relativePath), `${basename}-thumb.webp`)),
      placeholder: slash(path.join('__optimized__', path.dirname(relativePath), `${basename}-placeholder.webp`)),
      variants: widths.map((w) => ({
        width: w,
        src: slash(path.join('__optimized__', path.dirname(relativePath), `${basename}-${w}.webp`))
      }))
    }

    console.log(`  Added ${relativePath} to manifest`)
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log('Manifest updated successfully!')
}

main().catch(err => { console.error(err); process.exit(1) })
