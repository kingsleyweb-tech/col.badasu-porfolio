import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronRight, ImageIcon, Images, Info, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'
import { BackButton } from '../components/BackButton'
import { SectionHeading } from '../components/SectionHeading'
import { galleryImages, officer } from '../data/officerData'
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

const localCollections = buildLocalCollections()

export function Gallery() {
  const { collectionSlug } = useParams()

  if (collectionSlug) {
    return <GalleryCollectionView collectionSlug={collectionSlug} />
  }

  return <GalleryCollectionsView />
}

function GalleryCollectionsView() {
  const [collections, setCollections] = useState<GalleryCollection[]>(localCollections)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true

    fetchGallery().then((data) => {
      if (!active) return

      if ('collections' in data && data.collections.length > 0) {
        setCollections(data.collections)
      }

      setStatus('ready')
    }).catch((error: unknown) => {
      console.info('Gallery collections fallback in use.', error)
      if (active) setStatus(localCollections.length > 0 ? 'ready' : 'error')
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHero eyebrow="Gallery" title="Gallery" description="A visual journey through Colonel Badasu's military career, professional service, international assignments, leadership, training, and distinguished moments." />
      <section className="section">
        <div className="container">
          <BackButton />
          <SectionHeading eyebrow="Collections" title="Military Career Archive" />
          {status === 'loading' && <GalleryNotice icon="loading" text="Preparing gallery collections..." />}
          {status === 'error' && <GalleryNotice text="Gallery collections are temporarily unavailable." />}

          <div className="gallery-album-list" aria-label="Gallery collections">
            {collections.map((collection) => (
              <Link
                className="gallery-album-row"
                key={collection.slug}
                to={`/gallery/${collection.slug}`}
                aria-label={`Open ${collection.name} collection`}
              >
                {/* Thumbnail */}
                <span className="gallery-album-row__thumb">
                  {collection.coverImage ? (
                    <img
                      src={resolveImageUrl(collection.coverImage.thumbnailUrl)}
                      alt={collection.coverImage.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="gallery-image-fallback" aria-hidden="true">
                      <ImageIcon size={26} />
                    </span>
                  )}
                </span>

                {/* Info */}
                <span className="gallery-album-row__info">
                  <strong className="gallery-album-row__title">{collection.name}</strong>
                  <span className="gallery-album-row__meta">
                    <span className="gallery-album-row__count">
                      <Images size={13} aria-hidden="true" />
                      {typeof collection.count === 'number'
                        ? `${collection.count} image${collection.count === 1 ? '' : 's'}`
                        : 'No images yet'}
                    </span>
                    {collection.updatedAt && (
                      <span className="gallery-album-row__date">
                        <CalendarDays size={13} aria-hidden="true" />
                        Last updated: {collection.updatedAt}
                      </span>
                    )}
                  </span>
                </span>

                {/* Arrow */}
                <ChevronRight className="gallery-album-row__chevron" size={20} aria-hidden="true" />
              </Link>
            ))}
          </div>

          {status === 'ready' && collections.length > 0 && (
            <p className="gallery-album-hint">
              <Info size={15} aria-hidden="true" />
              Tap on a collection to view, edit or manage images.
            </p>
          )}
        </div>
      </section>
    </>
  )
}

function GalleryCollectionView({ collectionSlug }: { collectionSlug: string }) {
  const navigate = useNavigate()
  const fallbackCollection = localCollections.find((collection) => collection.slug === collectionSlug)
  const [collection, setCollection] = useState<GalleryCollection | undefined>(fallbackCollection)
  const [images, setImages] = useState<GalleryImage[]>(fallbackCollection ? getLocalImages(collectionSlug) : [])
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [index, setIndex] = useState(-1)

  useEffect(() => {
    let active = true

    setStatus('loading')
    fetchGallery(`collection=${encodeURIComponent(collectionSlug)}`).then((data) => {
      if (!active) return

      if ('collection' in data) {
        setCollection(data.collection)
        setImages(data.images)
        setNextCursor(data.nextCursor)
      }

      setStatus('ready')
    }).catch((error: unknown) => {
      console.info('Gallery collection fallback in use.', error)
      if (!active) return
      setStatus(fallbackCollection ? 'ready' : 'error')
    })

    return () => {
      active = false
    }
  }, [collectionSlug, fallbackCollection])

  const slides = useMemo(() => images.map((image) => ({
    src: resolveImageUrl(image.largeUrl),
    alt: image.alt,
    title: image.title,
    width: image.width,
    height: image.height
  })), [images])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return

    setLoadingMore(true)
    try {
      const data = await fetchGallery(`collection=${encodeURIComponent(collectionSlug)}&cursor=${encodeURIComponent(nextCursor)}`)
      if ('collection' in data) {
        setImages((current) => [...current, ...data.images])
        setNextCursor(data.nextCursor)
      }
    } catch (error) {
      console.info('Unable to load more gallery images.', error)
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

          {status === 'loading' && <GalleryNotice icon="loading" text="Loading collection photographs..." />}
          {status === 'error' && <GalleryNotice text="This gallery collection is temporarily unavailable." />}

          <div className="gallery-photo-grid" aria-label={`${collection?.name ?? 'Gallery'} photographs`}>
            {images.map((image, imageIndex) => (
              <GalleryPhoto
                key={image.id}
                image={image}
                onClick={() => setIndex(imageIndex)}
              />
            ))}
          </div>

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
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
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

function GalleryNotice({ icon, text }: { icon?: 'loading'; text: string }) {
  return (
    <div className="gallery-notice" role="status">
      {icon === 'loading' ? <Loader2 size={19} aria-hidden="true" /> : <ImageIcon size={19} aria-hidden="true" />}
      <span>{text}</span>
    </div>
  )
}

async function fetchGallery(query = ''): Promise<GalleryResponse> {
  const response = await fetch(`/api/gallery${query ? `?${query}` : ''}`)

  if (!response.ok) {
    throw new Error(`Gallery request failed with ${response.status}`)
  }

  return await response.json() as GalleryResponse
}

function buildLocalCollections(): GalleryCollection[] {
  return [
    {
      slug: 'military-operations',
      name: 'Military Operations',
      count: 95,
      updatedAt: '12 Apr 2025',
      coverImage: {
        id: 'boundary-ops-cover',
        title: 'Boundary Operations',
        alt: 'Colonel Badasu during military boundary operations',
        thumbnailUrl: 'boundary opearations/WhatsApp Image 2026-08-31 at 11.25.27 AM.jpeg',
        largeUrl: 'boundary opearations/WhatsApp Image 2026-08-31 at 11.25.27 AM.jpeg'
      }
    },
    {
      slug: 'leadership',
      name: 'Leadership',
      count: 47,
      updatedAt: '10 Apr 2025',
      coverImage: {
        id: 'meetings-cover',
        title: 'Leadership Meeting',
        alt: 'Colonel Badasu in a leadership engagement',
        thumbnailUrl: 'meetiings/WhatsApp Image 2026-08-31 at 12.01.28 PM (2).jpeg',
        largeUrl: 'meetiings/WhatsApp Image 2026-08-31 at 12.01.28 PM (2).jpeg'
      }
    },
    {
      slug: 'community-service',
      name: 'Community Service',
      count: 100,
      updatedAt: '8 Apr 2025',
      coverImage: {
        id: 'adventure-cover',
        title: 'Community Service',
        alt: 'Colonel Badasu community service activities',
        thumbnailUrl: 'adventure/WhatsApp Image 2026-08-31 at 12.18.18 PM (1).jpeg',
        largeUrl: 'adventure/WhatsApp Image 2026-08-31 at 12.18.18 PM (1).jpeg'
      }
    },
    {
      slug: 'awards-recognition',
      name: 'Awards & Recognition',
      count: 10,
      updatedAt: '5 Apr 2025',
      coverImage: {
        id: 'collaborations-cover',
        title: 'Awards Ceremony',
        alt: 'Colonel Badasu at awards and recognition ceremony',
        thumbnailUrl: 'collaborations/WhatsApp Image 2026-08-31 at 11.52.43 AM (3).jpeg',
        largeUrl: 'collaborations/WhatsApp Image 2026-08-31 at 11.52.43 AM (3).jpeg'
      }
    },
    {
      slug: 'training-exercises',
      name: 'Training & Exercises',
      count: 43,
      updatedAt: '2 Apr 2025',
      coverImage: {
        id: 'jungle-cover',
        title: 'Jungle Training',
        alt: 'Colonel Badasu during jungle training exercises',
        thumbnailUrl: 'jungle/WhatsApp Image 2026-08-31 at 11.37.22 AM (2).jpeg',
        largeUrl: 'jungle/WhatsApp Image 2026-08-31 at 11.37.22 AM (2).jpeg'
      }
    },
    {
      slug: 'official-events',
      name: 'Official Events',
      count: 61,
      updatedAt: '28 Mar 2025',
      coverImage: {
        id: 'interviewing-cover',
        title: 'Official Event',
        alt: 'Colonel Badasu at official military event',
        thumbnailUrl: 'interviewing/WhatsApp Image 2026-08-31 at 11.33.52 AM (1).jpeg',
        largeUrl: 'interviewing/WhatsApp Image 2026-08-31 at 11.33.52 AM (1).jpeg'
      }
    },
    {
      slug: 'sea-border-operations',
      name: 'Sea Border Operations',
      count: 30,
      updatedAt: '20 Mar 2025',
      coverImage: {
        id: 'sea-border-cover',
        title: 'Sea Border Operation',
        alt: 'Colonel Badasu during sea border operations',
        thumbnailUrl: 'sea border operation/WhatsApp Image 2026-08-31 at 11.19.57 AM (1).jpeg',
        largeUrl: 'sea border operation/WhatsApp Image 2026-08-31 at 11.19.57 AM (1).jpeg'
      }
    },
    {
      slug: 'university-graduation',
      name: 'University of London Graduation',
      count: 32,
      updatedAt: '15 Mar 2025',
      coverImage: {
        id: 'graduation-cover',
        title: 'Graduation Ceremony',
        alt: 'Colonel Badasu at University of London graduation ceremony',
        thumbnailUrl: 'university of london graduation/WhatsApp Image 2026-08-31 at 11.47.12 AM.jpeg',
        largeUrl: 'university of london graduation/WhatsApp Image 2026-08-31 at 11.47.12 AM.jpeg'
      }
    },
    {
      slug: 'portfolio-gallery',
      name: 'Portfolio Gallery',
      count: 8,
      updatedAt: '10 Mar 2025',
      coverImage: {
        id: 'gallery-cover',
        title: 'Portfolio Gallery',
        alt: 'Colonel Badasu portfolio gallery',
        thumbnailUrl: 'gallery/a1.png',
        largeUrl: 'gallery/a1.png'
      }
    }
  ]
}

function getLocalImages(slug: string): GalleryImage[] {
  if (slug !== 'portfolio-gallery') {
    return []
  }

  return galleryImages.map((image) => ({
    id: image.src,
    title: image.caption,
    alt: image.alt,
    thumbnailUrl: image.thumbnailSrc,
    largeUrl: image.src,
    width: image.width,
    height: image.height
  }))
}

function GalleryPhoto({ image, onClick }: { image: GalleryImage; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <button
      className="gallery-photo-button"
      type="button"
      onClick={onClick}
      aria-label={`Open ${image.title}`}
    >
      <span className={`gallery-photo-frame ${loaded ? 'is-loaded' : 'is-loading'}`}>
        <img
          src={resolveImageUrl(image.thumbnailUrl)}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      </span>
    </button>
  )
}
