// Admin check for the admin-only endpoints (files starting with "_" are not routes on Vercel).
//
// The caller sends its Firebase ID token as "Authorization: Bearer <token>". Firebase verifies the
// token (signature, expiry, revocation), and the account must be the one recorded as the
// administrator in portfolio/admin_account. The visitor access code never passes this check.
import { adminAuth, adminDb, NotConfiguredError } from './_firebaseAdmin.js'

export async function requireAdmin(request, response) {
  const header = request.headers?.authorization || request.headers?.Authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    response.status(401).json({ error: 'Sign in to the admin dashboard to do this.' })
    return null
  }

  try {
    let decoded
    try {
      decoded = await adminAuth().verifyIdToken(token, true)
    } catch (error) {
      if (error instanceof NotConfiguredError) throw error
      response.status(401).json({ error: 'Your admin session has expired. Sign in again.' })
      return null
    }
    const account = await adminDb().doc('portfolio/admin_account').get()
    if (!account.exists || account.data().uid !== decoded.uid) {
      response.status(403).json({ error: 'This account is not the portfolio administrator.' })
      return null
    }
    return decoded
  } catch (error) {
    if (error instanceof NotConfiguredError) {
      console.error('[admin] ' + error.message)
      response.status(503).json({ error: 'setup_required', message: 'The server has no Firebase service-account key yet, so it cannot run admin actions.' })
      return null
    }
    console.error('Admin check failed', error)
    response.status(503).json({ error: 'Could not verify the admin session. Try again.' })
    return null
  }
}
