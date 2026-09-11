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

/**
 * Saves a single uploaded image record immediately to Firestore.
 */
export async function saveGalleryImageRecord(img: FirestoreGalleryImage): Promise<void> {
  try {
    const docRef = doc(db, IMAGES_TABLE, img.id)
    await setDoc(docRef, img, { merge: true })

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

    // Count existing image documents for this collection
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
    // Delete by doc ID
    await deleteDoc(doc(db, IMAGES_TABLE, idOrPublicId))

    // Also search by publicId if docId differed
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
 * Completely deletes a collection document and all associated image documents from Firestore.
 */
export async function deleteGalleryCollectionFromFirestore(slug: string): Promise<void> {
  try {
    // 1. Find all image docs for this collection
    const q = query(collection(db, IMAGES_TABLE), where('collectionSlug', '==', slug))
    const snap = await getDocs(q)

    if (!snap.empty) {
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }

    // 2. Delete the collection metadata doc
    await deleteDoc(doc(db, COLLECTIONS_TABLE, slug))
    console.log(`[FirestoreGallery] Permanently deleted collection "${slug}" and ${snap.size} image docs from Firestore.`)
  } catch (err) {
    console.warn('[FirestoreGallery] Error deleting collection from Firestore:', err)
  }
}
