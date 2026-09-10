const localImages = import.meta.glob('/src/assets/images/**/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  import: 'default'
}) as Record<string, string>

export function resolveImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return ''

  // Data URLs or Blob URLs (e.g., live preview during file upload)
  if (pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl
  }

  let clean = pathOrUrl

  // Handle broken/legacy placeholder Cloudinary links pointing to 'lxjudwn8/site'
  if (clean.includes('res.cloudinary.com/lxjudwn8/')) {
    const parts = clean.split('colonel-badasu/site/')
    if (parts[1]) {
      clean = parts[1]
    }
  }

  // Remove leading slash
  clean = clean.replace(/^\//, '')

  // 1. Try exact match in local assets
  for (const [key, url] of Object.entries(localImages)) {
    if (key.endsWith('/' + clean)) {
      return url
    }
  }

  // 2. Try match without file extension
  const baseName = clean.replace(/\.[^.]+$/, '')
  for (const [key, url] of Object.entries(localImages)) {
    const keyBase = key.replace(/\.[^.]+$/, '')
    if (keyBase.endsWith('/' + baseName)) {
      return url
    }
  }

  // 3. Try filename only match (e.g. "a1.png" matching "/src/assets/images/hero/a1.png")
  const fileName = clean.split('/').pop() || ''
  if (fileName) {
    for (const [key, url] of Object.entries(localImages)) {
      const keyFile = key.split('/').pop() || ''
      if (keyFile.toLowerCase() === fileName.toLowerCase()) {
        return url
      }
    }
  }

  // If it's a dynamic user upload URL (from custom Cloudinary or HTTP), return it
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }

  return pathOrUrl
}
