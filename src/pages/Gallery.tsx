import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import { OptimizedImage } from '../components/OptimizedImage'
import { SectionHeading } from '../components/SectionHeading'
import { galleryImages } from '../data/officerData'
import { PageHero } from './Biography'

export function Gallery() {
  const [index, setIndex] = useState(-1)

  return (
    <>
      <PageHero eyebrow="Gallery" title="Photo Gallery" description="A polished gallery prepared for official portraits, ceremonial images, command moments, and professional engagements." />
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Images" title="Portfolio Gallery" />
          <div className="gallery-grid">
            {galleryImages.map((image, imageIndex) => (
              <button type="button" key={image.src} onClick={() => setIndex(imageIndex)} aria-label={`Open ${image.caption}`}>
                <OptimizedImage asset={image} variant="thumbnail" sizes="(max-width: 760px) 100vw, 33vw" />
              </button>
            ))}
          </div>
        </div>
      </section>
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={galleryImages.map((image) => ({
          src: image.src,
          alt: image.alt,
          title: image.caption,
          srcSet: image.srcSet.split(', ').map((candidate) => {
            const [src, width] = candidate.split(' ')
            const parsedWidth = Number.parseInt(width, 10)
            return { src, width: parsedWidth, height: Math.round((parsedWidth * image.height) / image.width) }
          }).filter((candidate) => candidate.src && Number.isFinite(candidate.width))
        }))}
      />
    </>
  )
}
