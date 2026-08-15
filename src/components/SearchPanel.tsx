import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { destinations } from '../data/hotels'

type SearchPanelProps = {
  compact?: boolean
  initialCity?: string
  initialWifi?: string
}

export function SearchPanel({
  compact = false,
  initialCity = 'Anywhere',
  initialWifi = '100',
}: SearchPanelProps) {
  const navigate = useNavigate()
  const [city, setCity] = useState(initialCity)
  const [wifi, setWifi] = useState(initialWifi)
  const [nights, setNights] = useState('30')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (city !== 'Anywhere') params.set('city', city)
    if (wifi) params.set('wifi', wifi)
    if (nights) params.set('nights', nights)
    navigate(`/explore?${params.toString()}`)
  }

  return (
    <form
      className={`search-panel ${compact ? 'search-panel--compact' : ''}`}
      onSubmit={onSubmit}
    >
      <label className="field">
        <span>Where</span>
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {destinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Min Wi‑Fi</span>
        <select value={wifi} onChange={(e) => setWifi(e.target.value)}>
          <option value="50">50+ Mbps</option>
          <option value="100">100+ Mbps</option>
          <option value="300">300+ Mbps</option>
          <option value="450">450+ Mbps</option>
        </select>
      </label>
      <label className="field">
        <span>Stay length</span>
        <select value={nights} onChange={(e) => setNights(e.target.value)}>
          <option value="7">1 week+</option>
          <option value="14">2 weeks+</option>
          <option value="30">1 month</option>
          <option value="60">2 months+</option>
        </select>
      </label>
      <button type="submit" className="btn btn--solid">
        Search stays
      </button>
    </form>
  )
}
