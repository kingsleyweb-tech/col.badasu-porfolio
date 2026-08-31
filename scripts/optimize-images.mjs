import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const sourceRoot = path.join(root, 'src', 'assets', 'images')
const outputRoot = path.join(sourceRoot, '__optimized__')
const manifestPath = path.join(outputRoot, 'manifest.json')
const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const quality = 82

const profiles = [
  {
    test: (relativePath) => relativePath.startsWith('hero/'),
    widths: [480, 768, 1200, 1600, 2000],
    fullWidth: 2000,
    thumbWidth: 768
  },
  {
    test: (relativePath) => relativePath.startsWith('gallery/'),
    widths: [480, 768, 1200, 1600],
    fullWidth: 1600,
    thumbWidth: 600
  },
  {
    test: (relativePath) => relativePath.startsWith('career/') || relativePath.startsWith('achievements/'),
    widths: [480, 768, 900, 1200],
    fullWidth: 1200,
    thumbWidth: 600
  },
  {
    test: () => true,
    widths: [128, 256, 480],
    fullWidth: 480,
    thumbWidth: 128,
    preserveSharpEdges: true
  }
]

async function main() {
  const previousManifest = await readJson(manifestPath)
  const sourceFiles = await findSourceImages(sourceRoot)
  const manifest = {}

  await mkdir(outputRoot, { recursive: true })

  for (const file of sourceFiles) {
    const relativePath = slash(path.relative(sourceRoot, file))

    if (relativePath.startsWith('__optimized__/')) {
      continue
    }

    const profile = profiles.find((candidate) => candidate.test(relativePath)) ?? profiles.at(-1)
    const sourceBuffer = await readFile(file)
    const sourceHash = createHash('sha256').update(sourceBuffer).digest('hex')
    const sourceStat = await stat(file)
    const existing = previousManifest[relativePath]
    const metadata = await sharp(sourceBuffer).metadata()
    const sourceWidth = metadata.width ?? profile.fullWidth
    const sourceHeight = metadata.height ?? profile.fullWidth
    const widths = usefulWidths(profile.widths, sourceWidth)
    const generatedDir = path.join(outputRoot, path.dirname(relativePath))
    const basename = path.basename(relativePath, path.extname(relativePath))
    const useLossless = Boolean(profile.preserveSharpEdges || metadata.hasAlpha)

    const output = {
      source: relativePath,
      sourceMtimeMs: sourceStat.mtimeMs,
      hash: sourceHash,
      width: sourceWidth,
      height: sourceHeight,
      full: slash(path.join('__optimized__', path.dirname(relativePath), `${basename}.webp`)),
      thumbnail: slash(path.join('__optimized__', path.dirname(relativePath), `${basename}-thumb.webp`)),
      placeholder: slash(path.join('__optimized__', path.dirname(relativePath), `${basename}-placeholder.webp`)),
      variants: widths.map((width) => ({
        width,
        src: slash(path.join('__optimized__', path.dirname(relativePath), `${basename}-${width}.webp`))
      }))
    }

    manifest[relativePath] = output

    if (existing?.hash === sourceHash && await outputsExist(output)) {
      console.log(`skip ${relativePath}`)
      continue
    }

    await mkdir(generatedDir, { recursive: true })
    await Promise.all([
      writeWebp(sourceBuffer, path.join(generatedDir, `${basename}.webp`), Math.min(profile.fullWidth, sourceWidth), useLossless),
      writeWebp(sourceBuffer, path.join(generatedDir, `${basename}-thumb.webp`), Math.min(profile.thumbWidth, sourceWidth), useLossless),
      writeWebp(sourceBuffer, path.join(generatedDir, `${basename}-placeholder.webp`), Math.min(32, sourceWidth), true),
      ...widths.map((width) => writeWebp(sourceBuffer, path.join(generatedDir, `${basename}-${width}.webp`), width, useLossless))
    ])

    console.log(`optimized ${relativePath}`)
  }

  const nextManifest = `${JSON.stringify(manifest, null, 2)}\n`
  const previousManifestText = `${JSON.stringify(previousManifest, null, 2)}\n`

  if (nextManifest !== previousManifestText) {
    await writeFile(manifestPath, nextManifest)
  }
}

async function findSourceImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await findSourceImages(fullPath))
      continue
    }

    if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath)
    }
  }

  return files.sort((a, b) => a.localeCompare(b))
}

function usefulWidths(widths, sourceWidth) {
  const selected = widths.filter((width) => width < sourceWidth)

  if (!selected.includes(sourceWidth)) {
    selected.push(sourceWidth)
  }

  return [...new Set(selected)].sort((a, b) => a - b)
}

async function writeWebp(sourceBuffer, outputPath, width, lossless = false) {
  const pipeline = sharp(sourceBuffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp(lossless ? { lossless: true, effort: 5 } : { quality, effort: 5 })

  await pipeline.toFile(outputPath)
}

async function outputsExist(entry) {
  const paths = [entry.full, entry.thumbnail, entry.placeholder, ...entry.variants.map((variant) => variant.src)]

  for (const relativePath of paths) {
    try {
      await stat(path.join(sourceRoot, relativePath))
    } catch {
      return false
    }
  }

  return true
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return {}
  }
}

function slash(value) {
  return value.split(path.sep).join('/')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
