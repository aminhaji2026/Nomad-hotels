import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { loadDb, saveDb, uid, makeReferralCode, DATA_DIR, audit } from './db.js'
import { seedStays, seedStaff, seedRooms, LOYALTY } from './seed.js'
import {
  hashPassword,
  verifyPassword,
  signToken,
  publicUser,
  authRequired,
  requireRoles,
} from './auth.js'
import { getGateway, PAYMENT_METHODS } from './payments.js'
import * as duffel from './duffel.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads')
const PORT = Number(process.env.PORT || 3000)

fs.mkdirSync(UPLOAD_DIR, { recursive: true })
fs.mkdirSync(DATA_DIR, { recursive: true })

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

function findOrCreateUser(db, { email, name, password, role = 'customer' }) {
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
    role,
    passwordHash: password ? hashPassword(password) : null,
    points: 0,
    referralCode: makeReferralCode(name || 'NS'),
    referredBy: null,
    stayIds: [],
    phone: '',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  if (role === 'customer') {
    addLedger(db, {
      userId: user.id,
      points: LOYALTY.welcomeBonus,
      reason: 'welcome_bonus',
      meta: { label: 'Welcome to NomadStay' },
    })
  }
  return { user, created: true }
}

function userFromAuth(db, req) {
  return db.users.find((u) => u.id === req.auth?.sub)
}

function canManageStay(user, stay) {
  if (!user || !stay) return false
  if (user.role === 'admin') return true
  if (user.role === 'hotel_admin') {
    return (user.stayIds || []).includes(stay.id) || stay.ownerId === user.id
  }
  return false
}

function hotelScope(user) {
  if (user.role === 'admin') return () => true
  const ids = new Set(user.stayIds || [])
  return (stay) => ids.has(stay.id) || stay.ownerId === user.id
}

function ensureSeed() {
  const db = loadDb()
  let changed = false

  for (const stay of seedStays) {
    const existing = db.stays.find((s) => s.id === stay.id)
    if (!existing) {
      db.stays.push({
        ...stay,
        ownerId: null,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      changed = true
    } else if (stay.id === 'damal-hotel-hargeisa' || stay.id === 'holiday-hotel-mogadishu') {
      const uploaded = (existing.gallery || []).filter((u) => String(u).startsWith('/uploads/'))
      Object.assign(existing, {
        ...stay,
        image: existing.image?.startsWith('/uploads/') ? existing.image : stay.image,
        gallery: Array.from(new Set([...(stay.gallery || []), ...uploaded])),
        status: existing.status || 'published',
        room: {
          ...stay.room,
          ...(existing.room?.image?.startsWith('/uploads/')
            ? { image: existing.room.image }
            : {}),
        },
        updatedAt: new Date().toISOString(),
      })
      changed = true
    }
  }

  for (const room of seedRooms) {
    if (!db.rooms.some((r) => r.id === room.id)) {
      db.rooms.push({ ...room, createdAt: new Date().toISOString() })
      changed = true
    }
  }

  for (const staff of seedStaff) {
    const email = staff.email.toLowerCase()
    let user = db.users.find((u) => u.email === email)
    if (!user) {
      user = {
        id: uid('usr_'),
        email,
        name: staff.name,
        role: staff.role,
        passwordHash: hashPassword(staff.password),
        points: 0,
        referralCode: makeReferralCode(staff.name),
        referredBy: null,
        stayIds: staff.stayIds || [],
        phone: staff.phone || '',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }
      db.users.push(user)
      changed = true
    } else {
      user.role = staff.role
      user.stayIds = staff.stayIds || []
      user.status = 'ACTIVE'
      if (!user.passwordHash) user.passwordHash = hashPassword(staff.password)
      changed = true
    }
    if (staff.role === 'hotel_admin') {
      for (const stayId of staff.stayIds || []) {
        const stay = db.stays.find((s) => s.id === stayId)
        if (stay && stay.ownerId !== user.id) {
          stay.ownerId = user.id
          changed = true
        }
      }
    }
  }

  if (changed) saveDb(db)
}

ensureSeed()

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, `${Date.now()}-${safe}`)
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) cb(new Error('Only images allowed'))
    else cb(null, true)
  },
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(UPLOAD_DIR))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'nomadstay-api',
    duffel: duffel.duffelStatus(),
    payments: PAYMENT_METHODS.map((m) => m.id),
  })
})

