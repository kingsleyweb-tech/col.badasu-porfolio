import { useState, useEffect, useRef } from 'react'
import type { ImageAsset } from '../data/officerData'

type OptimizedImageProps = {
  asset: ImageAsset
  alt?: string
  className?: string
  imageClassName?: string
  loading?: 'eager' | 'lazy'
  decoding?: 'async' | 'auto' | 'sync'
  fetchPriority?: 'high' | 'low' | 'auto'
  sizes?: string
  variant?: 'full' | 'thumbnail'
}

export function OptimizedImage({
  asset,
  alt,
  className,
  imageClassName,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
  sizes = '100vw',
  variant = 'full'
}: OptimizedImageProps) {
  const targetSrc = variant === 'thumbnail' ? asset.thumbnailSrc : asset.src
  const [currentSrc, setCurrentSrc] = useState(targetSrc)
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const prevSrc = useRef(targetSrc)

  // Only reset when src actually changes (not on initial mount)
  useEffect(() => {
    if (prevSrc.current !== targetSrc) {
      prevSrc.current = targetSrc
      setCurrentSrc(targetSrc)
      setLoaded(false)
    }
  }, [targetSrc])

  // Check if image already loaded (e.g. from browser cache)
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [currentSrc])

  const canUseSrcSet = currentSrc !== asset.fallbackSrc && asset.srcSet && asset.srcSet.length > 0

  return (
    <span
      className={`optimized-image ${loaded ? 'is-loaded' : ''}${className ? ` ${className}` : ''}`}
      style={{ backgroundImage: `url(${asset.placeholderSrc})` }}
    >
      <img
        ref={imgRef}
        className={imageClassName}
        src={currentSrc}
        srcSet={canUseSrcSet ? asset.srcSet : undefined}
        sizes={canUseSrcSet ? sizes : undefined}
        alt={alt ?? asset.alt}
        width={asset.width}
        height={asset.height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (currentSrc !== asset.fallbackSrc) {
            setCurrentSrc(asset.fallbackSrc)
          }
        }}
      />
    </span>
  )
}
