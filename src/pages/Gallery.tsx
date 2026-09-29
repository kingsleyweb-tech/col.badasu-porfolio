import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'
import { officer as defaultOfficer } from '../data/officerData'
import { siteImages } from '../data/siteImages'
import { useIsMobile } from '../hooks/useMediaQuery'
import { IconArrowRight, IconExpand, IconImage, IconInfo, IconLoader, IconPlay, IconPlus, IconRefresh } from '../components/site/icons'
import { Lightbox } from '../components/site/Lightbox'
import type { LightboxImage } from '../components/site/Lightbox'
import { BackLink, NextPrev, SectionHead } from '../components/site/PageParts'
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

type Status = 'loading' | 'ready' | 'error'

export function Gallery() {
  const { collectionSlug } = useParams()
  return collectionSlug ? <GalleryCollectionView key={collectionSlug} collectionSlug={collectionSlug} /> : <GalleryCollectionsView />
}

/** Loads the collection list; shared by the gallery page and the "next collection" link. */
function useCollections() {
  const [collections, setCollections] = useState<GalleryCollection[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    fetchGalleryWithRetry()
      .then((data) => {
        if (!active) return
        if ('collections' in data && Array.isArray(data.collections)) setCollections(data.collections)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!active) return
        console.warn('[Gallery] Failed to load collections after retries.', error)
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [attempt])

  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }, [])

  return { collections, status, retry }
}

// ─── Collections list ─────────────────────────────────────────────────────────

