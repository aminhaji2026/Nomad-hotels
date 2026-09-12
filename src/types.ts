export type PropertyType = 'hotel' | 'guest_house' | 'holiday_home'

export type Amenity =
  | 'Free Cancellation'
  | 'Breakfast Included'
  | 'Pool'
  | 'Beachfront'
  | 'Kitchen'
  | 'Spa'
  | 'Parking'
  | 'Wi-Fi'
  | 'Private Beach'
  | 'Kids Club'

export type Stay = {
  id: string
  name: string
  city: string
  country: string
  neighborhood: string
  type: PropertyType
  typeLabel: string
  image: string
  gallery: string[]
  nightlyFrom: number
  rating: number
  reviews: number
  guestScore: number
  badge?: 'Bestseller' | 'New'
  amenities: Amenity[]
  highlights: string[]
  summary: string
  room: {
    name: string
    tag: string
    bed: string
    guests: number
    sizeSqm: number
    image: string
    blurb: string
  }
  map: { lat: number; lng: number }
}

export type Destination = {
  id: string
  name: string
  country: string
  image: string
}

export type Vehicle = {
  id: string
  name: string
  detail: string
  image: string
  dailyFrom: number
  city?: string
}

export type Addon = {
  id: string
  kind: 'vehicle' | 'transfer' | 'experience'
  name: string
  detail: string
  image: string
  priceFrom: number
  unit: string
  city: string
}

export type TripItem = {
  id: string
  kind: 'hotel' | 'vehicle' | 'transfer'
  title: string
  subtitle: string
  image: string
  status: 'Confirmed' | 'Pending'
}

export type Trip = {
  id: string
  city: string
  country: string
  image: string
  status: 'CONFIRMED' | 'PENDING'
  bookingRef: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  totalLabel: string
  paidInFull: boolean
  itinerary: TripItem[]
  countdownDays: number
}
