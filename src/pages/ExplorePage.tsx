import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { hotels } from '../data/hotels'
import { HotelCard } from '../components/HotelCard'
import { SearchPanel } from '../components/SearchPanel'
import { SiteHeader } from '../components/SiteHeader'

export function ExplorePage() {
  const [params] = useSearchParams()
  const city = params.get('city') ?? 'Anywhere'
  const wifi = Number(params.get('wifi') ?? '100')
  const nights = Number(params.get('nights') ?? '30')

  const results = useMemo(() => {
    return hotels
      .filter((hotel) => (city === 'Anywhere' ? true : hotel.city === city))
      .filter((hotel) => hotel.wifiMbps >= wifi)
      .filter((hotel) => hotel.stayMinNights <= nights)
      .sort((a, b) => a.monthlyFrom - b.monthlyFrom)
  }, [city, wifi, nights])

  return (
    <div className="page page--explore">
      <SiteHeader tone="dark" />
      <main className="section">
        <div className="section__intro">
          <h1>Explore stays</h1>
          <p>
            {results.length} stay{results.length === 1 ? '' : 's'} matching your filters.
          </p>
        </div>
        <SearchPanel compact initialCity={city} initialWifi={String(wifi)} />
        <div className="hotel-grid hotel-grid--explore">
          {results.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
        {results.length === 0 && (
          <p className="empty-state">
            No stays match those filters yet. Try lowering Wi‑Fi or widening destination.
          </p>
        )}
      </main>
    </div>
  )
}
