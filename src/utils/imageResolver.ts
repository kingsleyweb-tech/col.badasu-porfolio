const localImages = import.meta.glob([
  '/src/assets/images/*.{png,jpg,jpeg,webp,svg}',
  '/src/assets/images/hero/*.{png,jpg,jpeg,webp,svg}',
  '/src/assets/images/ecowas/*.{png,jpg,jpeg,webp,svg}'
], {
  eager: true,
  import: 'default'
}) as Record<string, string>

export function optimizeCloudinaryUrl(url: string, width?: number): string {
  if (!url || !url.includes('res.cloudinary.com')) return url
  try {
    if (url.includes('/upload/')) {
      const parts = url.split('/upload/')
      const secondHalf = parts[1]
      if (!secondHalf.startsWith('f_auto') && !secondHalf.startsWith('q_auto') && !secondHalf.startsWith('w_')) {
        const transform = width ? `f_auto,q_auto,w_${width}/` : 'f_auto,q_auto/'
        return `${parts[0]}/upload/${transform}${secondHalf}`
      }
    }
  } catch {
    // fallback to original
  }
  return url
}

export function resolveImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return ''

  // 1. Full HTTP/HTTPS URLs (Cloudinary, external uploads, etc.) or Data/Blob URLs
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl.includes('res.cloudinary.com') ? optimizeCloudinaryUrl(pathOrUrl) : pathOrUrl
  }

  const clean = pathOrUrl.replace(/^\//, '')

  // 2. Try exact match in local assets
  for (const [key, url] of Object.entries(localImages)) {
    if (key.endsWith('/' + clean)) {
      return url
    }
  }

  // 3. Try match without file extension
  const baseName = clean.replace(/\.[^.]+$/, '')
  for (const [key, url] of Object.entries(localImages)) {
    const keyBase = key.replace(/\.[^.]+$/, '')
    if (keyBase.endsWith('/' + baseName)) {
      return url
    }
  }

  // 4. Try filename only match (e.g. "a1.png" matching "/src/assets/images/hero/a1.png")
  const fileName = clean.split('/').pop() || ''
  if (fileName) {
    for (const [key, url] of Object.entries(localImages)) {
      const keyFile = key.split('/').pop() || ''
      if (keyFile.toLowerCase() === fileName.toLowerCase()) {
        return url
      }
    }
  }

  return pathOrUrl
}
