#!/usr/bin/env node
// Local development API server — proxies /api/gallery to api/gallery.js
// Run with: node --env-file=.env scripts/dev-api-server.js

import http from 'http'
import { URL } from 'url'

const PORT = 3001

// Dynamically import the handler each request so env is always fresh
const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/api/gallery')) {
    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  try {
    // Force re-import by busting module cache with a timestamp query
    const { default: handler } = await import(`../api/gallery.js?t=${Date.now()}`)

    const urlObj = new URL(req.url, `http://localhost:${PORT}`)
    const query: Record<string, string> = {}
    urlObj.searchParams.forEach((val, key) => { query[key] = val })

    const apiReq = Object.assign(req, { query, method: req.method || 'GET' })

    const apiRes = Object.assign(res, {
      status(code: number) { res.statusCode = code; return this },
      json(data: unknown) {
        if (!res.headersSent) res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
        return this
      },
      setHeader(name: string, value: string | readonly string[]) {
        res.setHeader(name, value as string | string[])
        return this
      }
    })

    await handler(apiReq, apiRes)
  } catch (err) {
    console.error('[dev-api-server] Error:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'API server error' }))
    }
  }
})

server.listen(PORT, () => {
  console.log(`[dev-api-server] Listening on http://localhost:${PORT}`)
})
