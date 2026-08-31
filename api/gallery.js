const rootFolder = process.env.CLOUDINARY_GALLERY_ROOT || 'colonel-badasu'
const pageSize = 36

export default async function handler(request, response) {
  try {
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

    const collectionSlug = typeof request.query.collection === 'string' ? request.query.collection : ''

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800')

    if (collectionSlug) {
      const folders = await listFolders(cloudName, apiKey, apiSecret)
      const folder = folders.find((candidate) => slugify(candidate.name) === collectionSlug)

      if (!folder) {
        response.status(404).json({ error: 'Collection not found.' })
        return
      }

      const cursor = typeof request.query.cursor === 'string' ? request.query.cursor : undefined
      const resources = await listResources(cloudName, apiKey, apiSecret, folder.path, cursor)
      const images = resources.items.map((asset) => imageFromResource(cloudName, asset, folder.name))

      response.status(200).json({
        collection: {
          slug: slugify(folder.name),
          name: getCollectionDisplayName(folder.name),
          count: resources.totalCount,
          coverImage: images[0]
        },
        images,
        nextCursor: resources.nextCursor
      })
      return
    }

    const folders = await listFolders(cloudName, apiKey, apiSecret)
    const collections = await Promise.all(folders.map(async (folder) => {
      const resources = await listResources(cloudName, apiKey, apiSecret, folder.path, undefined, 1)
      const cover = resources.items[0]

      return {
        slug: slugify(folder.name),
        name: getCollectionDisplayName(folder.name),
        count: resources.totalCount,
        coverImage: cover ? imageFromResource(cloudName, cover, folder.name) : undefined
      }
    }))

    response.status(200).json({ collections: collections.filter((collection) => collection.coverImage) })
  } catch (error) {
    console.error('Gallery API error', error)
    response.status(500).json({ error: 'Gallery is temporarily unavailable.' })
  }
}

async function listFolders(cloudName, apiKey, apiSecret) {
  const data = await cloudinaryFetch(cloudName, apiKey, apiSecret, `/folders/${encodePath(rootFolder)}`)
  const ignoredFolders = new Set(['portfolio', 'portfolio website', 'portfolio-website', 'website', 'hero', 'career', 'achievements', 'gallery', '__optimized__'])
  return (data.folders || [])
    .filter((folder) => !ignoredFolders.has(folder.name.toLowerCase().trim()))
    .map((folder) => ({
      name: folder.name,
      path: folder.path
    }))
}

async function listResources(cloudName, apiKey, apiSecret, prefix, nextCursor, maxResults = pageSize) {
  const params = new URLSearchParams({
    type: 'upload',
    prefix: `${prefix}/`,
    max_results: String(maxResults)
  })

  if (nextCursor) {
    params.set('next_cursor', nextCursor)
  }

  const data = await cloudinaryFetch(cloudName, apiKey, apiSecret, `/resources/image/upload?${params.toString()}`)
  const items = data.resources || []

  let totalCount = items.length
  let cursor = data.next_cursor

  while (cursor) {
    const nextParams = new URLSearchParams({
      type: 'upload',
      prefix: `${prefix}/`,
      max_results: '500',
      next_cursor: cursor
    })
    const nextPage = await cloudinaryFetch(cloudName, apiKey, apiSecret, `/resources/image/upload?${nextParams.toString()}`)
    totalCount += (nextPage.resources || []).length
    cursor = nextPage.next_cursor
  }

  return {
    items,
    totalCount,
    nextCursor: data.next_cursor
  }
}

async function cloudinaryFetch(cloudName, apiKey, apiSecret, path) {
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const result = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}${path}`, {
    headers: {
      Authorization: `Basic ${credentials}`
    }
  })

  if (!result.ok) {
    throw new Error(`Cloudinary request failed: ${result.status}`)
  }

  return await result.json()
}

function imageFromResource(cloudName, resource, folderName) {
  const publicId = encodePublicId(resource.public_id)
  const extension = resource.format ? `.${resource.format}` : ''

  return {
    id: resource.asset_id || resource.public_id,
    title: toTitle(resource.public_id.split('/').at(-1) || 'Photograph'),
    alt: `Colonel Henry Kwaku Badasu ${getCollectionDisplayName(folderName)} photograph`,
    thumbnailUrl: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,g_auto,w_900,h_680/${publicId}${extension}`,
    largeUrl: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_1800/${publicId}${extension}`,
    width: resource.width,
    height: resource.height
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
  'adventure': 'Tactical Expeditions & Field Adventures'
};

function getCollectionDisplayName(folderName) {
  const normalized = folderName.toLowerCase().trim();
  if (nameMapping[normalized]) {
    return nameMapping[normalized];
  }
  return toTitle(folderName);
}

