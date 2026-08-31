// Local development API server — serves /api/gallery requests
// Run with: node --env-file=.env scripts/dev-api-server.mjs
import http from 'http'
import { URL } from 'url'

const PORT = 3001

const server = http.createServer(async (req, res) => {
  const url = req.url || ''

  if (!url.startsWith('/api/gallery')) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  try {
    const { default: handler } = await import('../api/gallery.js')
    const urlObj = new URL(url, `http://localhost:${PORT}`)
    const query = {}
    urlObj.searchParams.forEach((val, key) => { query[key] = val })

    const apiReq = {
      method: req.method || 'GET',
      query,
      headers: req.headers
    }

    const apiRes = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code
        return this
      },
      setHeader(name, value) {
        this.headers[name] = value
        res.setHeader(name, value)
        return this
      },
      json(data) {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json')
        }
        res.statusCode = this.statusCode
        res.end(JSON.stringify(data))
        return this
      }
    }

    await handler(apiReq, apiRes)
  } catch (err) {
    console.error('[dev-api-server] Error:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'API server error', detail: err.message }))
    }
  }
})

server.listen(PORT, () => {
  console.log(`[dev-api-server] Running on http://localhost:${PORT}`)
  console.log(`[dev-api-server] Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`)
  console.log(`[dev-api-server] Gallery root: ${process.env.CLOUDINARY_GALLERY_ROOT}`)
})
