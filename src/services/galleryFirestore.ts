import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface FirestoreGalleryImage {
  id: string
  publicId: string
  collectionSlug: string
  collectionName: string
  title: string
  alt: string
  url: string
  thumbnailUrl: string
  largeUrl: string
  width?: number
  height?: number
  order: number
  uploadedAt: number
}

export interface FirestoreGalleryCollection {
  slug: string
  name: string
  description?: string
  count: number
  coverImage?: {
    thumbnailUrl: string
    alt: string
  }
  updatedAt: number
}

const COLLECTIONS_TABLE = 'gallery_collections'
const IMAGES_TABLE = 'gallery_images'
const DELETED_COLLECTIONS_TABLE = 'deleted_collections'

/**
 * Saves a single uploaded image record immediately to Firestore.
 */
export async function saveGalleryImageRecord(img: FirestoreGalleryImage): Promise<void> {
  try {
    const docRef = doc(db, IMAGES_TABLE, img.id)
    await setDoc(docRef, img, { merge: true })

    // Remove from deleted list if re-created
    try {
      await deleteDoc(doc(db, DELETED_COLLECTIONS_TABLE, img.collectionSlug))
    } catch {
      // ignore
    }

    // Also update/touch collection document metadata
    await updateCollectionMetadata(img.collectionSlug, img.collectionName, img.thumbnailUrl, img.alt)
  } catch (err) {
    console.warn('[FirestoreGallery] Error saving image record to Firestore:', err)
  }
}

/**
 * Updates collection metadata in Firestore (count, cover image, updatedAt timestamp).
 */
export async function updateCollectionMetadata(
  slug: string,
  name: string,
  coverThumbnailUrl?: string,
  coverAlt?: string
): Promise<void> {
  try {
    const colDocRef = doc(db, COLLECTIONS_TABLE, slug)
    const snap = await getDoc(colDocRef)
    const existing = snap.exists() ? (snap.data() as FirestoreGalleryCollection) : null

    const q = query(collection(db, IMAGES_TABLE), where('collectionSlug', '==', slug))
    const imagesSnap = await getDocs(q)
    const currentCount = imagesSnap.size

    const updatedCol: FirestoreGalleryCollection = {
      slug,
      name: existing?.name || name,
      count: currentCount,
      coverImage: coverThumbnailUrl
        ? { thumbnailUrl: coverThumbnailUrl, alt: coverAlt || name }
        : existing?.coverImage,
      updatedAt: Date.now()
    }

    await setDoc(colDocRef, updatedCol, { merge: true })
  } catch (err) {
    console.warn('[FirestoreGallery] Error updating collection metadata:', err)
  }
}

/**
 * Fetches all Firestore gallery collection records.
 */
export async function fetchFirestoreCollections(): Promise<FirestoreGalleryCollection[]> {
  try {
    const colSnap = await getDocs(collection(db, COLLECTIONS_TABLE))
    return colSnap.docs.map((d) => d.data() as FirestoreGalleryCollection)
  } catch (err) {
    console.warn('[FirestoreGallery] Error fetching collections:', err)
    return []
  }
}

/**
 * Fetches set of collection slugs that have been permanently deleted.
 */
export async function fetchDeletedCollectionSlugs(): Promise<Set<string>> {
  try {
    const snap = await getDocs(collection(db, DELETED_COLLECTIONS_TABLE))
    const set = new Set<string>()
    snap.docs.forEach((d) => set.add(d.id.toLowerCase()))
    return set
  } catch (err) {
    console.warn('[FirestoreGallery] Error fetching deleted collections set:', err)
    return new Set()
  }
}

/**
 * Marks a collection slug as permanently deleted in Firestore.
 */
export async function markCollectionDeletedInFirestore(slug: string): Promise<void> {
  try {
    const docRef = doc(db, DELETED_COLLECTIONS_TABLE, slug.toLowerCase())
    await setDoc(docRef, { slug: slug.toLowerCase(), deletedAt: Date.now() })
  } catch (err) {
    console.warn('[FirestoreGallery] Error marking collection deleted:', err)
  }
}

/**
 * Fetches all images belonging to a specific collection slug from Firestore.
 */
export async function fetchFirestoreGalleryImages(collectionSlug: string): Promise<FirestoreGalleryImage[]> {
  try {
    const q = query(collection(db, IMAGES_TABLE), where('collectionSlug', '==', collectionSlug))
    const snap = await getDocs(q)
    const list = snap.docs.map((d) => d.data() as FirestoreGalleryImage)
    return list.sort((a, b) => (a.order || 0) - (b.order || 0))
  } catch (err) {
    console.warn('[FirestoreGallery] Error fetching gallery images:', err)
    return []
  }
}

/**
 * Deletes a single image record from Firestore.
 */
export async function deleteGalleryImageFromFirestore(idOrPublicId: string, collectionSlug?: string): Promise<void> {
  try {
    await deleteDoc(doc(db, IMAGES_TABLE, idOrPublicId))

    const q = query(collection(db, IMAGES_TABLE), where('publicId', '==', idOrPublicId))
    const snap = await getDocs(q)
    if (!snap.empty) {
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }

    if (collectionSlug) {
      await updateCollectionMetadata(collectionSlug, collectionSlug)
    }
  } catch (err) {
    console.warn('[FirestoreGallery] Error deleting gallery image doc:', err)
  }
}

/**
 * Completely deletes a collection document and all associated image documents from Firestore,
 * and records its slug in deleted_collections set.
 */
export async function deleteGalleryCollectionFromFirestore(slug: string): Promise<void> {
  try {
    const normalizedSlug = slug.toLowerCase()

    // 1. Mark as deleted in Firestore
    await markCollectionDeletedInFirestore(normalizedSlug)

    // 2. Find and delete all image docs for this collection
    const q = query(collection(db, IMAGES_TABLE), where('collectionSlug', '==', slug))
    const snap = await getDocs(q)

    if (!snap.empty) {
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }

    // 3. Delete the collection metadata doc
    await deleteDoc(doc(db, COLLECTIONS_TABLE, slug))
    console.log(`[FirestoreGallery] Permanently deleted collection "${slug}" and ${snap.size} image docs from Firestore.`)
  } catch (err) {
    console.warn('[FirestoreGallery] Error deleting collection from Firestore:', err)
  }
}