app.get('/api/meta/payment-methods', (_req, res) => {
  res.json({ methods: PAYMENT_METHODS })
})

// ── Auth ──
app.post('/api/auth/register', (req, res) => {
  const { email, name, password, phone } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' })
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }
  const db = loadDb()
  if (db.users.some((u) => u.email === String(email).trim().toLowerCase())) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }
  const { user } = findOrCreateUser(db, { email, name, password, role: 'customer' })
  if (phone) user.phone = phone
  saveDb(db)
  res.status(201).json({ user: publicUser(user), token: signToken(user), created: true, loyalty: LOYALTY })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password, portal } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' })
  const db = loadDb()
  const user = db.users.find((u) => u.email === String(email).trim().toLowerCase())
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  if (user.status && user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Account is suspended' })
  }
  const role = user.role || 'customer'
  if (portal === 'staff' && role === 'customer') {
    return res.status(403).json({ error: 'Staff credentials required for this portal' })
  }
  audit(db, { actorId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, meta: { portal } })
  saveDb(db)
  res.json({
    user: publicUser(user),
    token: signToken(user),
    portal: role === 'admin' ? 'admin' : role === 'hotel_admin' ? 'hotel_admin' : 'customer',
  })
})

app.post('/api/auth/session', (req, res) => {
  const { email, name, password } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email is required' })
  const db = loadDb()
  const { user, created } = findOrCreateUser(db, { email, name, password, role: 'customer' })
  if (password && !user.passwordHash) user.passwordHash = hashPassword(password)
  saveDb(db)
  res.json({
    user: publicUser(user),
    created,
    loyalty: LOYALTY,
    token: user.passwordHash ? signToken(user) : null,
  })
})

app.get('/api/auth/me', authRequired, (req, res) => {
  const db = loadDb()
  const user = userFromAuth(db, req)
  if (!user) return res.status(401).json({ error: 'User not found' })
  res.json({ user: publicUser(user), loyalty: LOYALTY })
})

// ── Stays ──
app.get('/api/stays', (req, res) => {
  const db = loadDb()
  const { city, q } = req.query
  let list = db.stays.filter((s) => (s.status || 'published') !== 'archived')
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
  const rooms = db.rooms.filter((r) => r.stayId === stay.id && r.status !== 'archived')
  res.json({ stay, rooms })
})

app.post(
  '/api/stays',
  authRequired,
  requireRoles('admin', 'hotel_admin'),
  upload.array('images', 8),
  (req, res) => {
    try {
      const db = loadDb()
      const actor = userFromAuth(db, req)
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
          : String(body.gallery)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
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
        map: { lat: Number(body.lat || 0), lng: Number(body.lng || 0) },
        contact: {
          phone: body.phone || '',
          email: body.email || '',
          website: body.website || '',
        },
        featured: body.featured === 'true' || body.featured === true,
        ownerId: actor.role === 'hotel_admin' ? actor.id : body.ownerId || actor.id,
        status: body.status || 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      if (!stay.name || !stay.city || !stay.country) {
        return res.status(400).json({ error: 'name, city, and country are required' })
      }
      if (actor.role === 'hotel_admin') {
        actor.stayIds = Array.from(new Set([...(actor.stayIds || []), stay.id]))
      }
      db.stays.unshift(stay)
      audit(db, { actorId: actor.id, action: 'CREATE', entity: 'Stay', entityId: stay.id })
      saveDb(db)
      res.status(201).json({ stay })
    } catch (err) {
      res.status(400).json({ error: err.message || 'Failed to create stay' })
    }
  },
)

