import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ImageIcon, Images, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'
import { SectionHeading } from '../components/SectionHeading'
import { galleryImages, officer } from '../data/officerData'
import { PageHero } from './Biography'

type GalleryCollection = {
  slug: string
  name: string
  count?: number
  coverImage?: GalleryImage
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
          <SectionHeading eyebrow="Collections" title="Military Career Archive" />
          {status === 'loading' && <GalleryNotice icon="loading" text="Preparing gallery collections..." />}
          {status === 'error' && <GalleryNotice text="Gallery collections are temporarily unavailable." />}
          <div className="gallery-collection-grid" aria-label="Gallery collections">
            {collections.map((collection) => (
              <Link className="gallery-collection-card" key={collection.slug} to={`/gallery/${collection.slug}`}>
                <span className="gallery-collection-card__media">
                  {collection.coverImage ? (
                    <img
                      src={collection.coverImage.thumbnailUrl}
                      alt={collection.coverImage.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="gallery-image-fallback" aria-hidden="true">
                      <ImageIcon size={34} />
                    </span>
                  )}
                </span>
                <span className="gallery-collection-card__body">
                  <strong>{collection.name}</strong>
                  {typeof collection.count === 'number' && (
                    <span>{collection.count} {collection.count === 1 ? 'Photo' : 'Photos'}</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
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
    src: image.largeUrl,
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
  return []
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
          src={image.thumbnailUrl}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      </span>
    </button>
  )
}

