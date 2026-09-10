import type { PortfolioData } from './portfolioService'

export interface UploadResult {
  success: boolean
  url: string
  publicId: string
  thumbnailUrl?: string
  largeUrl?: string
  error?: string
}

/**
 * Extracts a Cloudinary public_id from a Cloudinary image URL.
 * Example: https://res.cloudinary.com/cloud/image/upload/v12345/colonel-badasu/biography/portrait.jpg
 * -> colonel-badasu/biography/portrait
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null
  try {
    const parts = url.split('/upload/')
    if (parts.length < 2) return null
    let path = parts[1]
    // Remove transformation strings like f_auto,q_auto,w_800/
    path = path.replace(/^([^/]+\/)?v\d+\//, '').replace(/^f_auto[^\/]+\//, '')
    // Remove extension
    const dotIndex = path.lastIndexOf('.')
    if (dotIndex !== -1) {
      path = path.substring(0, dotIndex)
    }
    return path
  } catch {
    return null
  }
}

/**
 * Checks if a given Cloudinary publicId or URL is referenced anywhere else in the portfolioData.
 */
export function isAssetUsedElsewhere(
  targetIdentifier: string,
  portfolioData: PortfolioData
): boolean {
  if (!targetIdentifier) return false
  const json = JSON.stringify(portfolioData)
  
  // Count how many times the publicId or raw filename appears in the JSON string
  const cleanTarget = targetIdentifier.replace(/https?:\/\/[^/]+\//, '').replace(/\.[a-z0-9]+$/i, '')
  const occurrences = (json.match(new RegExp(cleanTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length

  return occurrences > 1
}

/**
 * Uploads an image file to Cloudinary via the backend API endpoint (/api/upload).
 */
export async function uploadImageToCloudinary(file: File, folder = 'uploads'): Promise<UploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64Data,
            folder: folder,
            filename: file.name
          })
        })

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({ error: 'Upload failed' }))
          resolve({ success: false, url: '', publicId: '', error: errJson.error || 'Cloudinary upload failed' })
          return
        }

        const data = await response.json()
        resolve({
          success: true,
          url: data.url,
          publicId: data.publicId,
          thumbnailUrl: data.thumbnailUrl,
          largeUrl: data.largeUrl
        })
      } catch (err: any) {
        resolve({ success: false, url: '', publicId: '', error: err.message || 'Network error uploading image' })
      }
    }
    reader.onerror = () => {
      resolve({ success: false, url: '', publicId: '', error: 'Failed to read local image file.' })
    }
  })
}

/**
 * Deletes a Cloudinary asset if it is not used anywhere else in the portfolio data.
 */
export async function deleteCloudinaryImageIfUnused(
  publicIdOrUrl: string,
  portfolioData: PortfolioData
): Promise<boolean> {
  if (!publicIdOrUrl) return false

  const publicId = extractCloudinaryPublicId(publicIdOrUrl) || publicIdOrUrl

  // Check if used elsewhere before deleting
  if (isAssetUsedElsewhere(publicId, portfolioData)) {
    console.log(`[ImageManager] Preserving Cloudinary asset "${publicId}" as it is referenced elsewhere in the portfolio.`)
    return false
  }

  try {
    const res = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success) {
      console.log(`[ImageManager] Successfully deleted unused Cloudinary asset "${publicId}".`)
      return true
    }
  } catch (err) {
    console.warn(`[ImageManager] Failed to delete Cloudinary asset "${publicId}":`, err)
  }
  return false
}