app.patch(
  '/api/stays/:id',
  authRequired,
  requireRoles('admin', 'hotel_admin'),
  upload.array('images', 8),
  (req, res) => {
    try {
      const db = loadDb()
      const actor = userFromAuth(db, req)
      const stay = db.stays.find((s) => s.id === req.params.id)
      if (!stay) return res.status(404).json({ error: 'Stay not found' })
      if (!canManageStay(actor, stay)) return res.status(403).json({ error: 'Not your property' })
      const body = req.body || {}
      const uploaded = (req.files || []).map((f) => `/uploads/${f.filename}`)
      if (uploaded.length) {
        stay.gallery = Array.from(new Set([...(stay.gallery || []), ...uploaded]))
        if (!stay.image || body.setPrimary === 'true') stay.image = uploaded[0]
      }
      for (const key of [
        'name',
        'city',
        'country',
        'neighborhood',
        'type',
        'typeLabel',
        'summary',
        'badge',
        'image',
        'status',
      ]) {
        if (body[key] !== undefined) stay[key] = body[key]
      }
      if (body.nightlyFrom !== undefined) stay.nightlyFrom = Number(body.nightlyFrom)
      if (body.rating !== undefined) stay.rating = Number(body.rating)
      if (body.featured !== undefined) {
        stay.featured = body.featured === 'true' || body.featured === true
      }
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
      if (body.phone || body.email || body.website) {
        stay.contact = {
          ...(stay.contact || {}),
          phone: body.phone ?? stay.contact?.phone,
          email: body.email ?? stay.contact?.email,
          website: body.website ?? stay.contact?.website,
        }
      }
      stay.updatedAt = new Date().toISOString()
      audit(db, { actorId: actor.id, action: 'UPDATE', entity: 'Stay', entityId: stay.id })
      saveDb(db)
      res.json({ stay })
    } catch (err) {
      res.status(400).json({ error: err.message || 'Failed to update stay' })
    }
  },
)

app.post(
  '/api/uploads',
  authRequired,
  requireRoles('admin', 'hotel_admin'),
  upload.array('images', 8),
  (req, res) => {
    const files = (req.files || []).map((f) => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
    }))
    if (!files.length) return res.status(400).json({ error: 'No images uploaded' })
    res.status(201).json({ files })
  },
)

// ── Users / loyalty ──
app.get('/api/users/:id', authRequired, (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  if (actor.id !== req.params.id && actor.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const user = db.users.find((u) => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({
    user: publicUser(user),
    ledger: db.ledger.filter((l) => l.userId === user.id).slice(0, 50),
    bookings: db.bookings.filter((b) => b.userId === user.id),
    loyalty: LOYALTY,
  })
})

app.post('/api/referrals/redeem', (req, res) => {
  const { code, userId } = req.body || {}
  if (!code || !userId) return res.status(400).json({ error: 'userId and code are required' })
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
    awarded: { referrer: LOYALTY.referralReferrer, referee: LOYALTY.referralReferee },
  })
})

app.get('/api/loyalty/rules', (_req, res) => {
  res.json({
    rules: LOYALTY,
    copy: {
      welcome: `${LOYALTY.welcomeBonus} points when you join`,
      referral: `Share your code — you get ${LOYALTY.referralReferrer}, friends get ${LOYALTY.referralReferee}`,
      booking: `Earn ${LOYALTY.pointsPerDollar} points per $1 on confirmed stays`,
    },
  })
})

// ── Bookings + payments (Creams-style gateways) ──
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      userId,
      email,
      name,
      stayId,
      checkIn,
      checkOut,
      nights,
      total,
      roomId,
      gateway = 'mock',
      phone,
      guests,
    } = req.body || {}
    if (!stayId) return res.status(400).json({ error: 'stayId is required' })
    const db = loadDb()
    const stay = db.stays.find((s) => s.id === stayId)
    if (!stay) return res.status(404).json({ error: 'Stay not found' })

    let user
    if (userId) user = db.users.find((u) => u.id === userId)
    if (!user && email) user = findOrCreateUser(db, { email, name }).user
    if (!user) return res.status(400).json({ error: 'userId or email is required' })

    const nightCount = Number(nights || 1)
    const amount = Number(total || stay.nightlyFrom * nightCount)
    const pointsEarned = Math.max(50, Math.round(amount * LOYALTY.pointsPerDollar))
    const bookingRef = `NS${stay.city.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`

    const booking = {
      id: uid('bk_'),
      bookingRef,
      userId: user.id,
      guestName: name || user.name,
      guestEmail: email || user.email,
      guestPhone: phone || user.phone || '',
      guests: Number(guests || 2),
      stayId: stay.id,
      stayName: stay.name,
      city: stay.city,
      roomId: roomId || null,
      checkIn,
      checkOut,
      nights: nightCount,
      total: amount,
      pointsEarned,
      status: 'REQUESTED',
      paymentStatus: 'UNPAID',
      paymentId: null,
      notes: [],
      source: 'direct',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.bookings.unshift(booking)

    const gw = getGateway(gateway)
    const result = await gw.createPayment({
      amount,
      currency: db.settings?.defaultCurrency || 'USD',
      reference: booking.id,
      customerPhone: booking.guestPhone,
    })

    const payment = {
      id: uid('pay_'),
      bookingId: booking.id,
      userId: user.id,
      gateway: String(gateway).toLowerCase(),
      providerRef: result.providerRef,
      amount,
      currency: db.settings?.defaultCurrency || 'USD',
      status: result.status,
      checkoutUrl: result.checkoutUrl || null,
      message: result.message || null,
      verified: result.status === 'CONFIRMED',
      createdAt: new Date().toISOString(),
      verifiedAt: result.status === 'CONFIRMED' ? new Date().toISOString() : null,
    }
    db.payments.unshift(payment)
    booking.paymentId = payment.id
    booking.paymentStatus = result.status === 'CONFIRMED' ? 'PAID' : 'PENDING'
    if (result.status === 'CONFIRMED') {
      booking.status = 'CONFIRMED'
      addLedger(db, {
        userId: user.id,
        points: pointsEarned,
        reason: 'booking_loyalty',
        meta: { bookingRef, stayId: stay.id, amount },
      })
    }
    saveDb(db)
    res.status(201).json({
      booking,
      user: publicUser(user),
      pointsEarned: booking.paymentStatus === 'PAID' ? pointsEarned : 0,
      payment,
    })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Booking failed' })
  }
})

