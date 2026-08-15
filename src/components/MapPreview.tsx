import type { Stay } from '../types'

type MapPreviewProps = {
  stays: Stay[]
  city?: string
  expanded?: boolean
}

export function MapPreview({ stays, city = 'Dubai', expanded = false }: MapPreviewProps) {
  return (
    <section className={`map-preview ${expanded ? 'map-preview--expanded' : ''}`} aria-label={`${city} map`}>
      <div className="map-preview__canvas">
        <div className="map-preview__glow" />
        {stays.slice(0, 5).map((stay, index) => (
          <span
            key={stay.id}
            className="map-pin"
            style={{
              left: `${18 + index * 14}%`,
              top: `${28 + ((index * 17) % 40)}%`,
            }}
          >
            ${stay.nightlyFrom}
          </span>
        ))}
        <p className="map-preview__label">{city} · live pins</p>
      </div>
    </section>
  )
}
