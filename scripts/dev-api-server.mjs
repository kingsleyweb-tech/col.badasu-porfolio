// Local development API server — serves /api/* requests dynamically
// Run with: node --env-file=.env scripts/dev-api-server.mjs
import http from 'http'
import { URL } from 'url'
import fs from 'fs'
import path from 'path'

const PORT = 3001

const server = http.createServer(async (req, res) => {
  const url = req.url || ''

  if (!url.startsWith('/api/')) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  const urlObj = new URL(url, `http://localhost:${PORT}`)
  const routeName = urlObj.pathname.replace('/api/', '').split('/')[0]
  const handlerFile = path.join(process.cwd(), 'api', `${routeName}.js`)

  if (!fs.existsSync(handlerFile)) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: `API route /api/${routeName} not found` }))
    return
  }

  // Parse JSON request body if POST/PUT
  let reqBody = null
  if (req.method === 'POST' || req.method === 'PUT') {
    const buffers = []
    for await (const chunk of req) {
      buffers.push(chunk)
    }
    const raw = Buffer.concat(buffers).toString('utf-8')
    try {
      reqBody = raw ? JSON.parse(raw) : null
    } catch {
      reqBody = raw
    }
  }

  try {
    const { default: handler } = await import(`file://${handlerFile}`)
    const query = {}
    urlObj.searchParams.forEach((val, key) => { query[key] = val })

    const apiReq = {
      method: req.method || 'GET',
      query,
      body: reqBody,
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
    console.error(`[dev-api-server] Error handling ${url}:`, err)
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
