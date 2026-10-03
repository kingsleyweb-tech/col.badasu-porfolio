// Portfolio access control: access-code hashing, visitor sessions, rate limiting and activity logs.
// Everything here runs server-side with privileged Firestore access. The collections it uses are
// closed to browsers by the Firestore Security Rules:
//
//   access_control/config      { enabled, codeHash, codeVersion, epoch, updatedAt, codeUpdatedAt }
//   visitor_sessions/{id}      { createdAt, expiresAt, codeVersion, epoch, ip, userAgent, revokedAt, revokedReason }
//   access_logs/{auto}         { type, at, ip, userAgent, codeVersion, session, detail }
//   access_rate_limits/{hash}  { failures, windowStart, blockedUntil }
//
// site_meta/access mirrors the non-secret parts ({ enabled, codeVersion, epoch }) so open pages and
// the routing middleware can react to changes. The access code itself is never stored or logged.
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { adminAuth, adminDb } from './_firebaseAdmin.js'
import { ADMIN_COOKIE, VISITOR_COOKIE, readAdminToken, readCookie, readVisitorToken, sha256 } from './_token.js'

export const SESSION_SECONDS = 30 * 60 // exactly 30 minutes from sign-in, never extended
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_MAX_FAILURES = 5
const RATE_BLOCK_MS = 15 * 60 * 1000 // first block; doubles for each further block within a day
const RATE_BLOCK_MAX_MS = 24 * 60 * 60 * 1000
const RATE_STRIKE_RESET_MS = 24 * 60 * 60 * 1000
const CONFIG_CACHE_MS = 3000

const CONFIG_DOC = 'access_control/config'
const META_DOC = 'site_meta/access'

// ─── Access code ───────────────────────────────────────────────────────────────

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O, 1/I/L
const SCRYPT = { N: 32768, r: 8, p: 1, keyLength: 32 }

/** Codes are compared without case, spaces or dashes, so "gaf 7kq4-m9xp 82tr" matches GAF-7KQ4-M9XP-82TR. */
export const normalizeCode = (code) => String(code ?? '').toUpperCase().replace(/[\s-]+/g, '')

/** A random code such as GAF-7KQ4-M9XP-82TR (12 random characters, about 59 bits). */
export function generateAccessCode() {
  const group = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
  return `GAF-${group()}-${group()}-${group()}`
}

const WEAK_PARTS = ['BADASU', 'HENRY', 'KWAKU', 'COLONEL', 'PASSWORD', 'PORTFOLIO', 'ADMIN', 'QWERTY', '123456', '654321', 'ABCDEF']

/** Returns an error message for a weak administrator-chosen code, or null. */
export function weakCodeReason(code) {
  const normalized = normalizeCode(code)
  if (normalized.length < 10) return 'Use at least 10 characters (not counting spaces or dashes).'
  if (normalized.length > 64) return 'Use at most 64 characters.'
  if (!/[A-Z]/.test(normalized) || !/[0-9]/.test(normalized)) return 'Mix letters and numbers.'
  if (new Set(normalized).size < 6) return 'Use more varied characters.'
  if (WEAK_PARTS.some((part) => normalized.includes(part))) return 'Avoid names, ranks, common words and simple sequences.'
  if (/(\d)\1{3,}|([A-Z])\2{3,}/.test(normalized)) return 'Avoid repeated characters.'
  if (/(19|20)\d{2}/.test(normalized) && normalized.replace(/\d/g, '').length < 6) return 'Avoid dates and years.'
  return null
}

function scryptAsync(secret, salt, keyLength, options) {
  return new Promise((resolve, reject) => scrypt(secret, salt, keyLength, options, (err, key) => (err ? reject(err) : resolve(key))))
}

