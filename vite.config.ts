import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
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
  // The write endpoints verify the admin's Firebase sign-in (api/_auth.js)
  process.env.VITE_FIREBASE_API_KEY = env.VITE_FIREBASE_API_KEY
  process.env.VITE_FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID
  // Server-only access-control settings (never prefixed VITE_, so never sent to the browser)
  for (const key of ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_SERVICE_ACCOUNT_FILE', 'ACCESS_SESSION_SECRET', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
    if (env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [
      localAccessGate(),
      localApi(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // No offline copy of the app: every page request must reach the server so the access
        // check runs. Devices that installed the earlier offline worker receive one that removes
        // itself and its cached pages. "Add to home screen" keeps working through the manifest.
        selfDestroying: true,
        workbox: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          // The access page and API must always come from the server, never from the offline cache
          navigateFallbackDenylist: [/^\/api\//, /^\/access/]
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
type Loader = (file: string) => Promise<Record<string, unknown>>
type Middlewares = { use: (fn: (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void) => void }
type AccessGate = { isOpenPath: (path: string) => boolean; hasPortfolioAccess: (cookie?: string | null) => Promise<boolean> }

// Dev loads server files through Vite; `vite preview` (the production build) imports them directly
const devLoader = (server: ViteDevServer): Loader => (file) => server.ssrLoadModule(file)
const previewLoader: Loader = (file) => import(pathToFileURL(file).href)

/** Security headers from vercel.json, applied by `vite preview` so the built site is tested as deployed. */
function vercelHeaders(): Array<{ key: string; value: string }> {
  try {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8'))
    return config.headers?.find((h: { source: string }) => h.source === '/(.*)')?.headers ?? []
  } catch {
    return []
  }
}

/**
 * Applies middleware.js (the Vercel Routing Middleware) locally, so the dev server and `vite preview`
 * lock the portfolio the same way production does. In dev, Vite's own module and tooling paths stay
 * open; photographs under src/assets/images are gated like the built /assets files.
 */
function localAccessGate(): Plugin {
  const devOpen = (p: string) => /^\/(?:@|node_modules\/|__vite|src\/(?!assets\/images\/))/.test(p)

  const install = (middlewares: Middlewares, load: Loader, preview: boolean) => {
    const headers = preview ? vercelHeaders() : []
    middlewares.use((req, res, next) => {
      headers.forEach(({ key, value }) => res.setHeader(key, value))
      const url = new URL(req.url ?? '/', 'http://localhost')
      if (url.pathname === '/access' || url.pathname === '/access/') {
        req.url = `/access.html${url.search}`
        return next()
      }
      // In dev an image import is a tiny JS module holding only the image URL (?import); the
      // image file itself is still gated below
      if (!preview && (devOpen(url.pathname) || url.searchParams.has('import'))) return next()
      load(path.resolve(process.cwd(), 'middleware.js'))
        .then(async (gate) => {
          const { isOpenPath, hasPortfolioAccess } = gate as AccessGate
          if (isOpenPath(url.pathname) || (await hasPortfolioAccess(req.headers.cookie))) return next()
          res.setHeader('Cache-Control', 'no-store')
          if (req.method === 'GET' && (req.headers.accept || '').includes('text/html')) {
            const target = url.pathname + url.search
            res.statusCode = 302
            res.setHeader('Location', `/access${target === '/' ? '' : `?next=${encodeURIComponent(target)}`}`)
            res.end()
          } else {
            res.statusCode = 401
            res.end('Access required')
          }
        })
        .catch(next)
    })
  }

  return {
    name: 'local-access-gate',
    apply: 'serve',
    configureServer(server) {
      install(server.middlewares, devLoader(server), false)
    },
    configurePreviewServer(server) {
      install(server.middlewares, previewLoader, true)
    },
  }
}

/**
 * Serves the Vercel-style functions in /api from the Vite dev and preview servers, so the site works
 * locally without a second API process. Production is unaffected: Vercel runs the same files.
 */
function localApi(): Plugin {
  const install = (middlewares: Middlewares, load: Loader) =>
    middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next()
      handleApiRequest(load, req, res).catch(next)
    })
  return {
    name: 'local-api',
    apply: 'serve',
    configureServer(server) {
      install(server.middlewares, devLoader(server))
    },
    configurePreviewServer(server) {
      install(server.middlewares, previewLoader)
    },
  }
}

async function handleApiRequest(load: Loader, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const route = url.pathname.slice('/api/'.length).split('/')[0]
  const file = path.resolve(process.cwd(), 'api', `${route}.js`)

  const sendJson = (status: number, data: unknown) => {
    if (res.writableEnded) return
    res.statusCode = status
    if (!res.hasHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }

  // Files starting with "_" are shared helpers, not routes (same as Vercel)
  if (!/^[\w-]+$/.test(route) || route.startsWith('_') || !fs.existsSync(file)) {
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
    const mod = await load(file)
    const handler = mod.default as ApiHandler
    await handler({ method: req.method ?? 'GET', query, body, headers: req.headers, url: req.url }, apiRes)
    if (!res.writableEnded) sendJson(statusCode, {})
  } catch (err) {
    console.error(`[local-api] /api/${route} failed: ${err instanceof Error ? err.stack : String(err)}`)
    sendJson(500, { error: 'API server error' })
  }
}
