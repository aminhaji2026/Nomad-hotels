type IconProps = {
  className?: string
}

/** Thin, modern line icons with draw/float-friendly strokes. */
export function IconHotel({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V8.5L12 4l8 4.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01M8 13.5h.01M12 13.5h.01M16 13.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function IconGuestHouse({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 10.5V20h12V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconHolidayHome({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19.5c1.8-3.2 4.4-4.8 8-4.8s6.2 1.6 8 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 12.5c0-2.6 2-4.7 4.5-4.7s4.5 2.1 4.5 4.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.8V5.2M12 5.2l1.6-1.2M12 5.2 10.4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.2c1.5-.7 3.2-1.1 5-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}

export function IconVehicle({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 15.5V12l1.8-4.2A2 2 0 0 1 7.6 6.5h8.8a2 2 0 0 1 1.8 1.3L20 12v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 15.5h16v1.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 16.7v-1.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7.5" cy="16.2" r="1.1" fill="currentColor" />
      <circle cx="16.5" cy="16.2" r="1.1" fill="currentColor" />
      <path d="M4.5 12h15" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
    </svg>
  )
}

export function IconCompass({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.05" fill="currentColor" />
    </svg>
  )
}

export function IconMap({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m8.5 4.5-4 1.7v13.1l4-1.7 7 2.5 4-1.7V5.3l-4 1.7-7-2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5 4.5v13.1M15.5 7v13.1" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
    </svg>
  )
}

export function IconTrips({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="8" width="14" height="11.5" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8V6.8A2.8 2.8 0 0 1 11.8 4h.4A2.8 2.8 0 0 1 15 6.8V8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 12.5h14" stroke="currentColor" strokeWidth="1.5" opacity=".45" />
    </svg>
  )
}

export function IconHeart({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19.4s-6.5-4-6.5-8.4A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 6.5 3c0 4.4-6.5 8.4-6.5 8.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconProfile({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 18.8c1.4-3 3.8-4.5 6.5-4.5s5.1 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