export async function hashAccessCode(code) {
  const salt = randomBytes(16)
  const { N, r, p, keyLength } = SCRYPT
  const key = await scryptAsync(normalizeCode(code), salt, keyLength, { N, r, p, maxmem: 128 * N * r * 2 })
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyAccessCode(code, stored) {
  const [scheme, N, r, p, saltB64, keyB64] = String(stored || '').split('$')
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64')
  const options = { N: Number(N), r: Number(r), p: Number(p), maxmem: 128 * Number(N) * Number(r) * 2 }
  const actual = await scryptAsync(normalizeCode(code), Buffer.from(saltB64, 'base64'), expected.length, options)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// ─── Viewable copy for the administrator ───────────────────────────────────────
// Visitors' entries are checked against the hash above. So the administrator can always see and
// copy the current code, it is also kept encrypted (AES-256-GCM, key derived from
// ACCESS_SESSION_SECRET). Firestore never holds it in plain text; only the admin API decrypts it.

function codeKey() {
  const secret = process.env.ACCESS_SESSION_SECRET || ''
  if (secret.length < 32) throw new Error('ACCESS_SESSION_SECRET is missing or too short.')
  return Buffer.from(hkdfSync('sha256', secret, 'portfolio-access-code', 'v1', 32))
}

export function encryptAccessCode(code) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', codeKey(), iv)
  const data = Buffer.concat([cipher.update(String(code), 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join('.')
}

/** Returns the code, or null when it cannot be decrypted (older code, or the secret changed). */
export function decryptAccessCode(stored) {
  try {
    const [version, iv, tag, data] = String(stored || '').split('.')
    if (version !== 'v1') return null
    const decipher = createDecipheriv('aes-256-gcm', codeKey(), Buffer.from(iv, 'base64'))
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

// ─── Configuration ─────────────────────────────────────────────────────────────

let configCache = null

export async function getAccessConfig({ fresh = false } = {}) {
  if (!fresh && configCache && Date.now() - configCache.at < CONFIG_CACHE_MS) return configCache.config
  const snap = await adminDb().doc(CONFIG_DOC).get()
  const data = snap.exists ? snap.data() : {}
  const config = {
    enabled: data.enabled !== false,
    codeHash: data.codeHash || null,
    codeEncrypted: data.codeEncrypted || null,
    codeVersion: Number(data.codeVersion) || 0,
    epoch: Number(data.epoch) || 0,
    updatedAt: data.updatedAt || null,
    codeUpdatedAt: data.codeUpdatedAt || null,
  }
  configCache = { at: Date.now(), config }
  return config
}

/** Applies a change to the configuration and mirrors the public counters to site_meta/access. */
export async function updateAccessConfig(changes) {
  const db = adminDb()
  const now = new Date().toISOString()
  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(db.doc(CONFIG_DOC))
    const current = snap.exists ? snap.data() : {}
    const merged = {
      enabled: current.enabled !== false,
      codeHash: current.codeHash || null,
      codeEncrypted: current.codeEncrypted || null,
      codeVersion: Number(current.codeVersion) || 0,
      epoch: Number(current.epoch) || 0,
      codeUpdatedAt: current.codeUpdatedAt || null,
      ...changes(current),
      updatedAt: now,
    }
    tx.set(db.doc(CONFIG_DOC), merged)
    tx.set(db.doc(META_DOC), { enabled: merged.enabled && !!merged.codeHash, codeVersion: merged.codeVersion, epoch: merged.epoch, updatedAt: now })
    return merged
  })
  configCache = null
  return next
}

// ─── Request details ───────────────────────────────────────────────────────────

const header = (request, name) => {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value || ''
}

/** On Vercel both headers are set by the platform from the connecting address. */
export function clientIp(request) {
  return (header(request, 'x-real-ip') || header(request, 'x-forwarded-for').split(',')[0] || 'unknown').trim()
}

/** The first four groups (the /64 network) of an IPv6 address, with "::" expanded; null if not IPv6. */
function ipv6Network(ip) {
  if (!ip.includes(':')) return null
  const [head, tail = ''] = ip.split('%')[0].toLowerCase().split('::')
  const left = head ? head.split(':') : []
  const right = ip.includes('::') && tail ? tail.split(':') : []
  const groups = ip.includes('::') ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left
  return groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')
}

/** Stored in logs instead of the full address: 203.0.113.57 → 203.0.113.0, IPv6 → its /64 network. */
export function maskIp(ip) {
  const v4 = ip.replace(/^::ffff:/i, '')
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return v4.replace(/\.\d+$/, '.0')
  const net = ipv6Network(ip)
  return net ? `${net}::` : 'unknown'
}

/** What the rate limit counts against: one IPv4 address, or one IPv6 /64 (a single subscriber's block). */
function rateKey(ip) {
  const v4 = ip.replace(/^::ffff:/i, '')
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return v4
  return ipv6Network(ip) ? `${ipv6Network(ip)}::/64` : ip
}

export const userAgent = (request) => header(request, 'user-agent').slice(0, 200)

// ─── Activity log ──────────────────────────────────────────────────────────────

export async function logAccess(request, type, details = {}) {
  try {
    await adminDb().collection('access_logs').add({
      type,
      at: new Date().toISOString(),
      ip: request ? maskIp(clientIp(request)) : null,
      userAgent: request ? userAgent(request) : null,
      ...details,
    })
  } catch (error) {
    console.error('[access] could not write log', error)
  }
}

// ─── Rate limiting (per network address) ───────────────────────────────────────

async function rateDoc(request) {
  return adminDb().collection('access_rate_limits').doc(await sha256(`rate:${rateKey(clientIp(request))}`))
}

/**
 * Claims one attempt for the address before the code is checked, in a transaction, so parallel
 * requests cannot all slip past the limit while the (deliberately slow) check runs. Returns
 * { wait } in seconds when the address is blocked, otherwise { wait: 0, attempt, blocked } where
 * `blocked` means this attempt used up the window. Each block in a day lasts twice as long as the
 * one before (15 min, 30 min, 1 h … up to 24 h). A correct code clears the record.
 */
export async function reserveAttempt(request) {
  const ref = await rateDoc(request)
  const now = Date.now()
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.exists ? snap.data() : {}
    const blockedUntil = Number(data.blockedUntil) || 0
    if (blockedUntil > now) return { wait: Math.ceil((blockedUntil - now) / 1000) }

    const inWindow = now - (Number(data.windowStart) || 0) < RATE_WINDOW_MS
    const attempt = (inWindow ? Number(data.failures) || 0 : 0) + 1
    const recentStrikes = now - (Number(data.strikesAt) || 0) < RATE_STRIKE_RESET_MS ? Number(data.strikes) || 0 : 0
    const blocked = attempt >= RATE_MAX_FAILURES
    const strikes = blocked ? recentStrikes + 1 : recentStrikes
    tx.set(ref, {
      failures: blocked ? 0 : attempt,
      windowStart: inWindow && !blocked ? data.windowStart : now,
      blockedUntil: blocked ? now + Math.min(RATE_BLOCK_MS * 2 ** recentStrikes, RATE_BLOCK_MAX_MS) : 0,
      strikes,
      strikesAt: blocked ? now : Number(data.strikesAt) || 0,
      updatedAt: new Date(now).toISOString(),
    })
    return { wait: 0, attempt, blocked }
  })
}

/** A short pause after a wrong code that grows with each attempt in the window (plus jitter). */
export const failureDelay = (attempt) => new Promise((resolve) => setTimeout(resolve, Math.min(attempt * 300, 1500) + randomInt(250)))

export async function clearFailedAttempts(request) {
  await (await rateDoc(request)).delete().catch(() => {})
}

// ─── Visitor sessions ──────────────────────────────────────────────────────────

export async function createVisitorSession(request, sessionId, config) {
  const createdAt = Date.now()
  const expiresAt = createdAt + SESSION_SECONDS * 1000
  const id = await sha256(sessionId)
  await adminDb().collection('visitor_sessions').doc(id).set({
    createdAt,
    expiresAt,
    codeVersion: config.codeVersion,
    epoch: config.epoch,
    ip: maskIp(clientIp(request)),
    userAgent: userAgent(request),
    revokedAt: null,
    revokedReason: null,
  })
  return { id, createdAt, expiresAt }
}

/**
 * When a session ends: its stored expiry, but never later than SESSION_SECONDS after it started,
 * so sessions issued under a longer earlier limit end on the current one.
 */
export const sessionEndsAt = (session) => Math.min(Number(session.expiresAt) || 0, (Number(session.createdAt) || 0) + SESSION_SECONDS * 1000)

/** Marks every session that has not expired yet as revoked (for the activity view). */
export async function markActiveSessionsRevoked(reason) {
  const db = adminDb()
  const now = Date.now()
  const snap = await db.collection('visitor_sessions').where('expiresAt', '>', now).get()
  const open = snap.docs.filter((d) => !d.data().revokedAt)
  for (let i = 0; i < open.length; i += 400) {
    const batch = db.batch()
    open.slice(i, i + 400).forEach((d) => batch.update(d.ref, { revokedAt: now, revokedReason: reason }))
    await batch.commit()
  }
  return open.length
}

/**
 * Who is asking for protected data: a visitor with a valid session, or the signed-in administrator.
 * Returns null when neither applies. Visitor sessions are checked against the stored session, the
 * current access-code version, the revocation epoch, the enabled switch and the absolute
 * 30-minute expiry (counted from sign-in; activity never extends it).
 */
export async function getViewer(request) {
  const cookies = header(request, 'cookie')

  // Admin dashboard requests carry the administrator's Firebase ID token
  const bearer = header(request, 'authorization')
  if (bearer.startsWith('Bearer ')) {
    const decoded = await adminAuth().verifyIdToken(bearer.slice(7).trim()).catch(() => null)
    const account = decoded ? await adminDb().doc('portfolio/admin_account').get() : null
    if (decoded && account?.exists && account.data().uid === decoded.uid) return { kind: 'admin', uid: decoded.uid, expiresAt: decoded.exp * 1000 }
  }

  const admin = await readAdminToken(readCookie(cookies, ADMIN_COOKIE))
  if (admin) {
    const account = await adminDb().doc('portfolio/admin_account').get()
    if (account.exists && account.data().uid === admin.uid) return { kind: 'admin', uid: admin.uid, expiresAt: admin.expiresAt }
  }

  const claims = await readVisitorToken(readCookie(cookies, VISITOR_COOKIE))
  if (!claims) return null
  const config = await getAccessConfig()
  if (!config.enabled || !config.codeHash) return null
  if (claims.codeVersion !== config.codeVersion || claims.epoch !== config.epoch) return null

  const id = await sha256(claims.sessionId)
  const snap = await adminDb().collection('visitor_sessions').doc(id).get()
  if (!snap.exists) return null
  const session = snap.data()
  const endsAt = Math.min(sessionEndsAt(session), claims.expiresAt)
  if (session.revokedAt || endsAt <= Date.now()) return null
  return { kind: 'visitor', sessionId: id, expiresAt: endsAt }
}

/** Sends 401 (and no data) unless the request comes from a visitor session or the administrator. */
export async function requireViewer(request, response) {
  response.setHeader('Cache-Control', 'private, no-store')
  response.setHeader('Vary', 'Cookie')
  try {
    const viewer = await getViewer(request)
    if (viewer) return viewer
    response.status(401).json({ error: 'access_required' })
  } catch (error) {
    console.error('[access] viewer check failed', error)
    response.status(503).json({ error: 'unavailable' })
  }
  return null
}

