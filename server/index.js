import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { loadDb, saveDb, uid, makeReferralCode, DATA_DIR } from './db.js'
import { seedStays, LOYALTY } from './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads')
const PORT = Number(process.env.PORT || 3000)

fs.mkdirSync(UPLOAD_DIR, { recursive: true })
fs.mkdirSync(DATA_DIR, { recursive: true })

function ensureSeed() {
  const db = loadDb()
  let changed = false
  for (const stay of seedStays) {
    const existing = db.stays.find((s) => s.id === stay.id)
    if (!existing) {
      db.stays.push({ ...stay, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      changed = true
    } else if (stay.id === 'damal-hotel-hargeisa' || stay.id === 'holiday-hotel-mogadishu') {
      // Keep curated info fresh while preserving uploaded images if present
      const uploaded = (existing.gallery || []).filter((url) => String(url).startsWith('/uploads/'))
      const image = existing.image?.startsWith('/uploads/') ? existing.image : stay.image
      const gallery = uploaded.length
        ? [image, ...uploaded.filter((u) => u !== image), ...stay.gallery.filter((u) => !uploaded.includes(u))]
        : stay.gallery
      Object.assign(existing, {
        ...stay,
        image,
        gallery: Array.from(new Set(gallery)),
        updatedAt: new Date().toISOString(),
      })
      changed = true
    }
  }
  if (changed) saveDb(db)
  return db
}

ensureSeed()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}-${safe}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'))
      return
    }
    cb(null, true)
  },
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(UPLOAD_DIR))

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    points: user.points,
    referralCode: user.referralCode,
    referredBy: user.referredBy || null,
    createdAt: user.createdAt,
  }
}

function addLedger(db, { userId, points, reason, meta = {} }) {
  const entry = {
    id: uid('led_'),
    userId,
    points,
    reason,
    meta,
    createdAt: new Date().toISOString(),
  }
  db.ledger.unshift(entry)
  const user = db.users.find((u) => u.id === userId)
  if (user) user.points = Math.max(0, (user.points || 0) + points)
  return entry
}

function findOrCreateUser(db, { email, name }) {
  const normalized = String(email).trim().toLowerCase()
  let user = db.users.find((u) => u.email === normalized)
  if (user) {
    if (name && user.name !== name) user.name = name
    return { user, created: false }
  }
  user = {
    id: uid('usr_'),
    email: normalized,
    name: name || normalized.split('@')[0],
    points: 0,
    referralCode: makeReferralCode(name || 'NS'),
    referredBy: null,
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  addLedger(db, {
    userId: user.id,
    points: LOYALTY.welcomeBonus,
    reason: 'welcome_bonus',
    meta: { label: 'Welcome to NomadStay' },
  })
  return { user, created: true }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'nomadstay-api' })
})

app.get('/api/stays', (req, res) => {
  const db = loadDb()
  const { city, q } = req.query
  let list = [...db.stays]
  if (city && String(city).toLowerCase() !== 'anywhere') {
    const c = String(city).toLowerCase()
    list = list.filter(
      (s) => s.city.toLowerCase().includes(c) || s.country.toLowerCase().includes(c),
    )
  }
  if (q) {
    const needle = String(q).toLowerCase()
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.city.toLowerCase().includes(needle) ||
        s.neighborhood?.toLowerCase().includes(needle),
    )
  }
  list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
  res.json({ stays: list, count: list.length })
})

app.get('/api/stays/:id', (req, res) => {
  const db = loadDb()
  const stay = db.stays.find((s) => s.id === req.params.id)
  if (!stay) return res.status(404).json({ error: 'Stay not found' })
  res.json({ stay })
})

