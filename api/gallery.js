import { requireViewer } from './_access.js'

const rootFolder = process.env.CLOUDINARY_GALLERY_ROOT || 'colonel-badasu'
const pageSize = 36

// Cloudinary's Admin API allows 500 calls per hour. The whole library is listed in a handful of
// calls (folders + all photos, 500 per page), grouped in memory, and cached briefly, instead of
// spending two or more calls per collection on every request.
const CACHE_TTL_MS = 60 * 1000
let libraryCache = null // { at: number, folders: Array<{ name, path, resources }> }
let libraryInFlight = null

class RateLimitError extends Error {
  constructor(resetAt) {
    super('Cloudinary rate limit reached')
    this.resetAt = resetAt
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    response.status(503).json({ error: 'Gallery is not configured.' })
    return
  }

  // Photo listings are protected: only a visitor session or the administrator gets them, and
  // responses are never stored in a shared cache (requireViewer sets private, no-store).
  if (!(await requireViewer(request, response))) return

  // Admin requests (fresh=1) skip the short in-memory cache so uploads/deletes show immediately
  const fresh = request.query.fresh === '1'

  let library
  try {
    library = await getLibrary(cloudName, apiKey, apiSecret, fresh)
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.status(503).json({
        error: 'Cloudinary rate limit reached. Photos will be available again shortly.',
        retryAt: error.resetAt || null,
      })
      return
    }
    console.error('Gallery API error', error)
    response.status(500).json({ error: 'Gallery is temporarily unavailable.' })
    return
  }

  const collectionSlug = typeof request.query.collection === 'string' ? request.query.collection : ''

  if (collectionSlug) {
    const folder = library.folders.find((candidate) => slugify(candidate.name) === collectionSlug)
    if (!folder) {
      response.status(404).json({ error: 'Collection not found.' })
      return
    }

    // The cursor is the offset of the next page within the cached listing
    const offset = Math.max(0, parseInt(typeof request.query.cursor === 'string' ? request.query.cursor : '0', 10) || 0)
    const pageItems = folder.resources.slice(offset, offset + pageSize)
    const images = pageItems.map((asset) => imageFromResource(cloudName, asset, folder.name))
    const nextOffset = offset + pageSize

    response.status(200).json({
      collection: {
        slug: slugify(folder.name),
        name: getCollectionDisplayName(folder.name),
        count: folder.resources.length,
        coverImage: folder.resources[0] ? imageFromResource(cloudName, folder.resources[0], folder.name) : undefined,
      },
      images,
      nextCursor: nextOffset < folder.resources.length ? String(nextOffset) : undefined,
    })
    return
  }

  // Only collections that have at least one photograph are listed
  const collections = library.folders
    .filter((folder) => folder.resources.length > 0)
    .map((folder) => ({
      slug: slugify(folder.name),
      name: getCollectionDisplayName(folder.name),
      count: folder.resources.length,
      coverImage: imageFromResource(cloudName, folder.resources[0], folder.name),
    }))

  response.status(200).json({ collections })
}

/** Returns the cached library, refreshing it when stale (or when `fresh`), shared across concurrent requests. */
async function getLibrary(cloudName, apiKey, apiSecret, fresh) {
  const isValid = libraryCache && Date.now() - libraryCache.at < CACHE_TTL_MS
  if (isValid && !fresh) return libraryCache

  if (!libraryInFlight) {
    libraryInFlight = loadLibrary(cloudName, apiKey, apiSecret)
      .then((library) => {
        libraryCache = library
        return library
      })
      .finally(() => {
        libraryInFlight = null
      })
  }

  try {
    return await libraryInFlight
  } catch (error) {
    // Serve the last good listing rather than an error when Cloudinary refuses (rate limit, outage)
    if (libraryCache) {
      console.warn('[Gallery] Serving cached library after refresh failed:', error.message)
      return libraryCache
    }
    throw error
  }
}

async function loadLibrary(cloudName, apiKey, apiSecret) {
  const folders = await listFolders(cloudName, apiKey, apiSecret)
  const resources = await listAllResources(cloudName, apiKey, apiSecret, `${rootFolder}/`)

  const withResources = folders.map((folder) => ({
    ...folder,
    resources: resources.filter((resource) => resource.public_id.startsWith(`${folder.path}/`)),
  }))

  return { at: Date.now(), folders: withResources }
}

