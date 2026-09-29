// Signed session cookies, shared by the serverless functions and the routing middleware.
// Uses only Web Crypto so it runs in both the Node and Edge runtimes.
//
// Visitor cookie  pf_access = v1.<sessionId>.<expiresAt>.<codeVersion>.<epoch>.<signature>
// Admin cookie    pf_admin  = a1.<uid>.<expiresAt>.<signature>
// The signature is HMAC-SHA256 with ACCESS_SESSION_SECRET, so a cookie cannot be forged or altered.

export const VISITOR_COOKIE = 'pf_access'
export const ADMIN_COOKIE = 'pf_admin'

const encoder = new TextEncoder()
let cachedKey = null
let cachedSecret = null

function b64url(bytes) {
  let binary = ''
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function sessionSecret() {
  const secret = process.env.ACCESS_SESSION_SECRET || ''
  return secret.length >= 32 ? secret : ''
}

async function hmacKey() {
  const secret = sessionSecret()
  if (!secret) throw new Error('ACCESS_SESSION_SECRET is missing or shorter than 32 characters.')
  if (cachedKey && cachedSecret === secret) return cachedKey
  cachedKey = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  cachedSecret = secret
  return cachedKey
}

async function sign(payload) {
  return b64url(await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(payload)))
}

/** Constant-time comparison of two strings. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function randomId(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)))
}

export async function sha256(value) {
  return b64url(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
}

export async function signVisitorToken({ sessionId, expiresAt, codeVersion, epoch }) {
  const payload = `v1.${sessionId}.${expiresAt}.${codeVersion}.${epoch}`
  return `${payload}.${await sign(payload)}`
}

export async function signAdminToken({ uid, expiresAt }) {
  const payload = `a1.${uid}.${expiresAt}`
  return `${payload}.${await sign(payload)}`
}

/** Returns the claims of a valid, unexpired visitor cookie, or null. */
export async function readVisitorToken(token, now = Date.now()) {
  const parts = typeof token === 'string' ? token.split('.') : []
  if (parts.length !== 6 || parts[0] !== 'v1') return null
  const [, sessionId, exp, version, epoch, signature] = parts
  if (!safeEqual(signature, await sign(parts.slice(0, 5).join('.')))) return null
  const expiresAt = Number(exp)
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null
  return { sessionId, expiresAt, codeVersion: Number(version), epoch: Number(epoch) }
}

/** Returns the claims of a valid, unexpired admin cookie, or null. */
export async function readAdminToken(token, now = Date.now()) {
  const parts = typeof token === 'string' ? token.split('.') : []
  if (parts.length !== 4 || parts[0] !== 'a1') return null
  const [, uid, exp, signature] = parts
  if (!safeEqual(signature, await sign(parts.slice(0, 3).join('.')))) return null
  const expiresAt = Number(exp)
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null
  return { uid, expiresAt }
}

export function readCookie(header, name) {
  for (const part of (header || '').split(';')) {
    const index = part.indexOf('=')
    if (index > -1 && part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim())
  }
  return ''
}

export function cookieHeader(name, value, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : ''
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}${secure}`
}
