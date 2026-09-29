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
  constructor() {
    super('Server access to Firebase is not configured (FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_FILE).')
  }
}

function readServiceAccount() {
  const file = (process.env.FIREBASE_SERVICE_ACCOUNT_FILE || '').trim()
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || (file ? readFileSync(file, 'utf8') : '')).trim()
  if (!raw) return null
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  const account = JSON.parse(json)
  // Keys pasted into env settings often carry literal "\n" sequences
  if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n')
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
