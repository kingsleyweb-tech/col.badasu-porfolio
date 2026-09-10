import crypto from 'node:crypto'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const rootFolder = process.env.CLOUDINARY_GALLERY_ROOT || 'colonel-badasu'

  if (!cloudName || !apiKey || !apiSecret) {
    response.status(503).json({ error: 'Cloudinary server credentials missing.' })
    return
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {}
    const { file, folder = 'uploads', filename } = body

    if (!file) {
      response.status(400).json({ error: 'No image file provided.' })
      return
    }

    const timestamp = Math.round(Date.now() / 1000)
    const targetFolder = `${rootFolder}/${folder}`.replace(/\/+/g, '/').replace(/\/$/, '')

    const params = {
      folder: targetFolder,
      timestamp: String(timestamp)
    }

    const sortedKeys = Object.keys(params).sort()
    const signatureString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&') + apiSecret
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', apiKey)
    formData.append('timestamp', String(timestamp))
    formData.append('folder', targetFolder)
    formData.append('signature', signature)

    const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    })

    if (!cloudinaryRes.ok) {
      const errText = await cloudinaryRes.text()
      response.status(cloudinaryRes.status).json({ error: `Cloudinary upload failed: ${errText}` })
      return
    }

    const result = await cloudinaryRes.json()

    response.status(200).json({
      success: true,
      publicId: result.public_id,
      url: result.secure_url || result.url,
      thumbnailUrl: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,g_auto,w_600,h_450/${encodePublicId(result.public_id)}.${result.format}`,
      largeUrl: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_1800/${encodePublicId(result.public_id)}.${result.format}`
    })
  } catch (error) {
    console.error('Server upload error:', error)
    response.status(500).json({ error: 'Server image upload failed.' })
  }
}

function encodePublicId(value) {
  return value.split('/').map(encodeURIComponent).join('/')
}
