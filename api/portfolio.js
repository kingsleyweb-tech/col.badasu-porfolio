// GET /api/portfolio: the portfolio content, only for a valid visitor session or the administrator.
// Browsers cannot read portfolio/portfolio_main directly (Firestore Security Rules); this endpoint
// is the only way the public pages receive it, and never from a shared cache.
import { requireViewer } from './_access.js'
import { adminDb } from './_firebaseAdmin.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const viewer = await requireViewer(request, response)
  if (!viewer) return

  try {
    const snap = await adminDb().doc('portfolio/portfolio_main').get()
    const data = snap.exists ? snap.data() : {}
    delete data.updatedAt
    response.status(200).json({ data, session: { kind: viewer.kind, expiresAt: viewer.expiresAt } })
  } catch (error) {
    console.error('[portfolio] read failed', error)
    response.status(503).json({ error: 'unavailable' })
  }
}