app.post('/api/stays', upload.array('images', 8), (req, res) => {
  try {
    const db = loadDb()
    const body = req.body || {}
    const id =
      body.id ||
      String(body.name || 'stay')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    if (db.stays.some((s) => s.id === id)) {
      return res.status(409).json({ error: 'Stay id already exists' })
    }

    const uploaded = (req.files || []).map((f) => `/uploads/${f.filename}`)
    const galleryFromBody = body.gallery
      ? Array.isArray(body.gallery)
        ? body.gallery
        : String(body.gallery).split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const gallery = [...uploaded, ...galleryFromBody]
    const image = body.image || gallery[0] || ''

    const stay = {
      id,
      name: body.name,
      city: body.city,
      country: body.country,
      neighborhood: body.neighborhood || body.city,
      type: body.type || 'hotel',
      typeLabel: body.typeLabel || 'Hotel',
      image,
      gallery: gallery.length ? gallery : [image].filter(Boolean),
      nightlyFrom: Number(body.nightlyFrom || 100),
      rating: Number(body.rating || 4.5),
      reviews: Number(body.reviews || 0),
      guestScore: Number(body.guestScore || 8.5),
      badge: body.badge || undefined,
      amenities: body.amenities
        ? String(body.amenities)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : ['Wi-Fi'],
      highlights: body.highlights
        ? String(body.highlights)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : ['Wi-Fi'],
      summary: body.summary || '',
      room: {
        name: body.roomName || 'Standard Room',
        tag: body.roomTag || 'Standard',
        bed: body.roomBed || 'King Bed',
        guests: Number(body.roomGuests || 2),
        sizeSqm: Number(body.roomSize || 30),
        image: body.roomImage || image,
        blurb: body.roomBlurb || body.summary || '',
      },
      map: {
        lat: Number(body.lat || 0),
        lng: Number(body.lng || 0),
      },
      contact: {
        phone: body.phone || '',
        email: body.email || '',
        website: body.website || '',
      },
      featured: body.featured === 'true' || body.featured === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (!stay.name || !stay.city || !stay.country) {
      return res.status(400).json({ error: 'name, city, and country are required' })
    }

    db.stays.unshift(stay)
    saveDb(db)
    res.status(201).json({ stay })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create stay' })
  }
})

app.patch('/api/stays/:id', upload.array('images', 8), (req, res) => {
  try {
    const db = loadDb()
    const stay = db.stays.find((s) => s.id === req.params.id)
    if (!stay) return res.status(404).json({ error: 'Stay not found' })

    const body = req.body || {}
    const uploaded = (req.files || []).map((f) => `/uploads/${f.filename}`)
    if (uploaded.length) {
      stay.gallery = Array.from(new Set([...(stay.gallery || []), ...uploaded]))
      if (!stay.image || body.setPrimary === 'true') stay.image = uploaded[0]
    }

    const assignable = [
      'name',
      'city',
      'country',
      'neighborhood',
      'type',
      'typeLabel',
      'summary',
      'badge',
      'image',
    ]
    for (const key of assignable) {
      if (body[key] !== undefined) stay[key] = body[key]
    }
    if (body.nightlyFrom !== undefined) stay.nightlyFrom = Number(body.nightlyFrom)
    if (body.rating !== undefined) stay.rating = Number(body.rating)
    if (body.amenities) {
      stay.amenities = String(body.amenities)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    if (body.highlights) {
      stay.highlights = String(body.highlights)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    if (body.summary) stay.summary = body.summary
    if (body.phone || body.email || body.website) {
      stay.contact = {
        ...(stay.contact || {}),
        phone: body.phone ?? stay.contact?.phone,
        email: body.email ?? stay.contact?.email,
        website: body.website ?? stay.contact?.website,
      }
    }
    stay.updatedAt = new Date().toISOString()
    saveDb(db)
    res.json({ stay })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update stay' })
  }
})

app.post('/api/uploads', upload.array('images', 8), (req, res) => {
  const files = (req.files || []).map((f) => ({
    url: `/uploads/${f.filename}`,
    filename: f.filename,
    size: f.size,
    mimetype: f.mimetype,
  }))
  if (!files.length) return res.status(400).json({ error: 'No images uploaded' })
  res.status(201).json({ files })
})

app.post('/api/auth/session', (req, res) => {
  const { email, name } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email is required' })
  const db = loadDb()
  const { user, created } = findOrCreateUser(db, { email, name })
  saveDb(db)
  res.json({ user: publicUser(user), created, loyalty: LOYALTY })
})

app.get('/api/users/:id', (req, res) => {
  const db = loadDb()
  const user = db.users.find((u) => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const ledger = db.ledger.filter((l) => l.userId === user.id).slice(0, 50)
  const bookings = db.bookings.filter((b) => b.userId === user.id)
  res.json({ user: publicUser(user), ledger, bookings, loyalty: LOYALTY })
})

app.post('/api/referrals/redeem', (req, res) => {
  const { userId, code } = req.body || {}
  if (!userId || !code) return res.status(400).json({ error: 'userId and code are required' })
  const db = loadDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.referredBy) return res.status(400).json({ error: 'Referral already redeemed' })

  const normalized = String(code).trim().toUpperCase()
  if (user.referralCode === normalized) {
    return res.status(400).json({ error: 'You cannot use your own referral code' })
  }
  const referrer = db.users.find((u) => u.referralCode === normalized)
  if (!referrer) return res.status(404).json({ error: 'Invalid referral code' })

  user.referredBy = referrer.id
  addLedger(db, {
    userId: referrer.id,
    points: LOYALTY.referralReferrer,
    reason: 'referral_reward',
    meta: { referredUserId: user.id, code: normalized },
  })
  addLedger(db, {
    userId: user.id,
    points: LOYALTY.referralReferee,
    reason: 'referral_bonus',
    meta: { referrerId: referrer.id, code: normalized },
  })
  db.referrals.push({
    id: uid('ref_'),
    referrerId: referrer.id,
    refereeId: user.id,
    code: normalized,
    createdAt: new Date().toISOString(),
  })
  saveDb(db)
  res.json({
    ok: true,
    user: publicUser(user),
    referrer: publicUser(referrer),
    awarded: {
      referrer: LOYALTY.referralReferrer,
      referee: LOYALTY.referralReferee,
    },
  })
})

app.post('/api/bookings', (req, res) => {
  const { userId, email, name, stayId, checkIn, checkOut, nights, total } = req.body || {}
  if (!stayId) return res.status(400).json({ error: 'stayId is required' })
  const db = loadDb()
  const stay = db.stays.find((s) => s.id === stayId)
  if (!stay) return res.status(404).json({ error: 'Stay not found' })

  let user
  if (userId) user = db.users.find((u) => u.id === userId)
  if (!user && email) {
    user = findOrCreateUser(db, { email, name }).user
  }
  if (!user) return res.status(400).json({ error: 'userId or email is required' })

  const nightCount = Number(nights || 1)
  const amount = Number(total || stay.nightlyFrom * nightCount)
  const pointsEarned = Math.max(50, Math.round(amount * LOYALTY.pointsPerDollar))
  const bookingRef = `NS${stay.city.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`

  const booking = {
    id: uid('bk_'),
    bookingRef,
    userId: user.id,
    stayId: stay.id,
    stayName: stay.name,
    city: stay.city,
    checkIn,
    checkOut,
    nights: nightCount,
    total: amount,
    pointsEarned,
    status: 'REQUESTED',
    createdAt: new Date().toISOString(),
  }
  db.bookings.unshift(booking)
  addLedger(db, {
    userId: user.id,
    points: pointsEarned,
    reason: 'booking_loyalty',
    meta: { bookingRef, stayId: stay.id, amount },
  })
  saveDb(db)
  res.status(201).json({ booking, user: publicUser(user), pointsEarned })
})

app.get('/api/loyalty/rules', (_req, res) => {
  res.json({
    rules: LOYALTY,
    copy: {
      welcome: `${LOYALTY.welcomeBonus} points when you join`,
      referral: `Share your code — you get ${LOYALTY.referralReferrer}, friends get ${LOYALTY.referralReferee}`,
      booking: `Earn ${LOYALTY.pointsPerDollar} points per $1 on confirmed stay requests`,
    },
  })
})

// SPA fallback for production
const dist = path.join(ROOT, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('/{*path}', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(400).json({ error: err.message || 'Request failed' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NomadStay API listening on :${PORT}`)
})
