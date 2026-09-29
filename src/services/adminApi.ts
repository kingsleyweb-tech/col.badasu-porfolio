import { auth } from '../lib/firebase'

/**
 * fetch() for the admin-only endpoints (/api/upload, /api/delete-image, /api/delete-collection).
 * Sends the signed-in administrator's Firebase ID token, which the server verifies before
 * touching Cloudinary.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await auth.currentUser?.getIdToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}