function GalleryCollectionsView() {
  const { collections, status, retry } = useCollections()
  const isMobile = useIsMobile()

  // The first collection is featured (2×2). Stretch the last card so the final row has no gap.
  const remainder = (collections.length + 3) % 3
  const lastSpan = isMobile ? ((collections.length - 1) % 2 === 1 ? 'span2' : '') : remainder === 1 ? 'span3' : remainder === 2 ? 'span2' : ''

  return (
    <div className="pg-gallery">
      <section className="ghero">
        <div className="wrap">
          <div>
            <div className="crumb rv"><BackLink /><span>Home / Gallery</span></div>
            <span className="tag on-dark rv rv1"><i />06 — Gallery</span>
            <h1 className="d1 rv rv2">Military career<br /><em>archive</em></h1>
            <p className="lead rv rv3">
              A visual journey through Colonel Badasu&apos;s military career, professional service, international assignments, leadership, training, and distinguished moments.
            </p>
          </div>
          <div className="pstack rv rv3" aria-hidden="true">
            <div className="sp p2"><img src={siteImages.portrait} alt="" /></div>
            <div className="sp p1"><img src={siteImages.television} alt="" /></div>
            <div className="sp p3"><img src={siteImages.ecowasMeeting} alt="" /></div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 100 }}>
        <div className="wrap">
          <SectionHead
            tag="Collections"
            title={<>Browse the<br />collections</>}
            aside="Each collection opens as its own photo set with a full-screen viewer."
          />

          {status === 'loading' && (
            <div className="grid-c" aria-busy="true" aria-label="Loading collections">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`gc skel ${i === 0 ? 'big' : ''}`} />)}
            </div>
          )}

          {status === 'error' && (
            <div className="notice err" role="alert">
              <IconImage size={19} />
              <span>Gallery collections are temporarily unavailable.</span>
              <button type="button" className="btn btn-line" onClick={retry}><IconRefresh size={15} />Retry</button>
            </div>
          )}

          {status === 'ready' && collections.length === 0 && (
            <div className="notice" role="status"><IconImage size={19} /><span>No collections have been published yet.</span></div>
          )}

          {status === 'ready' && collections.length > 0 && (
            <>
              <div className="grid-c">
                {collections.map((col, i) => {
                  const isLast = i === collections.length - 1 && i > 0
                  const cover = col.coverImage ? resolveImageUrl(i === 0 ? col.coverImage.largeUrl : col.coverImage.thumbnailUrl) : ''
                  return (
                    <Link key={col.slug} className={`gc ${i === 0 ? 'big' : ''} ${isLast ? lastSpan : ''}`} to={`/gallery/${col.slug}`}>
                      {cover ? <CoverImage src={cover} alt={col.coverImage?.alt || `${col.name} cover`} /> : <span className="noimg"><IconImage size={40} /></span>}
                      <div className="ov" />
                      {i === 0 && <span className="cnt pill">Featured collection</span>}
                      <div className="t">
                        <div>
                          <span className="pill">{typeof col.count === 'number' ? `${col.count} ${col.count === 1 ? 'Photograph' : 'Photographs'}` : 'Photographs'}</span>
                          <h3>{col.name}</h3>
                        </div>
                        <span className="go"><IconArrowRight /></span>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <p className="hint"><IconInfo size={16} />Select a collection to view its photographs.</p>
            </>
          )}

          <NextPrev prev={{ to: '/education', label: 'Education' }} next={{ to: '/', label: 'Home', small: 'Back to start →' }} />
        </div>
      </section>
    </div>
  )
}

// ─── Single collection ────────────────────────────────────────────────────────

function GalleryCollectionView({ collectionSlug }: { collectionSlug: string }) {
  const { data } = usePortfolio()
  const officer = { ...defaultOfficer, ...data?.officer }
  const { collections } = useCollections()
  const [collection, setCollection] = useState<GalleryCollection | undefined>()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(-1)

  useEffect(() => {
    let active = true
    fetchGalleryWithRetry(`collection=${encodeURIComponent(collectionSlug)}`)
      .then((res) => {
        if (!active) return
        if ('collection' in res) {
          setCollection(res.collection)
          setImages(res.images ?? [])
          setNextCursor(res.nextCursor)
        }
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!active) return
        console.warn('[Gallery] Failed to load collection:', collectionSlug, error)
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [collectionSlug, attempt])

  const retry = () => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetchGalleryWithRetry(`collection=${encodeURIComponent(collectionSlug)}&cursor=${encodeURIComponent(nextCursor)}`)
      if ('collection' in res) {
        setImages((prev) => [...prev, ...(res.images ?? [])])
        setNextCursor(res.nextCursor)
      }
    } catch (error) {
      console.warn('[Gallery] Unable to load more gallery images.', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const viewerImages = useMemo<LightboxImage[]>(
    () => images.map((img) => ({ src: resolveImageUrl(img.largeUrl), thumb: resolveImageUrl(img.thumbnailUrl), alt: img.alt || img.title })),
    [images]
  )

  const name = collection?.name ?? collections.find((c) => c.slug === collectionSlug)?.name ?? 'Gallery Collection'
  const coverSource = collection?.coverImage ?? images[0]
  const cover = coverSource ? resolveImageUrl(coverSource.largeUrl) : siteImages.ecowasChamber
  const position = collections.findIndex((c) => c.slug === collectionSlug)
  const nextCollection = position >= 0 && collections.length > 1 ? collections[(position + 1) % collections.length] : undefined
  const count = collection?.count ?? (status === 'ready' ? images.length : undefined)

  return (
    <div className="pg-col">
      <section className="phero">
        <img className="bgimg" src={cover} alt="" />
        <div className="shade" />
        <div className="wrap">
          <div className="crumb rv"><BackLink to="/gallery" label="Back to Gallery" /><span>Gallery / Collection</span></div>
          <span className="tag on-dark rv rv1"><i />Gallery Collection</span>
          <h1 className="d1 rv rv2">{name}</h1>
          <p className="lead rv rv3">Selected photographs from {officer.rank} {officer.name}&apos;s professional archive.</p>
          {images.length > 0 && (
            <div className="hstats rv rv4">
              <button className="btn btn-gold" type="button" onClick={() => setViewerIndex(0)}><IconPlay size={18} />View as slideshow</button>
            </div>
          )}
        </div>
      </section>

      <div className="wrap">
        <div className="bar2">
          <div className="l">
            {typeof count === 'number' && <span className="pill g">{count} {count === 1 ? 'Photo' : 'Photos'}</span>}
            <span className="sm">Select any photograph to open the full-screen viewer.</span>
          </div>
          <Link className="chip" to="/gallery">All collections</Link>
        </div>

        {status === 'error' && (
          <div className="notice err" role="alert">
            <IconImage size={19} />
            <span>This gallery collection is temporarily unavailable.</span>
            <button type="button" className="btn btn-line" onClick={retry}><IconRefresh size={15} />Retry</button>
          </div>
        )}

        {status === 'ready' && images.length === 0 && (
          <div className="notice" role="status"><IconImage size={19} /><span>No photographs in this collection yet.</span></div>
        )}

        {(images.length > 0 || status === 'loading') && (
          <div className="mas" aria-label={`${name} photographs`} aria-busy={status === 'loading'}>
            {images.map((image, i) => (
              <GalleryPhoto key={image.id} image={image} index={i} onOpen={() => setViewerIndex(i)} />
            ))}
            {(status === 'loading' || loadingMore) &&
              [220, 300, 180, 260].map((h, i) => <div key={i} className="ph skel" style={{ height: h }} aria-hidden="true" />)}
          </div>
        )}

        {nextCursor && (
          <div className="more">
            <button className="btn btn-line" type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? <IconLoader size={18} className="spin" /> : <IconPlus size={18} />}
              {loadingMore ? 'Loading photographs' : 'Load more photographs'}
            </button>
          </div>
        )}

        <NextPrev
          prev={{ to: '/gallery', label: 'All collections', small: '← Back to' }}
          next={nextCollection ? { to: `/gallery/${nextCollection.slug}`, label: nextCollection.name, small: 'Next collection →' } : { to: '/', label: 'Home', small: 'Back to start →' }}
        />
      </div>

      {viewerIndex >= 0 && (
        <Lightbox
          images={viewerImages}
          index={viewerIndex}
          title={name}
          subtitle="Selected photographs from the professional archive"
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(-1)}
        />
      )}
    </div>
  )
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="noimg"><IconImage size={40} /></span>
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
}

/** One photograph in the masonry. Shows a placeholder if its URL fails, without breaking the rest. */
function GalleryPhoto({ image, index, onOpen }: { image: GalleryImage; index: number; onOpen: () => void }) {
  const [failed, setFailed] = useState(false)
  const src = resolveImageUrl(image.thumbnailUrl)

  return (
    <button className="ph" type="button" onClick={onOpen} aria-label={`Open photograph ${index + 1}${image.title ? `: ${image.title}` : ''}`}>
      {failed || !src ? (
        <span className="noimg"><IconImage size={32} /></span>
      ) : (
        <img
          src={src}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          width={image.width}
          height={image.height}
          onError={() => {
            console.warn('[Gallery] Photo thumbnail failed to load. PublicId:', image.publicId ?? image.id, 'URL:', src)
            setFailed(true)
          }}
        />
      )}
      <span className="zoom"><IconExpand size={18} /></span>
    </button>
  )
}

// ─── API ──────────────────────────────────────────────────────────────────────

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
      return (await response.json()) as GalleryResponse
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
