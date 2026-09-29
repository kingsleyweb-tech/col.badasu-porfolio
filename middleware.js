// Vercel Routing Middleware: runs before every request, including static files.
//
// Without a valid visitor session (or the administrator's cookie) no portfolio page or photograph
// is served: pages redirect to the access page, other files get 401. Open without a session:
//   • the access page and its files, the admin dashboard shell (it has its own sign-in)
//   • the JavaScript/CSS bundles (they contain no portfolio content; that comes from /api/portfolio)
//   • /api/* (every endpoint enforces its own authorization)
//
// The cookie is checked here by signature and expiry, plus the revocation counters published in
// site_meta/access (cached for a few seconds). The data endpoints do the full check against the
// stored session on every request.
import { ADMIN_COOKIE, VISITOR_COOKIE, readAdminToken, readCookie, readVisitorToken, sessionSecret } from './api/_token.js'

const OPEN = [
  /^\/api\//,
  /^\/access(?:\.html|\.css|\.js)?\/?$/,
  /^\/admin(?:\/.*)?$/,
  /^\/assets\/[^/]+\.(?:js|css|woff2?|ttf|map)$/,
  /^\/(?:sw\.js|workbox-[\w-]+\.js|registerSW\.js|manifest\.json|manifest\.webmanifest|pwa\.png|crest\.png|crest\.svg|favicon\.ico|robots\.txt)$/,
]

const META_CACHE_MS = 5000
let metaCache = null

async function accessMeta() {
  if (metaCache && Date.now() - metaCache.at < META_CACHE_MS) return metaCache.meta
  let meta = null
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID
    const emulator = process.env.FIRESTORE_EMULATOR_HOST
    const base = emulator ? `http://${emulator}` : 'https://firestore.googleapis.com'
    const res = await fetch(`${base}/v1/projects/${projectId}/databases/(default)/documents/site_meta/access`)
    if (res.ok) {
      const fields = (await res.json()).fields || {}
      const num = (f) => Number(f?.integerValue ?? f?.doubleValue ?? 0)
      meta = { enabled: fields.enabled?.booleanValue === true, codeVersion: num(fields.codeVersion), epoch: num(fields.epoch) }
    } else if (res.status === 404) {
      meta = { enabled: false, codeVersion: 0, epoch: 0 }
    }
  } catch {
    // Firestore unreachable: fall back to the signed cookie alone; the data endpoints still check fully
  }
  metaCache = { at: Date.now(), meta }
  return meta
}

export async function hasPortfolioAccess(cookieHeader) {
  if (!sessionSecret()) return false
  if (await readAdminToken(readCookie(cookieHeader, ADMIN_COOKIE))) return true
  const claims = await readVisitorToken(readCookie(cookieHeader, VISITOR_COOKIE))
  if (!claims) return false
  const meta = await accessMeta()
  if (!meta) return true
  return meta.enabled && meta.codeVersion === claims.codeVersion && meta.epoch === claims.epoch
}

export const isOpenPath = (path) => OPEN.some((pattern) => pattern.test(path))

/** Continue to the requested file or rewrite (same as next() from @vercel/functions). */
const pass = () => new Response(null, { headers: { 'x-middleware-next': '1' } })

export default async function middleware(request) {
  const url = new URL(request.url)
  if (isOpenPath(url.pathname) || (await hasPortfolioAccess(request.headers.get('cookie')))) return pass()

  const wantsPage = request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html')
  if (wantsPage) {
    const next = url.pathname + url.search
    const target = new URL(`/access${next === '/' ? '' : `?next=${encodeURIComponent(next)}`}`, url)
    return new Response(null, { status: 302, headers: { Location: target.toString(), 'Cache-Control': 'no-store' } })
  }
  return new Response('Access required', { status: 401, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' } })
}
