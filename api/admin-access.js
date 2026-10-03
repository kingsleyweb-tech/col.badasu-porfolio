// Admin › Access Control. Admin-only (Firebase ID token of the recorded administrator).
//   GET  /api/admin-access                        status, open sessions and recent activity
//   POST /api/admin-access { action: 'generate' }        new random code (returned once, only here)
//   POST /api/admin-access { action: 'set', code }       administrator-chosen code
//   POST /api/admin-access { action: 'enable' | 'disable' | 'revoke' }
// Changing the code, disabling access and revoking all bump the revocation epoch, which ends every
// visitor session at once; a code change also bumps the code version so the old code stops working.
import {
  SESSION_SECONDS,
  generateAccessCode,
  getAccessConfig,
  hashAccessCode,
  logAccess,
  markActiveSessionsRevoked,
  sessionEndsAt,
  updateAccessConfig,
  weakCodeReason,
  decryptAccessCode,
  encryptAccessCode,
} from './_access.js'
import { requireAdmin } from './_auth.js'
import { adminDb } from './_firebaseAdmin.js'

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store')
  const admin = await requireAdmin(request, response)
  if (!admin) return

  try {
    if (request.method === 'GET') return await overview(response)
    if (request.method === 'POST') return await act(request, response, admin)
    response.setHeader('Allow', 'GET, POST')
    response.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[admin-access] failed', error)
    response.status(503).json({ error: `Access control is temporarily unavailable: ${String(error?.message || error).slice(0, 160)}` })
  }
}

async function overview(response) {
  const db = adminDb()
  const now = Date.now()
  const [config, sessionsSnap, logsSnap] = await Promise.all([
    getAccessConfig({ fresh: true }),
    db.collection('visitor_sessions').where('expiresAt', '>', now - 24 * 3600 * 1000).orderBy('expiresAt', 'desc').limit(100).get(),
    db.collection('access_logs').orderBy('at', 'desc').limit(100).get(),
  ])

  const sessions = sessionsSnap.docs.map((d) => {
    const s = d.data()
    const endsAt = sessionEndsAt(s)
    const valid = !s.revokedAt && endsAt > now && s.codeVersion === config.codeVersion && s.epoch === config.epoch && config.enabled
    return {
      id: d.id.slice(0, 10),
      createdAt: s.createdAt,
      expiresAt: endsAt,
      codeVersion: s.codeVersion,
      ip: s.ip,
      userAgent: s.userAgent,
      status: valid ? 'active' : s.revokedAt ? 'revoked' : endsAt <= now ? 'expired' : 'ended',
      revokedReason: s.revokedReason || (valid || endsAt <= now ? null : 'code changed or access revoked'),
    }
  })

  response.status(200).json({
    enabled: config.enabled,
    hasCode: !!config.codeHash,
    // Only this admin-only, no-store response ever carries the readable code
    code: config.codeHash ? decryptAccessCode(config.codeEncrypted) : null,
    codeVersion: config.codeVersion,
    codeUpdatedAt: config.codeUpdatedAt,
    updatedAt: config.updatedAt,
    sessionSeconds: SESSION_SECONDS,
    activeSessions: sessions.filter((s) => s.status === 'active').length,
    sessions,
    logs: logsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  })
}

async function act(request, response, admin) {
  const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body || {}
  const actor = { by: admin.email || admin.uid }

  if (body.action === 'generate' || body.action === 'set') {
    const code = body.action === 'generate' ? generateAccessCode() : String(body.code || '')
    const weak = body.action === 'set' ? weakCodeReason(code) : null
    if (weak) {
      response.status(400).json({ error: weak })
      return
    }
    const codeHash = await hashAccessCode(code)
    const codeEncrypted = encryptAccessCode(code.trim())
    const revoked = await markActiveSessionsRevoked('code changed')
    const config = await updateAccessConfig((current) => ({
      codeHash,
      codeEncrypted,
      codeVersion: (Number(current.codeVersion) || 0) + 1,
      epoch: (Number(current.epoch) || 0) + 1,
      codeUpdatedAt: new Date().toISOString(),
    }))
    await logAccess(request, 'code_changed', { ...actor, codeVersion: config.codeVersion, detail: `${body.action === 'generate' ? 'generated' : 'set by administrator'}; ${revoked} session(s) ended` })
    // The plain code is returned once so the administrator can copy it; only its hash is stored
    response.status(200).json({ ok: true, code: body.action === 'generate' ? code : undefined, codeVersion: config.codeVersion })
    return
  }

  if (body.action === 'enable' || body.action === 'disable') {
    const enabled = body.action === 'enable'
    const revoked = enabled ? 0 : await markActiveSessionsRevoked('access disabled')
    const config = await updateAccessConfig((current) => ({
      enabled,
      epoch: enabled ? Number(current.epoch) || 0 : (Number(current.epoch) || 0) + 1,
    }))
    await logAccess(request, enabled ? 'access_enabled' : 'access_disabled', { ...actor, codeVersion: config.codeVersion, detail: enabled ? null : `${revoked} session(s) ended` })
    response.status(200).json({ ok: true, enabled: config.enabled })
    return
  }

  if (body.action === 'revoke') {
    const revoked = await markActiveSessionsRevoked('revoked by administrator')
    const config = await updateAccessConfig((current) => ({ epoch: (Number(current.epoch) || 0) + 1 }))
    await logAccess(request, 'sessions_revoked', { ...actor, codeVersion: config.codeVersion, detail: `${revoked} session(s) ended` })
    response.status(200).json({ ok: true, revoked })
    return
  }

  response.status(400).json({ error: 'Unknown action.' })
}
