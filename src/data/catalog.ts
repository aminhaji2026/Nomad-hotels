import type { Addon, Destination, Stay, Trip, Vehicle } from '../types'

export const destinations: Destination[] = [
  {
    id: 'hargeisa',
    name: 'Hargeisa',
    country: 'Somaliland',
    image:
      'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mogadishu',
    name: 'Mogadishu',
    country: 'Somalia',
    image:
      'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    image:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    country: 'Kenya',
    image:
      'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=800&q=80',
  },
]

export const stays: Stay[] = [
  {
    id: 'address-downtown',
    name: 'Address Downtown Dubai',
    city: 'Dubai',
    country: 'UAE',
    neighborhood: 'Downtown Dubai',
    type: 'hotel',
    typeLabel: 'Luxury Hotel',
    image:
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    ],
    nightlyFrom: 320,
    rating: 5.0,
    reviews: 1284,
    guestScore: 9.6,
    badge: 'Bestseller',
    amenities: ['Free Cancellation', 'Breakfast Included', 'Pool', 'Wi-Fi'],
    highlights: ['Private Beach', 'Infinity Pool', 'Breakfast', 'Wi-Fi', 'Parking'],
    summary:
      'Iconic Downtown address with Burj Khalifa views, refined suites, and seamless concierge for business or leisure.',
    room: {
      name: 'Premier Ocean View Room',
      tag: 'City View',
      bed: 'King Bed',
      guests: 2,
      sizeSqm: 65,
      image:
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
      blurb: 'Floor-to-ceiling glass, marble bath, and a dedicated work desk with high-speed Wi‑Fi.',
    },
    map: { lat: 25.1972, lng: 55.2744 },
  },
  {
    id: 'four-seasons-dubai',
    name: 'Four Seasons Resort Dubai',
    city: 'Dubai',
    country: 'UAE',
    neighborhood: 'Jumeirah Beach',
    type: 'hotel',
    typeLabel: 'Luxury Resort',
    image:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    ],
    nightlyFrom: 1250,
    rating: 4.9,
    reviews: 482,
    guestScore: 9.6,
    badge: 'Bestseller',
    amenities: ['Private Beach', 'Pool', 'Spa', 'Breakfast Included', 'Wi-Fi'],
    highlights: ['Private Beach', 'Infinity Pool', 'Breakfast', 'Wi-Fi', 'Parking'],
    summary:
      'Beachfront sanctuary on Jumeirah with infinity pools, spa rituals, and ocean-view suites made for unhurried days.',
    room: {
      name: 'Premier Ocean View Room',
      tag: 'Ocean View',
      bed: 'King Bed',
      guests: 2,
      sizeSqm: 65,
      image:
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
      blurb: 'Soft coastal light, private balcony, and resort Wi‑Fi verified for remote work mornings.',
    },
    map: { lat: 25.1412, lng: 55.1853 },
  },
  {
    id: 'maldives-villa',
    name: 'Maldives Overwater Villa',
    city: 'Malé',
    country: 'Maldives',
    neighborhood: 'North Malé Atoll',
    type: 'holiday_home',
    typeLabel: 'Private Villa',
    image:
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
    ],
    nightlyFrom: 1250,
    rating: 4.9,
    reviews: 210,
    guestScore: 9.8,
    badge: 'New',
    amenities: ['Private Beach', 'Pool', 'Kitchen', 'Wi-Fi'],
    highlights: ['Overwater', 'Butler', 'Breakfast', 'Wi-Fi'],
    summary: 'Glass-floor villa with direct lagoon access and a personal butler for sunrise briefings.',
    room: {
      name: 'Overwater Suite',
      tag: 'Lagoon',
      bed: 'King Bed',
      guests: 2,
      sizeSqm: 120,
      image:
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=800&q=80',
      blurb: 'Open-air bath, plunge deck, and fiber uplink for short focused work blocks.',
    },
    map: { lat: 4.1755, lng: 73.5093 },
  },
  {
    id: 'bali-cliff',
    name: 'Bali Cliffside Resort',
    city: 'Uluwatu',
    country: 'Indonesia',
    neighborhood: 'Uluwatu Cliffs',
    type: 'hotel',
    typeLabel: 'Boutique Resort',
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80',
    ],
    nightlyFrom: 480,
    rating: 4.8,
    reviews: 356,
    guestScore: 9.4,
    amenities: ['Pool', 'Spa', 'Breakfast Included', 'Wi-Fi'],
    highlights: ['Cliff views', 'Infinity Pool', 'Spa', 'Wi-Fi'],
    summary: 'Dramatic cliff pools, temple sunsets, and quiet suites for founders between launches.',
    room: {
      name: 'Cliff Suite',
      tag: 'Ocean Cliff',
      bed: 'King Bed',
      guests: 2,
      sizeSqm: 72,
      image:
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      blurb: 'Private plunge pool and a teak desk facing the Indian Ocean.',
    },
    map: { lat: -8.8291, lng: 115.0849 },
  },
  {
    id: 'jazeer-hargeisa',
    name: 'Jazeer Hotel',
    city: 'Hargeisa',
    country: 'Somaliland',
    neighborhood: 'City Centre',
    type: 'hotel',
    typeLabel: 'Business Hotel',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
    ],
    nightlyFrom: 145,
    rating: 4.8,
    reviews: 96,
    guestScore: 9.1,
    amenities: ['Free Cancellation', 'Wi-Fi', 'Parking', 'Breakfast Included'],
    highlights: ['Central', 'Business desk', 'Wi-Fi', 'Parking'],
    summary: 'Reliable city-centre stay with strong connectivity and warm local hospitality.',
    room: {
      name: 'Executive Room',
      tag: 'City',
      bed: 'King Bed',
      guests: 2,
      sizeSqm: 38,
      image:
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
      blurb: 'Quiet AC room with desk, kettle, and verified fiber for calls.',
    },
    map: { lat: 9.56, lng: 44.065 },
  },
  {
    id: 'zanzibar-beach',
    name: 'Zanzibar Beach Retreat',
    city: 'Nungwi',
    country: 'Tanzania',
    neighborhood: 'Nungwi Beach',
    type: 'holiday_home',
    typeLabel: 'Beach Retreat',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    ],
    nightlyFrom: 390,
    rating: 4.7,
    reviews: 178,
    guestScore: 9.3,
    amenities: ['Beachfront', 'Pool', 'Kitchen', 'Wi-Fi'],
    highlights: ['Beachfront', 'Private chef', 'Wi-Fi'],
    summary: 'White-sand mornings and open-air living steps from the Indian Ocean.',
    room: {
      name: 'Beach Villa',
      tag: 'Oceanfront',
      bed: 'King Bed',
      guests: 4,
      sizeSqm: 95,
      image:
        'https://images.unsplash.com/photo-1578683010236-d716f9a75d1e?auto=format&fit=crop&w=800&q=80',
      blurb: 'Palm shade terrace, outdoor shower, and lounge-ready Wi‑Fi.',
    },
    map: { lat: -5.726, lng: 39.298 },
  },
]

