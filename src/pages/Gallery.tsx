import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronRight, ImageIcon, Images, Info, Loader2, RefreshCw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'
import { BackButton } from '../components/BackButton'
import { SectionHeading } from '../components/SectionHeading'
import { officer } from '../data/officerData'
import { PageHero } from './Biography'
import { resolveImageUrl } from '../utils/imageResolver'

type GalleryCollection = {
  slug: string
  name: string
  count?: number
  coverImage?: GalleryImage
  updatedAt?: string
}

type GalleryImage = {
  id: string
  publicId?: string
  title: string
  alt: string
  thumbnailUrl: string
  largeUrl: string
  width?: number
  height?: number
}

type GalleryResponse =
  | { collections: GalleryCollection[] }
  | { collection: GalleryCollection; images: GalleryImage[]; nextCursor?: string }

export function Gallery() {
  const { collectionSlug } = useParams()

  if (collectionSlug) {
    return <GalleryCollectionView collectionSlug={collectionSlug} />
  }

  return <GalleryCollectionsView />
}

// ─── Collections List ────────────────────────────────────────────────────────

function GalleryCollectionsView() {
  const [collections, setCollections] = useState<GalleryCollection[]>([])
  // DISTINCT states: loading | ready | error — never conflated
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const loadCollections = useCallback(() => {
    setStatus('loading')
    let active = true

    fetchGalleryWithRetry()
      .then((data) => {
        if (!active) return
        if ('collections' in data && Array.isArray(data.collections)) {
          setCollections(data.collections)
        }
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!active) return
        console.warn('[Gallery] Failed to load collections after retries.', error)
        setStatus('error')
      })

    return () => { active = false }
  }, [])

  useEffect(() => {
    return loadCollections()
  }, [loadCollections])

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Gallery"
        description="A visual journey through Colonel Badasu's military career, professional service, international assignments, leadership, training, and distinguished moments."
      />
      <section className="section">
        <div className="container">
          <BackButton />
          <SectionHeading eyebrow="Collections" title="Military Career Archive" />

          {/* LOADING — shown only while fetching */}
          {status === 'loading' && (
            <GalleryNotice icon="loading" text="Preparing gallery collections..." />
          )}

          {/* ERROR — shown only on actual failure, with Retry button */}
          {status === 'error' && (
            <div className="gallery-notice gallery-notice--error" role="alert">
              <ImageIcon size={19} aria-hidden="true" />
              <span>Gallery collections are temporarily unavailable.</span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={loadCollections}
                style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {/* SUCCESS — only shown when status is 'ready' */}
          {status === 'ready' && (
            <>
              {/* EMPTY — only shown when successfully loaded but nothing returned */}
              {collections.length === 0 ? (
                <GalleryNotice text="No collections have been published yet." />
              ) : (
                <div className="gallery-album-list" aria-label="Gallery collections">
                  {collections.map((col) => (
                    <Link
                      className="gallery-album-row"
                      key={col.slug}
                      to={`/gallery/${col.slug}`}
                      aria-label={`Open ${col.name} collection`}
                    >
                      {/* Thumbnail */}
                      <span className="gallery-album-row__thumb">
                        {col.coverImage ? (
                          <GalleryThumbnail
                            src={resolveImageUrl(col.coverImage.thumbnailUrl)}
                            alt={col.coverImage.alt ?? col.name}
                          />
                        ) : (
                          <span className="gallery-image-fallback" aria-hidden="true">
                            <ImageIcon size={26} />
                          </span>
                        )}
                      </span>

                      {/* Info */}
                      <span className="gallery-album-row__info">
                        <strong className="gallery-album-row__title">{col.name}</strong>
                        <span className="gallery-album-row__meta">
                          <span className="gallery-album-row__count">
                            <Images size={13} aria-hidden="true" />
                            {typeof col.count === 'number'
                              ? `${col.count} image${col.count === 1 ? '' : 's'}`
                              : 'No images yet'}
                          </span>
                          {col.updatedAt && (
                            <span className="gallery-album-row__date">
                              <CalendarDays size={13} aria-hidden="true" />
                              Last updated: {col.updatedAt}
                            </span>
                          )}
                        </span>
                      </span>

                      {/* Arrow */}
                      <ChevronRight className="gallery-album-row__chevron" size={20} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}

              {collections.length > 0 && (
                <p className="gallery-album-hint">
                  <Info size={15} aria-hidden="true" />
                  Tap on a collection to view photographs.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}

// ─── Single Collection View ───────────────────────────────────────────────────

function GalleryCollectionView({ collectionSlug }: { collectionSlug: string }) {
  const navigate = useNavigate()
  const [collection, setCollection] = useState<GalleryCollection | undefined>()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const loadCollection = useCallback(() => {
    setStatus('loading')
    setImages([])
    setCollection(undefined)
    setNextCursor(undefined)
    let active = true

    fetchGalleryWithRetry(`collection=${encodeURIComponent(collectionSlug)}`)
      .then((data) => {
        if (!active) return
        if ('collection' in data) {
          setCollection(data.collection)
          setImages(data.images ?? [])
          setNextCursor(data.nextCursor)
        }
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!active) return
        console.warn('[Gallery] Failed to load collection:', collectionSlug, error)
        setStatus('error')
      })

    return () => { active = false }
  }, [collectionSlug])

  useEffect(() => {
    return loadCollection()
  }, [loadCollection])

  const slides = useMemo(() => images.map((img) => ({
    src: resolveImageUrl(img.largeUrl),
    alt: img.alt,
    title: img.title,
    width: img.width,
    height: img.height
  })), [images])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchGalleryWithRetry(
        `collection=${encodeURIComponent(collectionSlug)}&cursor=${encodeURIComponent(nextCursor)}`
      )
      if ('collection' in data) {
        setImages((prev) => [...prev, ...(data.images ?? [])])
        setNextCursor(data.nextCursor)
      }
    } catch (error) {
      console.warn('[Gallery] Unable to load more gallery images.', error)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Gallery Collection"
        title={collection?.name ?? 'Gallery Collection'}
        description={`Selected photographs from ${officer.rank} ${officer.name}'s professional archive.`}
      />
      <section className="section">
        <div className="container">
          <button className="back-button" type="button" onClick={() => navigate('/gallery')}>
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Back to Gallery</span>
          </button>

          <div className="gallery-collection-header">
            <SectionHeading eyebrow="Photographs" title={collection?.name ?? 'Collection'} />
            {typeof collection?.count === 'number' && (
              <p>{collection.count} {collection.count === 1 ? 'Photo' : 'Photos'}</p>
            )}
          </div>

          {/* LOADING */}
          {status === 'loading' && (
            <GalleryNotice icon="loading" text="Loading collection photographs..." />
          )}

          {/* ERROR with retry */}
          {status === 'error' && (
            <div className="gallery-notice gallery-notice--error" role="alert">
              <ImageIcon size={19} aria-hidden="true" />
              <span>This gallery collection is temporarily unavailable.</span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={loadCollection}
                style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {/* EMPTY — only when loaded but no images */}
          {status === 'ready' && images.length === 0 && (
            <GalleryNotice text="No photographs in this collection yet." />
          )}

          {/* Photo grid — visible even while loading more */}
          {images.length > 0 && (
            <div className="gallery-photo-grid" aria-label={`${collection?.name ?? 'Gallery'} photographs`}>
              {images.map((image, imageIndex) => (
                <GalleryPhoto
                  key={image.id}
                  image={image}
                  onClick={() => setLightboxIndex(imageIndex)}
                />
              ))}
            </div>
          )}

          {nextCursor && (
            <div className="gallery-load-more">
              <button className="btn btn--secondary" type="button" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 size={18} aria-hidden="true" /> : <Images size={18} aria-hidden="true" />}
                <span>{loadingMore ? 'Loading' : 'Load More'}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        plugins={[Counter]}
        carousel={{ preload: 1, imageFit: 'contain' }}
        controller={{ closeOnBackdropClick: true }}
        labels={{
          Lightbox: `${collection?.name ?? 'Gallery'} image viewer`,
          Previous: 'Previous photograph',
          Next: 'Next photograph',
          Close: 'Close photograph viewer'
        }}
      />
    </>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────

function GalleryNotice({ icon, text }: { icon?: 'loading'; text: string }) {
  return (
    <div className="gallery-notice" role="status">
      {icon === 'loading' ? <Loader2 size={19} aria-hidden="true" /> : <ImageIcon size={19} aria-hidden="true" />}
      <span>{text}</span>
    </div>
  )
}

/**
 * Thumbnail image with graceful fallback when the Cloudinary URL fails.
 * Prevents a broken image from breaking the entire collection list row.
 */
function GalleryThumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <span className="gallery-image-fallback" aria-hidden="true">
        <ImageIcon size={26} />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        console.warn('[Gallery] Cover image failed to load:', src)
        setFailed(true)
      }}
    />
  )
}

/**
 * Individual photo in the grid. Shows a placeholder if the Cloudinary URL is
 * invalid or fails to load, without breaking the rest of the gallery.
 */
function GalleryPhoto({ image, onClick }: { image: GalleryImage; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const src = resolveImageUrl(image.thumbnailUrl)

  return (
    <button
      className="gallery-photo-button"
      type="button"
      onClick={onClick}
      aria-label={`Open ${image.title}`}
    >
      <span className={`gallery-photo-frame ${loaded ? 'is-loaded' : 'is-loading'}`}>
        {failed || !src ? (
          <span className="gallery-image-fallback gallery-image-fallback--photo" aria-hidden="true">
            <ImageIcon size={32} />
          </span>
        ) : (
          <img
            src={src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => {
              console.warn('[Gallery] Photo thumbnail failed to load. PublicId:', image.publicId ?? image.id, 'URL:', src)
              setFailed(true)
            }}
          />
        )}
      </span>
    </button>
  )
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

/**
 * Fetches from /api/gallery with automatic retry (up to 3 attempts, exponential backoff).
 * Prevents single transient network errors from showing a permanent failure state.
 */
async function fetchGalleryWithRetry(query = '', maxAttempts = 3): Promise<GalleryResponse> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/gallery${query ? `?${query}` : ''}`)
      if (!response.ok) {
        throw new Error(`Gallery API responded with ${response.status}`)
      }
      return await response.json() as GalleryResponse
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts) {
        const delay = 400 * Math.pow(2, attempt - 1) // 400ms → 800ms
        await new Promise((r) => setTimeout(r, delay))
        console.warn(`[Gallery] Retrying API request (attempt ${attempt + 1}/${maxAttempts})`)
      }
    }
  }
  throw lastError
}
