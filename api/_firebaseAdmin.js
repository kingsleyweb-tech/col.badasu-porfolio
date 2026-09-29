// Privileged Firebase access for the serverless functions (never bundled into the browser).
//
// Production (Vercel): FIREBASE_SERVICE_ACCOUNT holds the service-account key JSON (raw or base64).
// Local: FIREBASE_SERVICE_ACCOUNT_FILE may instead point to the downloaded key file (gitignored).
// Testing: with FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST set, the emulators are used.
import { readFileSync } from 'node:fs'
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export class NotConfiguredError extends Error {
  constructor(message = 'Server access to Firebase is not configured (FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_FILE).') {
    super(message)
  }
}

/** Line breaks pasted inside JSON strings (common with the private key) are not valid JSON; escape them. */
function escapeNewlinesInStrings(text) {
  let out = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inString && ch === '\\') {
      out += ch + (text[i + 1] ?? '')
      i++
    } else if (ch === '"') {
      inString = !inString
      out += ch
    } else if (inString && ch === '\n') {
      out += '\\n'
    } else if (!(inString && ch === '\r')) {
      out += ch
    }
  }
  return out
}

function readServiceAccount() {
  const file = (process.env.FIREBASE_SERVICE_ACCOUNT_FILE || '').trim()
  let raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (!raw && file) {
    // The key file exists only on a local machine; on Vercel the key must be in FIREBASE_SERVICE_ACCOUNT
    try {
      raw = readFileSync(file, 'utf8').trim()
    } catch {
      throw new NotConfiguredError(`FIREBASE_SERVICE_ACCOUNT is not set and the key file "${file}" is not on this server: paste the whole key file contents into FIREBASE_SERVICE_ACCOUNT.`)
    }
  }
  if (!raw) return null
  // Tolerate the value being wrapped in quotes when pasted
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"{') && raw.endsWith('}"'))) raw = raw.slice(1, -1).trim()
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')

  let account
  try {
    account = JSON.parse(escapeNewlinesInStrings(json))
  } catch {
    throw new NotConfiguredError('FIREBASE_SERVICE_ACCOUNT could not be read: paste the whole key file contents, from { to }.')
  }
  if (!account.private_key || !account.client_email) {
    throw new NotConfiguredError('FIREBASE_SERVICE_ACCOUNT is missing private_key or client_email: paste the whole key file contents.')
  }
  // Keys pasted into env settings often carry literal "\n" sequences
  account.private_key = account.private_key.replace(/\\n/g, '\n')
  return account
}

function adminApp() {
  if (getApps().length) return getApp()
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
  const account = readServiceAccount()
  if (account) return initializeApp({ credential: cert(account), projectId: account.project_id || projectId })
  if (process.env.FIRESTORE_EMULATOR_HOST) return initializeApp({ projectId })
  throw new NotConfiguredError()
}

export const adminDb = () => getFirestore(adminApp())
export const adminAuth = () => getAuth(adminApp())