export const vehicles: Vehicle[] = [
  {
    id: 'rr-vogue',
    name: 'Range Rover Vogue',
    detail: '2024 • Luxury SUV',
    image:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80',
    dailyFrom: 220,
    city: 'Dubai',
  },
  {
    id: 's-class',
    name: 'Mercedes-Benz S-Class',
    detail: '2024 • Executive Sedan',
    image:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80',
    dailyFrom: 280,
    city: 'Dubai',
  },
  {
    id: 'land-cruiser',
    name: 'Toyota Land Cruiser',
    detail: '2023 • Adventure SUV',
    image:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80',
    dailyFrom: 160,
    city: 'Nairobi',
  },
]

export const addons: Addon[] = [
  {
    id: 'dxb-transfer',
    kind: 'transfer',
    name: 'Airport Transfer',
    detail: 'Dubai Intl. Airport (DXB)',
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
    priceFrom: 110,
    unit: 'trip',
    city: 'Dubai',
  },
  {
    id: 'desert-safari',
    kind: 'experience',
    name: 'Desert Safari',
    detail: 'Private evening dune experience',
    image:
      'https://images.unsplash.com/photo-1451337511555-1ad87ea93da6?auto=format&fit=crop&w=800&q=80',
    priceFrom: 185,
    unit: 'person',
    city: 'Dubai',
  },
  {
    id: 'rr-vogue-addon',
    kind: 'vehicle',
    name: 'Range Rover Vogue',
    detail: '2024 • Luxury SUV',
    image:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80',
    priceFrom: 220,
    unit: 'day',
    city: 'Dubai',
  },
  {
    id: 'hargeisa-transfer',
    kind: 'transfer',
    name: 'Airport Transfer',
    detail: 'Hargeisa Airport (HGA)',
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
    priceFrom: 45,
    unit: 'trip',
    city: 'Hargeisa',
  },
]

export const activeTrip: Trip = {
  id: 'trip-dubai',
  city: 'Dubai',
  country: 'United Arab Emirates',
  image:
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80',
  status: 'CONFIRMED',
  bookingRef: 'NSDUB240524',
  checkIn: 'May 24, 2025',
  checkOut: 'May 28, 2025',
  guests: 2,
  rooms: 1,
  totalLabel: 'AED 4,250',
  paidInFull: true,
  countdownDays: 45,
  itinerary: [
    {
      id: 'it-hotel',
      kind: 'hotel',
      title: 'Address Downtown Dubai',
      subtitle: 'May 24 – May 28',
      image:
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80',
      status: 'Confirmed',
    },
    {
      id: 'it-car',
      kind: 'vehicle',
      title: 'Range Rover Vogue',
      subtitle: 'May 24 – May 28',
      image:
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=400&q=80',
      status: 'Confirmed',
    },
    {
      id: 'it-transfer',
      kind: 'transfer',
      title: 'Airport Transfer',
      subtitle: 'DXB Airport → Hotel · May 24 · 2:30 PM',
      image:
        'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=400&q=80',
      status: 'Confirmed',
    },
  ],
}

export const savedSuggestions = stays.filter((s) =>
  ['maldives-villa', 'bali-cliff', 'zanzibar-beach'].includes(s.id),
)

export function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Number.isFinite(diff) && diff > 0 ? diff : 4
}

export function addonsForCity(city: string) {
  const local = addons.filter((a) => a.city.toLowerCase() === city.toLowerCase())
  if (local.length) return local
  // Generic premium upsells when city-specific catalog is empty
  return [
    {
      id: 'generic-transfer',
      kind: 'transfer' as const,
      name: 'Airport Transfer',
      detail: `${city} airport → hotel`,
      image:
        'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
      priceFrom: 90,
      unit: 'trip',
      city,
    },
    {
      id: 'generic-vehicle',
      kind: 'vehicle' as const,
      name: 'Premium SUV',
      detail: 'Chauffeur available',
      image:
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80',
      priceFrom: 180,
      unit: 'day',
      city,
    },
  ]
}
