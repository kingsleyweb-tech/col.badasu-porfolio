// Visitor access to the portfolio.
//   POST   /api/access  { code }  check the access code and start a one-hour session (sets pf_access)
//   GET    /api/access            session status for the open page
//   DELETE /api/access            end the session
import {
  SESSION_SECONDS,
  clearFailedAttempts,
  createVisitorSession,
  getAccessConfig,
  getViewer,
  logAccess,
  rateLimitWait,
  recordFailedAttempt,
  verifyAccessCode,
} from './_access.js'
import { NotConfiguredError, adminDb } from './_firebaseAdmin.js'
import { VISITOR_COOKIE, cookieHeader, randomId, readCookie, readVisitorToken, sessionSecret, sha256, signVisitorToken } from './_token.js'

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store')

  if (!sessionSecret()) {
    console.error('[access] ACCESS_SESSION_SECRET is not set')
    response.status(503).json({ error: 'unavailable' })
    return
  }

  try {
    if (request.method === 'POST') return await signIn(request, response)
    if (request.method === 'GET') return await status(request, response)
    if (request.method === 'DELETE') return await signOut(request, response)
    response.setHeader('Allow', 'GET, POST, DELETE')
    response.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[access] request failed', error instanceof NotConfiguredError ? error.message : error)
    response.status(503).json({ error: 'unavailable' })
  }
}

async function signIn(request, response) {
  const body = typeof request.body === 'string' ? safeJson(request.body) : request.body || {}
  const code = typeof body.code === 'string' ? body.code : ''

  const wait = await rateLimitWait(request)
  if (wait > 0) {
    await logAccess(request, 'rate_limited')
    response.setHeader('Retry-After', String(wait))
    response.status(429).json({ error: 'too_many_attempts' })
    return
  }

  const config = await getAccessConfig({ fresh: true })
  if (!config.enabled || !config.codeHash) {
    await logAccess(request, 'denied_unavailable', { codeVersion: config.codeVersion })
    response.status(403).json({ error: 'unavailable' })
    return
  }

  if (!code.trim() || code.length > 200 || !(await verifyAccessCode(code, config.codeHash))) {
    const { blocked } = await recordFailedAttempt(request)
    await logAccess(request, 'failure', { codeVersion: config.codeVersion, detail: blocked ? 'address throttled' : null })
    response.status(401).json({ error: 'invalid' })
    return
  }

  await clearFailedAttempts(request)
  const sessionId = randomId()
  const session = await createVisitorSession(request, sessionId, config)
  const token = await signVisitorToken({ sessionId, expiresAt: session.expiresAt, codeVersion: config.codeVersion, epoch: config.epoch })
  await logAccess(request, 'success', { codeVersion: config.codeVersion, session: session.id.slice(0, 10), expiresAt: session.expiresAt })

  response.setHeader('Set-Cookie', cookieHeader(VISITOR_COOKIE, token, SESSION_SECONDS))
  response.status(200).json({ ok: true, expiresAt: session.expiresAt })
}

async function status(request, response) {
  const viewer = await getViewer(request)
  if (viewer) {
    response.status(200).json({ authenticated: true, viewer: viewer.kind, expiresAt: viewer.expiresAt })
    return
  }
  const config = await getAccessConfig()
  response.status(200).json({ authenticated: false, available: config.enabled && !!config.codeHash })
}

async function signOut(request, response) {
  const claims = await readVisitorToken(readCookie(request.headers?.cookie, VISITOR_COOKIE))
  if (claims) {
    const id = await sha256(claims.sessionId)
    await adminDb().collection('visitor_sessions').doc(id).update({ revokedAt: Date.now(), revokedReason: 'signed_out' }).catch(() => {})
    await logAccess(request, 'signed_out', { codeVersion: claims.codeVersion, session: id.slice(0, 10) })
  }
  response.setHeader('Set-Cookie', cookieHeader(VISITOR_COOKIE, '', 0))
  response.status(200).json({ ok: true })
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
