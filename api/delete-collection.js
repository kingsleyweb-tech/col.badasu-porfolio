const rootFolder = process.env.CLOUDINARY_GALLERY_ROOT || 'colonel-badasu'

export default async function handler(request, response) {
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    response.setHeader('Allow', 'POST, DELETE')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    response.status(503).json({ error: 'Cloudinary server credentials missing.' })
    return
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {}
    const { folderName, slug } = body

    if (!folderName && !slug) {
      response.status(400).json({ error: 'No collection folderName or slug provided.' })
      return
    }

    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    const targetSlug = slug || slugify(folderName)

    // 1. Find matching folders under rootFolder
    const listRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/folders/${encodePath(rootFolder)}`,
      { headers: { Authorization: `Basic ${credentials}` } }
    )

    let matchingFolderNames = new Set([folderName, targetSlug, targetSlug.replace(/-/g, ' ')].filter(Boolean))

    if (listRes.ok) {
      const listData = await listRes.json()
      const folders = listData.folders || []
      folders.forEach((f) => {
        if (
          f.name === folderName ||
          slugify(f.name) === targetSlug ||
          f.name.toLowerCase() === (folderName || '').toLowerCase()
        ) {
          matchingFolderNames.add(f.name)
        }
      })
    }

    // 2. Iterate and delete all matching folders and their assets
    for (const name of matchingFolderNames) {
      const folderPath = `${rootFolder}/${name}`

      // Delete all image resources under this folder prefix (with trailing slash)
      let partial = false
      do {
        try {
          const deleteRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?prefix=${encodePath(folderPath + '/')}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Basic ${credentials}` }
            }
          )
          if (deleteRes.ok) {
            const data = await deleteRes.json()
            partial = Boolean(data.partial)
          } else {
            console.warn(`Resource delete failed for ${folderPath}: ${deleteRes.status}`)
            partial = false
          }
        } catch (err) {
          console.warn(`Resource delete warning for ${folderPath}:`, err)
          partial = false
        }
      } while (partial)

      // Delete folder itself from Cloudinary (retry up to 3 times with delay for Cloudinary indexing)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const folderRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/folders/${encodePath(folderPath)}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Basic ${credentials}` }
            }
          )
          if (folderRes.ok) {
            console.log(`Successfully deleted folder ${folderPath} from Cloudinary.`)
            break
          } else if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 400 * attempt))
          }
        } catch (err) {
          console.warn(`Folder delete warning for ${folderPath} (attempt ${attempt}):`, err)
        }
      }
    }

    response.status(200).json({
      success: true,
      message: `Collection "${folderName || targetSlug}" permanently deleted from Cloudinary.`
    })
  } catch (error) {
    console.error('Server collection delete error:', error)
    response.status(500).json({ error: 'Failed to delete collection from server.' })
  }
}

function encodePath(value) {
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
