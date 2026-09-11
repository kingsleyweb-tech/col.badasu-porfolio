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

    // List folders to find matching folder
    const listRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/folders/${encodeURIComponent(rootFolder)}`, {
      headers: { Authorization: `Basic ${credentials}` }
    })

    let targetFolderName = folderName

    if (listRes.ok) {
      const listData = await listRes.json()
      const folders = listData.folders || []
      const found = folders.find(
        (f) => f.name === folderName || slugify(f.name) === slug || f.name.toLowerCase() === (folderName || '').toLowerCase()
      )
      if (found) {
        targetFolderName = found.name
      }
    }

    if (!targetFolderName) {
      response.status(404).json({ error: 'Collection folder not found.' })
      return
    }

    const folderPath = `${rootFolder}/${targetFolderName}`

    // 1. Delete all resources with this prefix
    const deleteResourcesRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?prefix=${encodeURIComponent(folderPath + '/')}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Basic ${credentials}` }
      }
    )

    if (!deleteResourcesRes.ok) {
      console.warn(`Warning: deleting resources for ${folderPath} status: ${deleteResourcesRes.status}`)
    }

    // 2. Delete the empty folder
    const deleteFolderRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/folders/${encodeURIComponent(folderPath)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Basic ${credentials}` }
      }
    )

    if (!deleteFolderRes.ok) {
      const errText = await deleteFolderRes.text()
      console.error(`Folder delete error: ${errText}`)
    }

    response.status(200).json({
      success: true,
      message: `Collection "${targetFolderName}" permanently deleted.`
    })
  } catch (error) {
    console.error('Server collection delete error:', error)
    response.status(500).json({ error: 'Failed to delete collection from server.' })
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