async function listFolders(cloudName, apiKey, apiSecret) {
  const data = await cloudinaryFetchWithRetry(cloudName, apiKey, apiSecret, `/folders/${encodePath(rootFolder)}`)
  const ignoredFolders = new Set(['portfolio', 'portfolio website', 'portfolio-website', 'website', 'site', 'hero', 'career', 'achievements', 'gallery', '__optimized__'])
  return (data.folders || [])
    .filter((folder) => !ignoredFolders.has(folder.name.toLowerCase().trim()))
    .map((folder) => ({ name: folder.name, path: folder.path }))
}

/** Lists every image under a prefix, 500 per call. */
async function listAllResources(cloudName, apiKey, apiSecret, prefix) {
  const all = []
  let cursor
  do {
    const params = new URLSearchParams({ type: 'upload', prefix, max_results: '500' })
    if (cursor) params.set('next_cursor', cursor)
    const data = await cloudinaryFetchWithRetry(cloudName, apiKey, apiSecret, `/resources/image/upload?${params.toString()}`)
    all.push(...(data.resources || []))
    cursor = data.next_cursor
  } while (cursor)
  return all
}

/**
 * Fetches from Cloudinary, retrying transient failures (up to 3 attempts) with backoff.
 * A rate-limit response is never retried: retrying would only burn more of the hourly quota.
 */
async function cloudinaryFetchWithRetry(cloudName, apiKey, apiSecret, path, maxAttempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await cloudinaryFetch(cloudName, apiKey, apiSecret, path)
    } catch (err) {
      if (err instanceof RateLimitError) throw err
      lastError = err
      if (attempt < maxAttempts) {
        const delay = 300 * Math.pow(3, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
        console.warn(`[Gallery] Retrying Cloudinary request (attempt ${attempt + 1}/${maxAttempts}): ${path}`)
      }
    }
  }
  throw lastError
}

async function cloudinaryFetch(cloudName, apiKey, apiSecret, path) {
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const result = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}${path}`, {
      headers: { Authorization: `Basic ${credentials}` },
      signal: controller.signal,
    })

    if (result.status === 420 || result.status === 429) {
      throw new RateLimitError(result.headers.get('x-featureratelimit-reset'))
    }
    if (!result.ok) {
      throw new Error(`Cloudinary request failed: ${result.status} ${result.statusText}`)
    }

    return await result.json()
  } finally {
    clearTimeout(timeout)
  }
}

function imageFromResource(cloudName, resource, folderName) {
  const publicId = encodePublicId(resource.public_id)
  const extension = resource.format ? `.${resource.format}` : ''

  return {
    id: resource.asset_id || resource.public_id,
    publicId: resource.public_id,
    title: toTitle(resource.public_id.split('/').at(-1) || 'Photograph'),
    alt: `Colonel Henry Kwaku Badasu ${getCollectionDisplayName(folderName)} photograph`,
    thumbnailUrl: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,g_auto,w_900,h_680/${publicId}${extension}`,
    // Small, plain-crop tile for admin grids: cheap for Cloudinary to generate and fast to load
    gridUrl: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,w_480,h_360/${publicId}${extension}`,
    largeUrl: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_1800/${publicId}${extension}`,
    width: resource.width,
    height: resource.height,
  }
}

function encodePath(value) {
  return value.split('/').map(encodeURIComponent).join('/')
}

function encodePublicId(value) {
  return value.split('/').map(encodeURIComponent).join('/')
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toTitle(value) {
  return value
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const nameMapping = {
  'boundary opearations': 'Border Security & Tactical Operations',
  'collaborations': 'Strategic Partnerships & Inter-Agency Engagements',
  'ecowas': 'ECOWAS Peace Support Operations',
  'ghana-boundary commission': 'Ghana Boundary Commission Services',
  'interviewing': 'Press Relations & Official Interviews',
  'jungle': 'Jungle Operations & Field Training',
  'meetiings': 'Strategic Command Meetings & Briefings',
  'operation wth imigration': 'Joint Boundary Operations with Immigration',
  'photos': 'Historical Service Portraits & Archives',
  'sea border operation': 'Maritime Security & Sea Border Patrols',
  'tv3': 'National Television Appearances & Media Features',
  'university of london graduation': 'Academic Convocation & University of London Milestones',
  'military': 'Military Honors, Strategy & Ceremonial Engagements',
  'adventure': 'Tactical Expeditions & Field Adventures',
  'recce': 'Field Reconnaissance & Tactical Surveys'
}

function getCollectionDisplayName(folderName) {
  const normalized = folderName.toLowerCase().trim()
  if (nameMapping[normalized]) {
    return nameMapping[normalized]
  }
  return toTitle(folderName)
}
