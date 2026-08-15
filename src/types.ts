export type Hotel = {
  id: string
  name: string
  city: string
  country: string
  region: string
  image: string
  gallery: string[]
  monthlyFrom: number
  nightlyFrom: number
  wifiMbps: number
  desk: boolean
  kitchen: boolean
  coworkNearby: boolean
  rating: number
  reviews: number
  stayMinNights: number
  summary: string
  amenities: string[]
  timezone: string
}
