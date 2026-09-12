import { useId, useState } from 'react'
import {
  ensureCheckoutAfterCheckin,
  formatOccupancyLabel,
  type StayOccupancy,
} from '../lib/stayCriteria'

type StayCriteriaFieldsProps = {
  checkIn: string
  checkOut: string
  occupancy: StayOccupancy
  onCheckInChange: (value: string) => void
  onCheckOutChange: (value: string) => void
  onOccupancyChange: (next: StayOccupancy) => void
  minDate?: string
  compact?: boolean
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="occupancy-stepper">
      <div>
        <strong>{label}</strong>
        {hint ? <span className="muted small">{hint}</span> : null}
      </div>
      <div className="occupancy-stepper__controls">
        <button
          type="button"
          className="occupancy-stepper__btn"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <span aria-live="polite">{value}</span>
        <button
          type="button"
          className="occupancy-stepper__btn"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function StayCriteriaFields({
  checkIn,
  checkOut,
  occupancy,
  onCheckInChange,
  onCheckOutChange,
  onOccupancyChange,
  minDate,
  compact = false,
}: StayCriteriaFieldsProps) {
  const baseId = useId()
  const [open, setOpen] = useState(false)
  const today = minDate || new Date().toISOString().slice(0, 10)

  function updateCheckIn(value: string) {
    const next = ensureCheckoutAfterCheckin(value, checkOut)
    onCheckInChange(next.checkIn)
    if (next.checkOut !== checkOut) onCheckOutChange(next.checkOut)
  }

  function updateCheckOut(value: string) {
    const next = ensureCheckoutAfterCheckin(checkIn, value)
    onCheckOutChange(next.checkOut)
  }

  function patchOccupancy(partial: Partial<StayOccupancy>) {
    const adults = Math.min(12, Math.max(1, partial.adults ?? occupancy.adults))
    const children = Math.min(10, Math.max(0, partial.children ?? occupancy.children))
    let rooms = Math.min(8, Math.max(1, partial.rooms ?? occupancy.rooms))
    if (adults < rooms) rooms = adults
    onOccupancyChange({ adults, children, rooms })
  }

  return (
    <div className={`stay-criteria${compact ? ' stay-criteria--compact' : ''}`}>
      <div className="search-grid stay-criteria__dates">
        <label className="mini-field" htmlFor={`${baseId}-checkin`}>
          <span>Check-in</span>
          <input
            id={`${baseId}-checkin`}
            type="date"
            value={checkIn}
            min={today}
            required
            onChange={(e) => updateCheckIn(e.target.value)}
          />
        </label>
        <label className="mini-field" htmlFor={`${baseId}-checkout`}>
          <span>Check-out</span>
          <input
            id={`${baseId}-checkout`}
            type="date"
            value={checkOut}
            min={addOneDay(checkIn) || today}
            required
            onChange={(e) => updateCheckOut(e.target.value)}
          />
        </label>
      </div>

      <div className="occupancy-field">
        <button
          type="button"
          className="occupancy-field__trigger"
          aria-expanded={open}
          aria-controls={`${baseId}-panel`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="mini-label">Rooms & occupants</span>
          <strong>{formatOccupancyLabel(occupancy)}</strong>
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>

        {open ? (
          <div className="occupancy-field__panel" id={`${baseId}-panel`}>
            <Stepper
              label="Rooms"
              hint="Suites or bedrooms"
              value={occupancy.rooms}
              min={1}
              max={Math.min(8, occupancy.adults)}
              onChange={(rooms) => patchOccupancy({ rooms })}
            />
            <Stepper
              label="Adults"
              hint="Ages 13+"
              value={occupancy.adults}
              min={Math.max(1, occupancy.rooms)}
              max={12}
              onChange={(adults) => patchOccupancy({ adults })}
            />
            <Stepper
              label="Children"
              hint="Ages 0–12"
              value={occupancy.children}
              min={0}
              max={10}
              onChange={(children) => patchOccupancy({ children })}
            />
            <button type="button" className="btn btn--ghost occupancy-field__done" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function addOneDay(isoDate: string) {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}