app.post('/api/payments/webhooks/:gateway', async (req, res) => {
  try {
    const gateway = getGateway(req.params.gateway)
    const v = await gateway.verifyWebhook(req.body, req.headers['x-signature'])
    const db = loadDb()
    const payment = db.payments.find((p) => p.providerRef === v.providerRef)
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (v.confirmed && !payment.verified) {
      payment.verified = true
      payment.status = 'CONFIRMED'
      payment.verifiedAt = new Date().toISOString()
      const booking = db.bookings.find((b) => b.id === payment.bookingId)
      if (booking) {
        booking.paymentStatus = 'PAID'
        booking.status = 'CONFIRMED'
        booking.updatedAt = new Date().toISOString()
        const already = db.ledger.some(
          (l) => l.meta?.bookingRef === booking.bookingRef && l.reason === 'booking_loyalty',
        )
        if (!already) {
          addLedger(db, {
            userId: booking.userId,
            points: booking.pointsEarned,
            reason: 'booking_loyalty',
            meta: {
              bookingRef: booking.bookingRef,
              stayId: booking.stayId,
              amount: booking.total,
            },
          })
        }
      }
      saveDb(db)
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.post('/api/payments/:id/confirm-demo', authRequired, (req, res) => {
  const db = loadDb()
  const payment = db.payments.find((p) => p.id === req.params.id)
  if (!payment) return res.status(404).json({ error: 'Payment not found' })
  payment.verified = true
  payment.status = 'CONFIRMED'
  payment.verifiedAt = new Date().toISOString()
  const booking = db.bookings.find((b) => b.id === payment.bookingId)
  if (booking) {
    booking.paymentStatus = 'PAID'
    booking.status = 'CONFIRMED'
    booking.updatedAt = new Date().toISOString()
  }
  saveDb(db)
  res.json({ payment, booking })
})

// ── Duffel Stays ──
app.get('/api/duffel/status', (_req, res) => {
  res.json(duffel.duffelStatus())
})

app.post('/api/duffel/search', async (req, res) => {
  try {
    const body = req.body || {}
    const payload = {
      check_in_date: body.check_in_date || body.checkIn,
      check_out_date: body.check_out_date || body.checkOut,
      rooms: Number(body.rooms || 1),
      guests: body.guests || [{ type: 'adult' }, { type: 'adult' }],
      location: body.location || {
        radius: Number(body.radius || 8),
        geographic_coordinates: {
          latitude: Number(body.lat || 9.56),
          longitude: Number(body.lng || 44.06),
        },
      },
    }
    if (!payload.check_in_date || !payload.check_out_date) {
      return res.status(400).json({ error: 'check_in_date and check_out_date are required' })
    }
    res.json(await duffel.searchStays(payload))
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message, details: err.details })
  }
})

app.post('/api/duffel/search-results/:id/rates', async (req, res) => {
  try {
    res.json(await duffel.fetchAllRates(req.params.id))
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

app.post('/api/duffel/quotes', async (req, res) => {
  try {
    res.json(await duffel.createQuote(req.body || {}))
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

app.post('/api/duffel/bookings', authRequired, async (req, res) => {
  try {
    const data = await duffel.createBooking(req.body || {})
    const db = loadDb()
    const quote = data.data
    const booking = {
      id: uid('bk_'),
      bookingRef: quote.reference || `DUF${Date.now().toString().slice(-6)}`,
      userId: req.auth.sub,
      guestName: req.body?.guests?.[0]
        ? `${req.body.guests[0].given_name} ${req.body.guests[0].family_name}`
        : 'Guest',
      guestEmail: req.body?.email || '',
      guestPhone: req.body?.phone_number || '',
      stayId: req.body?.stayId || quote.accommodation?.id || 'duffel',
      stayName: req.body?.stayName || 'Duffel Stay',
      city: req.body?.city || '',
      checkIn: req.body?.check_in_date,
      checkOut: req.body?.check_out_date,
      nights: Number(req.body?.nights || 1),
      total: Number(quote.total_amount || req.body?.total || 0),
      pointsEarned: 0,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      source: 'duffel',
      duffelBookingId: quote.id,
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.bookings.unshift(booking)
    saveDb(db)
    res.status(201).json({ duffel: data, booking })
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

app.post(
  '/api/duffel/bookings/:id/cancel',
  authRequired,
  requireRoles('admin', 'hotel_admin'),
  async (req, res) => {
    try {
      const data = await duffel.cancelBooking(req.params.id)
      const db = loadDb()
      const booking = db.bookings.find(
        (b) => b.duffelBookingId === req.params.id || b.id === req.params.id,
      )
      if (booking) {
        booking.status = 'CANCELLED'
        booking.updatedAt = new Date().toISOString()
        saveDb(db)
      }
      res.json({ duffel: data, booking })
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message })
    }
  },
)

// ── Hotel admin ──
app.get('/api/hotel/dashboard', authRequired, requireRoles('hotel_admin', 'admin'), (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  const stays = db.stays.filter(hotelScope(actor))
  const stayIds = new Set(stays.map((s) => s.id))
  const bookings = db.bookings.filter((b) => stayIds.has(b.stayId))
  const payments = db.payments.filter((p) => bookings.some((b) => b.id === p.bookingId))
  const rooms = db.rooms.filter((r) => stayIds.has(r.stayId))
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN')
  const revenue = confirmed.reduce((sum, b) => sum + Number(b.total || 0), 0)
  const pending = bookings.filter((b) => b.status === 'REQUESTED' || b.paymentStatus === 'PENDING')
  const arriving = bookings.filter((b) => {
    if (!b.checkIn) return false
    const diff = (new Date(b.checkIn) - new Date()) / 86400000
    return diff >= 0 && diff <= 7 && b.status !== 'CANCELLED'
  })
  const inventory = rooms.reduce((n, r) => n + Number(r.inventory || 0), 0)
  res.json({
    summary: {
      properties: stays.length,
      rooms: inventory,
      bookings: bookings.length,
      pending: pending.length,
      revenue,
      arrivingSoon: arriving.length,
      occupancyHint: inventory
        ? Math.min(98, Math.round((confirmed.length / Math.max(1, inventory)) * 100))
        : 0,
    },
    stays,
    recentBookings: bookings.slice(0, 12),
    pending,
    rooms,
    payments: payments.slice(0, 12),
  })
})

app.get('/api/hotel/bookings', authRequired, requireRoles('hotel_admin', 'admin'), (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  const stayIds = new Set(db.stays.filter(hotelScope(actor)).map((s) => s.id))
  let bookings = db.bookings.filter((b) => stayIds.has(b.stayId))
  if (req.query.status) {
    bookings = bookings.filter((b) => b.status === String(req.query.status).toUpperCase())
  }
  res.json({ bookings, count: bookings.length })
})

app.patch(
  '/api/hotel/bookings/:id',
  authRequired,
  requireRoles('hotel_admin', 'admin'),
  (req, res) => {
    const db = loadDb()
    const actor = userFromAuth(db, req)
    const booking = db.bookings.find((b) => b.id === req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    const stay = db.stays.find((s) => s.id === booking.stayId)
    if (!stay || !canManageStay(actor, stay)) return res.status(403).json({ error: 'Forbidden' })
    const { status, note, checkIn, checkOut } = req.body || {}
    if (status) booking.status = String(status).toUpperCase()
    if (checkIn) booking.checkIn = checkIn
    if (checkOut) booking.checkOut = checkOut
    if (note) {
      booking.notes = booking.notes || []
      booking.notes.push({
        id: uid('note_'),
        text: note,
        authorId: actor.id,
        authorName: actor.name,
        createdAt: new Date().toISOString(),
      })
    }
    booking.updatedAt = new Date().toISOString()
    audit(db, {
      actorId: actor.id,
      action: 'UPDATE',
      entity: 'Booking',
      entityId: booking.id,
      meta: { status },
    })
    saveDb(db)
    res.json({ booking })
  },
)

app.get('/api/hotel/rooms', authRequired, requireRoles('hotel_admin', 'admin'), (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  const stayIds = new Set(db.stays.filter(hotelScope(actor)).map((s) => s.id))
  res.json({ rooms: db.rooms.filter((r) => stayIds.has(r.stayId)) })
})

app.post('/api/hotel/rooms', authRequired, requireRoles('hotel_admin', 'admin'), (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  const body = req.body || {}
  const stay = db.stays.find((s) => s.id === body.stayId)
  if (!stay || !canManageStay(actor, stay)) return res.status(403).json({ error: 'Forbidden' })
  const room = {
    id: uid('room_'),
    stayId: stay.id,
    name: body.name || 'Room',
    tag: body.tag || 'Standard',
    bed: body.bed || 'King Bed',
    guests: Number(body.guests || 2),
    sizeSqm: Number(body.sizeSqm || 28),
    nightlyRate: Number(body.nightlyRate || stay.nightlyFrom),
    inventory: Number(body.inventory || 1),
    image: body.image || stay.image,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  db.rooms.push(room)
  if (room.nightlyRate < stay.nightlyFrom) stay.nightlyFrom = room.nightlyRate
  saveDb(db)
  res.status(201).json({ room })
})

app.patch('/api/hotel/rooms/:id', authRequired, requireRoles('hotel_admin', 'admin'), (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  const room = db.rooms.find((r) => r.id === req.params.id)
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const stay = db.stays.find((s) => s.id === room.stayId)
  if (!stay || !canManageStay(actor, stay)) return res.status(403).json({ error: 'Forbidden' })
  const body = req.body || {}
  for (const key of ['name', 'tag', 'bed', 'image', 'status']) {
    if (body[key] !== undefined) room[key] = body[key]
  }
  for (const key of ['guests', 'sizeSqm', 'nightlyRate', 'inventory']) {
    if (body[key] !== undefined) room[key] = Number(body[key])
  }
  saveDb(db)
  res.json({ room })
})

app.get('/api/hotel/messages', authRequired, requireRoles('hotel_admin', 'admin'), (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  const stayIds = new Set(db.stays.filter(hotelScope(actor)).map((s) => s.id))
  const messages = (db.messages || []).filter(
    (m) => stayIds.has(m.stayId) || m.toUserId === actor.id || actor.role === 'admin',
  )
  res.json({ messages: messages.slice(0, 100) })
})

app.post('/api/hotel/messages', authRequired, (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  const { stayId, bookingId, body: text, toUserId } = req.body || {}
  if (!text) return res.status(400).json({ error: 'Message body required' })
  const message = {
    id: uid('msg_'),
    stayId: stayId || null,
    bookingId: bookingId || null,
    fromUserId: actor.id,
    fromName: actor.name,
    toUserId: toUserId || null,
    body: String(text),
    read: false,
    createdAt: new Date().toISOString(),
  }
  db.messages.unshift(message)
  saveDb(db)
  res.status(201).json({ message })
})

app.get('/api/hotel/calendar', authRequired, requireRoles('hotel_admin', 'admin'), (req, res) => {
  const db = loadDb()
  const actor = userFromAuth(db, req)
  const stayIds = new Set(db.stays.filter(hotelScope(actor)).map((s) => s.id))
  const bookings = db.bookings.filter((b) => stayIds.has(b.stayId) && b.status !== 'CANCELLED')
  res.json({
    events: bookings.map((b) => ({
      id: b.id,
      title: `${b.guestName || 'Guest'} · ${b.stayName}`,
      start: b.checkIn,
      end: b.checkOut,
      status: b.status,
      stayId: b.stayId,
    })),
  })
})

// ── Platform admin ──
app.get('/api/admin/dashboard', authRequired, requireRoles('admin'), (_req, res) => {
  const db = loadDb()
  const customers = db.users.filter((u) => (u.role || 'customer') === 'customer')
  const hotelAdmins = db.users.filter((u) => u.role === 'hotel_admin')
  const revenue = db.bookings
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((s, b) => s + Number(b.total || 0), 0)
  res.json({
    summary: {
      stays: db.stays.length,
      customers: customers.length,
      hotelAdmins: hotelAdmins.length,
      bookings: db.bookings.length,
      payments: db.payments.length,
      revenue,
      pendingPayments: db.payments.filter((p) => p.status === 'PENDING').length,
    },
    recentBookings: db.bookings.slice(0, 15),
    recentPayments: db.payments.slice(0, 15),
    audit: (db.audit || []).slice(0, 20),
    duffel: duffel.duffelStatus(),
    settings: db.settings,
  })
})

app.get('/api/admin/users', authRequired, requireRoles('admin'), (_req, res) => {
  res.json({ users: loadDb().users.map(publicUser) })
})

app.post('/api/admin/users', authRequired, requireRoles('admin'), (req, res) => {
  const db = loadDb()
  const { email, name, password, role = 'hotel_admin', stayIds = [], phone } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  if (db.users.some((u) => u.email === String(email).toLowerCase())) {
    return res.status(409).json({ error: 'Email already exists' })
  }
  const user = {
    id: uid('usr_'),
    email: String(email).toLowerCase(),
    name: name || email,
    role,
    passwordHash: hashPassword(password),
    points: 0,
    referralCode: makeReferralCode(name || 'NS'),
    referredBy: null,
    stayIds,
    phone: phone || '',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  for (const stayId of stayIds) {
    const stay = db.stays.find((s) => s.id === stayId)
    if (stay) stay.ownerId = user.id
  }
  audit(db, { actorId: req.auth.sub, action: 'CREATE', entity: 'User', entityId: user.id })
  saveDb(db)
  res.status(201).json({ user: publicUser(user) })
})

app.patch('/api/admin/users/:id', authRequired, requireRoles('admin'), (req, res) => {
  const db = loadDb()
  const user = db.users.find((u) => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const { role, status, stayIds, name, phone } = req.body || {}
  if (role) user.role = role
  if (status) user.status = status
  if (Array.isArray(stayIds)) user.stayIds = stayIds
  if (name) user.name = name
  if (phone !== undefined) user.phone = phone
  audit(db, {
    actorId: req.auth.sub,
    action: 'UPDATE',
    entity: 'User',
    entityId: user.id,
    meta: { role, status },
  })
  saveDb(db)
  res.json({ user: publicUser(user) })
})

app.get('/api/admin/bookings', authRequired, requireRoles('admin'), (_req, res) => {
  res.json({ bookings: loadDb().bookings })
})

app.get('/api/admin/payments', authRequired, requireRoles('admin'), (_req, res) => {
  res.json({ payments: loadDb().payments, methods: PAYMENT_METHODS })
})

app.get('/api/admin/settings', authRequired, requireRoles('admin'), (_req, res) => {
  const db = loadDb()
  res.json({
    settings: db.settings,
    duffel: duffel.duffelStatus(),
    paymentMethods: PAYMENT_METHODS,
    env: {
      zaadConfigured: Boolean(process.env.ZAAD_API_KEY),
      internationalConfigured: Boolean(
        process.env.INTERNATIONAL_GATEWAY_KEY || process.env.STRIPE_SECRET_KEY,
      ),
      duffelConfigured: duffel.duffelConfigured(),
    },
  })
})

app.patch('/api/admin/settings', authRequired, requireRoles('admin'), (req, res) => {
  const db = loadDb()
  db.settings = { ...db.settings, ...(req.body || {}) }
  audit(db, {
    actorId: req.auth.sub,
    action: 'UPDATE',
    entity: 'Settings',
    entityId: 'platform',
  })
  saveDb(db)
  res.json({ settings: db.settings })
})

app.delete('/api/admin/stays/:id', authRequired, requireRoles('admin'), (req, res) => {
  const db = loadDb()
  const stay = db.stays.find((s) => s.id === req.params.id)
  if (!stay) return res.status(404).json({ error: 'Stay not found' })
  stay.status = 'archived'
  stay.updatedAt = new Date().toISOString()
  saveDb(db)
  res.json({ stay })
})

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
  console.log(`Duffel mode: ${duffel.duffelStatus().mode}`)
})
