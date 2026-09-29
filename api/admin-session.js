// Lets the signed-in administrator view the protected portfolio (and its photos) without the
// visitor access code. Visitors can never obtain this cookie: it is only issued after the
// administrator's Firebase ID token passes requireAdmin().
//   POST   /api/admin-session   (Bearer ID token) sets pf_admin for 12 hours
//   DELETE /api/admin-session   clears it (on admin sign-out)
import { requireAdmin } from './_auth.js'
import { ADMIN_COOKIE, cookieHeader, sessionSecret, signAdminToken } from './_token.js'

const ADMIN_COOKIE_SECONDS = 12 * 60 * 60

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store')

  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', cookieHeader(ADMIN_COOKIE, '', 0))
    response.status(200).json({ ok: true })
    return
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, DELETE')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!sessionSecret()) {
    response.status(503).json({ error: 'ACCESS_SESSION_SECRET is not configured.' })
    return
  }

  const admin = await requireAdmin(request, response)
  if (!admin) return

  const expiresAt = Date.now() + ADMIN_COOKIE_SECONDS * 1000
  response.setHeader('Set-Cookie', cookieHeader(ADMIN_COOKIE, await signAdminToken({ uid: admin.uid, expiresAt }), ADMIN_COOKIE_SECONDS))
  response.status(200).json({ ok: true, expiresAt })
}
