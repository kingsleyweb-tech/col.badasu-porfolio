// Shared admin check for the write endpoints (files starting with "_" are not routes on Vercel).
//
// The caller sends its Firebase ID token as "Authorization: Bearer <token>". The token is verified
// by Firebase itself (accounts:lookup rejects forged or expired tokens), and the signed-in account
// must be the one recorded as the administrator in portfolio/admin_account. That document is read
// with the caller's own token, so Firestore Security Rules apply to the check as well.

export async function requireAdmin(request, response) {
  const header = request.headers?.authorization || request.headers?.Authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID

  if (!apiKey || !projectId) {
    response.status(503).json({ error: 'Firebase is not configured on the server.' })
    return false
  }
  if (!token) {
    response.status(401).json({ error: 'Sign in to the admin dashboard to do this.' })
    return false
  }

  try {
    const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    })
    if (!lookup.ok) {
      response.status(401).json({ error: 'Your admin session has expired. Sign in again.' })
      return false
    }
    const uid = (await lookup.json()).users?.[0]?.localId

    const account = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/portfolio/admin_account`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const adminUid = account.ok ? (await account.json()).fields?.uid?.stringValue : undefined

    if (!uid || !adminUid || uid !== adminUid) {
      response.status(403).json({ error: 'This account is not the portfolio administrator.' })
      return false
    }
    return true
  } catch (error) {
    console.error('Admin check failed', error)
    response.status(503).json({ error: 'Could not verify the admin session. Try again.' })
    return false
  }
}
