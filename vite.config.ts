import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Expose Cloudinary env to process for local api/gallery.js runtime
  process.env.CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME
  process.env.CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY
  process.env.CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET
  process.env.CLOUDINARY_GALLERY_ROOT = env.CLOUDINARY_GALLERY_ROOT || 'colonel-badasu'

  return {
    plugins: [
      localApi(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
        },
        includeAssets: ['favicon.svg', 'icons.svg', 'pwa.png'],
        manifest: {
          name: 'Col. Henry Kwaku Badasu Portfolio',
          short_name: 'Col. Badasu',
          description: 'Professional portfolio of Col. Henry Kwaku Badasu, Senior Army Officer of the Ghana Armed Forces.',
          theme_color: '#1f5c3a',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa.png',
              sizes: '1254x1254',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa.png',
              sizes: '1254x1254',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'pwa.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            }
          ]
        }
      })
    ]
  }
})

type ApiHandler = (req: unknown, res: unknown) => Promise<void> | void

/**
 * Serves the Vercel-style functions in /api directly from the Vite dev server,
 * so `npm run dev` loads the Cloudinary gallery without a second API process.
 * Production is unaffected: Vercel runs the same files as serverless functions.
 */
function localApi(): Plugin {
  return {
    name: 'local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        handleApiRequest(server, req, res).catch(next)
      })
    },
  }
}

async function handleApiRequest(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const route = url.pathname.slice('/api/'.length).split('/')[0]
  const file = path.resolve(process.cwd(), 'api', `${route}.js`)

  const sendJson = (status: number, data: unknown) => {
    if (res.writableEnded) return
    res.statusCode = status
    if (!res.hasHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }

  if (!/^[\w-]+$/.test(route) || !fs.existsSync(file)) {
    sendJson(404, { error: `API route /api/${route} not found` })
    return
  }

  let body: unknown = null
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const raw = Buffer.concat(chunks).toString('utf-8')
    try {
      body = raw ? JSON.parse(raw) : null
    } catch {
      body = raw
    }
  }

  const query: Record<string, string> = {}
  url.searchParams.forEach((value, key) => { query[key] = value })

  let statusCode = 200
  const apiRes = {
    status(code: number) { statusCode = code; return apiRes },
    setHeader(name: string, value: string) { res.setHeader(name, value); return apiRes },
    json(data: unknown) { sendJson(statusCode, data); return apiRes },
    send(data: unknown) {
      if (typeof data === 'object' && data !== null) return apiRes.json(data)
      res.statusCode = statusCode
      res.end(String(data ?? ''))
      return apiRes
    },
    end(data?: string) { res.statusCode = statusCode; res.end(data); return apiRes },
  }

  try {
    const mod = await server.ssrLoadModule(file)
    const handler = mod.default as ApiHandler
    await handler({ method: req.method ?? 'GET', query, body, headers: req.headers, url: req.url }, apiRes)
    if (!res.writableEnded) sendJson(statusCode, {})
  } catch (err) {
    server.config.logger.error(`[local-api] /api/${route} failed: ${err instanceof Error ? err.stack : String(err)}`)
    sendJson(500, { error: 'API server error', detail: err instanceof Error ? err.message : String(err) })
  }
}
