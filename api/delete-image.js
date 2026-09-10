import crypto from 'node:crypto'

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
    const { publicId } = body

    if (!publicId) {
      response.status(400).json({ error: 'No publicId provided.' })
      return
    }

    const timestamp = Math.round(Date.now() / 1000)
    const params = {
      public_id: publicId,
      timestamp: String(timestamp)
    }

    const sortedKeys = Object.keys(params).sort()
    const signatureString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&') + apiSecret
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('api_key', apiKey)
    formData.append('timestamp', String(timestamp))
    formData.append('signature', signature)

    const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData
    })

    if (!cloudinaryRes.ok) {
      const errText = await cloudinaryRes.text()
      response.status(cloudinaryRes.status).json({ error: `Cloudinary delete failed: ${errText}` })
      return
    }

    const result = await cloudinaryRes.json()

    response.status(200).json({
      success: true,
      result: result.result
    })
  } catch (error) {
    console.error('Server image delete error:', error)
    response.status(500).json({ error: 'Server image deletion failed.' })
  }
}
