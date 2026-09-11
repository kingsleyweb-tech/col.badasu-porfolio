import { useState, useEffect } from 'react'
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

  useEffect(() => {
    setCurrentSrc(targetSrc)
    setLoaded(false)
  }, [targetSrc])

  const canUseSrcSet = currentSrc !== asset.fallbackSrc && asset.srcSet && asset.srcSet.length > 0

  return (
    <span
      className={`optimized-image ${loaded ? 'is-loaded' : ''}${className ? ` ${className}` : ''}`}
      style={{ backgroundImage: `url(${asset.placeholderSrc})` }}
    >
      <img
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
