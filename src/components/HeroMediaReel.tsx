import { useEffect, useRef } from 'react'

export type HeroMediaSlide =
  | { type: 'image'; src: string; alt?: string }
  | { type: 'video'; src: string; poster?: string }

const DEFAULT_SLIDES: HeroMediaSlide[] = [
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80',
    alt: 'Luxury suite overlooking the water',
  },
  {
    type: 'video',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster:
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80',
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-156607377697-593c1b58dcae?auto=format&fit=crop&w=1600&q=80',
    alt: 'Boutique hotel courtyard at dusk',
  },
  {
    type: 'video',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80',
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
    alt: 'Desert resort terrace',
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=1600&q=80',
    alt: 'Infinity pool at sunset',
  },
]

type HeroMediaReelProps = {
  slides?: HeroMediaSlide[]
  className?: string
}

export function HeroMediaReel({ slides = DEFAULT_SLIDES, className = '' }: HeroMediaReelProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let last = performance.now()
    let paused = false

    const pause = () => {
      paused = true
    }
    const resume = () => {
      paused = false
    }
    track.addEventListener('pointerenter', pause)
    track.addEventListener('pointerleave', resume)
    track.addEventListener('touchstart', pause, { passive: true })
    track.addEventListener('touchend', resume, { passive: true })

    const tick = (now: number) => {
      const dt = Math.min(32, now - last)
      last = now
      if (!paused && dt > 0) {
        const max = track.scrollWidth / 2
        track.scrollLeft += dt * 0.04
        if (track.scrollLeft >= max) track.scrollLeft = 0
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('pointerenter', pause)
      track.removeEventListener('pointerleave', resume)
      track.removeEventListener('touchstart', pause)
      track.removeEventListener('touchend', resume)
    }
  }, [slides])

  const loop = [...slides, ...slides]

  return (
    <div className={`hero-reel ${className}`.trim()} aria-hidden="true">
      <div className="hero-reel__track" ref={trackRef}>
        {loop.map((slide, index) => (
          <div className="hero-reel__slide" key={`${slide.type}-${index}`}>
            {slide.type === 'image' ? (
              <img
                src={slide.src}
                alt={slide.alt ?? ''}
                loading={index < 2 ? 'eager' : 'lazy'}
                draggable={false}
              />
            ) : (
              <video
                src={slide.src}
                poster={slide.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
