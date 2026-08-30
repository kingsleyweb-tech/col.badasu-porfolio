import { useState } from 'react'
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
  const [src, setSrc] = useState(variant === 'thumbnail' ? asset.thumbnailSrc : asset.src)
  const [loaded, setLoaded] = useState(false)
  const canUseSrcSet = src !== asset.fallbackSrc && asset.srcSet.length > 0

  return (
    <span
      className={`optimized-image ${loaded ? 'is-loaded' : ''}${className ? ` ${className}` : ''}`}
      style={{ backgroundImage: `url(${asset.placeholderSrc})` }}
    >
      <img
        className={imageClassName}
        src={src}
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
          if (src !== asset.fallbackSrc) {
            setSrc(asset.fallbackSrc)
          }
        }}
      />
    </span>
  )
}
