type IconProps = {
  className?: string
}

/** Dual-tone atelier icons — soft fill + crisp stroke for a modern luxury mark. */
export function IconHotel({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        className="lux-icon__fill"
        d="M5 19.5V9.2L12 4.5l7 4.7V19.5H5Z"
        fill="currentColor"
        opacity="0.14"
      />
      <path d="M4.5 19.5V8.8L12 4l7.5 4.8V19.5" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M9.2 19.5v-4.6h5.6v4.6" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path
        d="M8.2 10.4h.01M12 10.4h.01M15.8 10.4h.01M8.2 13.2h.01M12 13.2h.01M15.8 13.2h.01"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
      />
      <path d="M11.2 4.6h1.6v1.7h-1.6z" fill="currentColor" opacity="0.55" />
    </svg>
  )
}

export function IconGuestHouse({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path className="lux-icon__fill" d="M6.2 11V19h11.6v-8L12 5.4 6.2 11Z" fill="currentColor" opacity="0.14" />
      <path d="M3.5 11.2 12 4.2l8.5 7" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M6.2 10.6V19.5h11.6V10.6" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M10.2 19.5v-4.4h3.6v4.4" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <circle cx="12" cy="12.4" r="1.15" fill="currentColor" />
      <path d="M9.2 8.4h5.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}

export function IconHolidayHome({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse className="lux-icon__fill" cx="12" cy="16.8" rx="7.2" ry="2.4" fill="currentColor" opacity="0.12" />
      <path d="M4.2 18.8c1.9-3.1 4.6-4.7 7.8-4.7s5.9 1.6 7.8 4.7" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <path d="M7.6 12.6a4.4 4.4 0 0 1 8.8 0" stroke="currentColor" strokeWidth="1.55" />
      <path d="M12 8V5.4M12 5.4l1.7-1.3M12 5.4 10.3 4.1" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12.6" r="1.05" fill="currentColor" opacity="0.7" />
      <path d="M5.2 15.8c1.6-.8 3.4-1.2 5.3-1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}

export function IconVehicle({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        className="lux-icon__fill"
        d="M4.4 15.2V12l1.7-4A1.8 1.8 0 0 1 7.7 6.8h8.6a1.8 1.8 0 0 1 1.6 1.2l1.7 4v3.2H4.4Z"
        fill="currentColor"
        opacity="0.14"
      />
      <path d="M4 15.4V12l1.8-4.1A2 2 0 0 1 7.6 6.6h8.8a2 2 0 0 1 1.8 1.3L20 12v3.4" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M4 15.4h16v1.15a1.85 1.85 0 0 1-1.85 1.85H5.85A1.85 1.85 0 0 1 4 16.55V15.4Z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <circle cx="7.4" cy="16.1" r="1.2" fill="currentColor" />
      <circle cx="16.6" cy="16.1" r="1.2" fill="currentColor" />
      <path d="M4.6 12h14.8" stroke="currentColor" strokeWidth="1.45" opacity="0.45" />
      <path d="M9.2 9.1h5.6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

export function IconCompass({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="lux-icon__fill" cx="12" cy="12" r="7.4" fill="currentColor" opacity="0.12" />
      <circle cx="12" cy="12" r="8.15" stroke="currentColor" strokeWidth="1.55" />
      <path d="m15.7 8.3-2.15 5.2-5.2 2.15 2.15-5.2 5.2-2.15Z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="m15.7 8.3-2.15 5.2-5.2 2.15Z" fill="currentColor" opacity="0.22" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function IconMap({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        className="lux-icon__fill"
        d="m8.6 5-3.6 1.5v11.8l3.6-1.5 6.8 2.4 3.6-1.5V4.9l-3.6 1.5-6.8-2.4Z"
        fill="currentColor"
        opacity="0.14"
      />
      <path d="m8.5 4.5-4 1.7v13.1l4-1.7 7 2.5 4-1.7V5.3l-4 1.7-7-2.5Z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M8.5 4.5v13.1M15.5 7v13.1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

export function IconTrips({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect className="lux-icon__fill" x="5.2" y="8.2" width="13.6" height="10.8" rx="2" fill="currentColor" opacity="0.14" />
      <rect x="5" y="8" width="14" height="11.4" rx="2.2" stroke="currentColor" strokeWidth="1.55" />
      <path d="M9 8V6.75A2.75 2.75 0 0 1 11.75 4h.5A2.75 2.75 0 0 1 15 6.75V8" stroke="currentColor" strokeWidth="1.55" />
      <path d="M5 12.4h14" stroke="currentColor" strokeWidth="1.45" opacity="0.45" />
      <circle cx="12" cy="15.6" r="1" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export function IconHeart({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        className="lux-icon__fill"
        d="M12 18.9s-6.1-3.8-6.1-7.9A3.4 3.4 0 0 1 12 8.1a3.4 3.4 0 0 1 6.1 2.9c0 4.1-6.1 7.9-6.1 7.9Z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M12 19.4s-6.5-4-6.5-8.4A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 6.5 3c0 4.4-6.5 8.4-6.5 8.4Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconProfile({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="lux-icon__fill" cx="12" cy="8.2" r="3" fill="currentColor" opacity="0.16" />
      <circle cx="12" cy="8.2" r="3.15" stroke="currentColor" strokeWidth="1.55" />
      <path d="M5.4 18.9c1.45-3.05 3.9-4.55 6.6-4.55s5.15 1.5 6.6 4.55" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <path d="M7.2 18.2c1.2-1.9 2.9-2.85 4.8-2.85" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

export const categoryIcons = {
  hotels: IconHotel,
  guest_houses: IconGuestHouse,
  holiday_homes: IconHolidayHome,
  vehicles: IconVehicle,
} as const

export const navIcons = {
  compass: IconCompass,
  map: IconMap,
  trips: IconTrips,
  heart: IconHeart,
  profile: IconProfile,
} as const
