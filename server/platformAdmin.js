/** Platform admin modules (PRD phases 2–11). */

export function ensurePlatformCollections(db) {
  const lists = [
    'applications',
    'refunds',
    'payouts',
    'financeLedger',
    'promotions',
    'ads',
    'reviews',
    'cmsPages',
    'destinations',
    'supportTickets',
    'fraudFlags',
    'notificationTemplates',
    'languages',
    'taxRules',
    'adminRoles',
    'inventoryHolds',
    'ratePlans',
  ]
  for (const key of lists) {
    if (!Array.isArray(db[key])) db[key] = []
  }
  if (!db.taxonomy || typeof db.taxonomy !== 'object') {
    db.taxonomy = { propertyTypes: [], amenities: [], bedTypes: [], policyTemplates: [] }
  }
  if (!Array.isArray(db.taxonomy.propertyTypes)) db.taxonomy.propertyTypes = db.taxonomy.propertyTypes || []
  db.settings = {
    defaultCommissionRate: 0.12,
    makerCheckerThreshold: 500,
    baseLanguage: 'en',
    taxInclusiveDisplay: false,
    loyalty: {
      welcomeBonus: 100,
      pointsPerDollar: 1,
      redemptionValue: 0.01,
      tiers: [
        { id: 'member', name: 'Member', minPoints: 0 },
        { id: 'silver', name: 'Silver', minPoints: 1000 },
        { id: 'gold', name: 'Gold', minPoints: 5000 },
      ],
    },
    ...(db.settings || {}),
  }
  return db
}

export function seedPlatformAdmin(db, { uid, audit }) {
  ensurePlatformCollections(db)
  let changed = false
  const now = new Date().toISOString()

  if (!db.applications.length) {
    const apps = [
      {
        id: uid('app_'),
        propertyName: 'Berbera Coastal Inn',
        city: 'Berbera',
        country: 'Somaliland',
        type: 'hotel',
        typeLabel: 'Boutique Hotel',
        ownerName: 'Amina Yusuf',
        ownerEmail: 'amina@berberacoastal.example',
        ownerPhone: '+252-63-400-1100',
        status: 'in_review',
        progress: 70,
        assignedTo: null,
        documents: [
          { id: 'doc_reg', label: 'Business registration', status: 'received' },
          { id: 'doc_id', label: 'Owner identification', status: 'received' },
          { id: 'doc_bank', label: 'Bank & payout details', status: 'received' },
          { id: 'doc_license', label: 'Hotel licence', status: 'missing' },
          { id: 'doc_tax', label: 'Tax information', status: 'received' },
          { id: 'doc_contract', label: 'Commission agreement', status: 'received' },
        ],
        checklist: [
          { id: 'loc', label: 'Verify location', done: true },
          { id: 'rooms', label: 'Verify room information', done: true },
          { id: 'photos', label: 'Review property photos', done: false },
          { id: 'bank', label: 'Verify payout beneficiary', done: false },
        ],
        reviewerNotes: [],
        photos: ['/hotels/damal/exterior.jpg'],
        commissionRate: 0.12,
        verificationExpiresAt: null,
        submittedAt: now,
        updatedAt: now,
      },
      {
        id: uid('app_'),
        propertyName: 'Garowe Garden Guest House',
        city: 'Garowe',
        country: 'Puntland',
        type: 'guest_house',
        typeLabel: 'Guest House',
        ownerName: 'Hassan Nur',
        ownerEmail: 'hassan@garowegarden.example',
        ownerPhone: '+252-90-500-2200',
        status: 'submitted',
        progress: 40,
        assignedTo: null,
        documents: [
          { id: 'doc_reg', label: 'Business registration', status: 'received' },
          { id: 'doc_id', label: 'Owner identification', status: 'received' },
          { id: 'doc_bank', label: 'Bank & payout details', status: 'missing' },
          { id: 'doc_license', label: 'Hotel licence', status: 'missing' },
          { id: 'doc_tax', label: 'Tax information', status: 'missing' },
          { id: 'doc_contract', label: 'Commission agreement', status: 'missing' },
        ],
        checklist: [
          { id: 'loc', label: 'Verify location', done: false },
          { id: 'rooms', label: 'Verify room information', done: false },
          { id: 'photos', label: 'Review property photos', done: false },
          { id: 'bank', label: 'Verify payout beneficiary', done: false },
        ],
        reviewerNotes: [{ text: 'Waiting on bank letter.', at: now }],
        photos: [],
        commissionRate: 0.14,
        verificationExpiresAt: null,
        submittedAt: now,
        updatedAt: now,
      },
    ]
    db.applications = apps
    for (const application of apps) {
      const stayId = `pending-${application.id}`
      if (!db.stays.some((s) => s.id === stayId)) {
        db.stays.push({
          id: stayId,
          name: application.propertyName,
          city: application.city,
          country: application.country,
          neighborhood: application.city,
          type: application.type,
          typeLabel: application.typeLabel,
          image: application.photos[0] || '/hotels/damal/exterior.jpg',
          gallery: application.photos,
          nightlyFrom: 65,
          rating: 0,
          reviews: 0,
          guestScore: 0,
          amenities: ['Wi‑Fi', 'Breakfast'],
          highlights: ['New applicant'],
          summary: `${application.propertyName} — pending platform approval.`,
          room: {
            name: 'Standard Room',
            tag: 'New',
            bed: 'Double',
            guests: 2,
            sizeSqm: 24,
            image: '/hotels/damal/deluxe.jpg',
            blurb: 'Pending verification',
          },
          map: { lat: 10.4, lng: 45.0 },
          contact: { email: application.ownerEmail, phone: application.ownerPhone },
          featured: false,
          ownerId: null,
          status: 'pending',
          applicationId: application.id,
          internalNotes: '',
          createdAt: now,
          updatedAt: now,
        })
      }
    }
    changed = true
  }

  if (!db.destinations.length) {
    db.destinations = [
      {
        id: uid('dest_'),
        name: 'Hargeisa',
        country: 'Somaliland',
        type: 'city',
        popularity: 96,
        featured: true,
        summary: 'Capital gateway for business and diaspora travel.',
        image: '/hotels/damal/exterior.jpg',
        status: 'active',
      },
      {
        id: uid('dest_'),
        name: 'Mogadishu',
        country: 'Somalia',
        type: 'city',
        popularity: 88,
        featured: true,
        summary: 'Coastal capital with growing hospitality inventory.',
        image: '/hotels/holiday/exterior.jpg',
        status: 'active',
      },
      {
        id: uid('dest_'),
        name: 'Berbera',
        country: 'Somaliland',
        type: 'city',
        popularity: 72,
        featured: false,
        summary: 'Port city and beach destination.',
        image: '/hotels/damal/exterior.jpg',
        status: 'active',
      },
    ]
    changed = true
  }

  if (!(db.taxonomy.propertyTypes || []).length) {
    db.taxonomy = {
      propertyTypes: [
        { id: 'hotel', label: 'Hotel', active: true },
        { id: 'guest_house', label: 'Guest house', active: true },
        { id: 'holiday_home', label: 'Holiday home', active: true },
        { id: 'apartment', label: 'Serviced apartment', active: true },
      ],
      amenities: [
        { id: 'wifi', label: 'Wi‑Fi', active: true },
        { id: 'breakfast', label: 'Breakfast', active: true },
        { id: 'parking', label: 'Parking', active: true },
        { id: 'pool', label: 'Pool', active: true },
        { id: 'airport_transfer', label: 'Airport transfer', active: true },
      ],
      bedTypes: [
        { id: 'king', label: 'King', active: true },
        { id: 'queen', label: 'Queen', active: true },
        { id: 'twin', label: 'Twin', active: true },
        { id: 'double', label: 'Double', active: true },
      ],
      policyTemplates: [
        {
          id: 'flex',
          label: 'Flexible cancellation',
          body: 'Free cancellation until 24 hours before check-in.',
          active: true,
        },
        {
          id: 'strict',
          label: 'Strict cancellation',
          body: 'Non-refundable after booking confirmation.',
          active: true,
        },
      ],
    }
    changed = true
  }

  if (!db.promotions.length) {
    db.promotions = [
      {
        id: uid('promo_'),
        name: 'First booking — Horn welcome',
        type: 'percent',
        value: 10,
        code: 'HORN10',
        status: 'active',
        fundedBy: 'platform',
        minBookingValue: 80,
        usageLimit: 500,
        usedCount: 12,
        perCustomerLimit: 1,
        validFrom: now.slice(0, 10),
        validTo: '2026-12-31',
        destinations: ['Hargeisa', 'Mogadishu'],
        stackable: false,
        createdAt: now,
      },
    ]
    changed = true
  }

  if (!db.ads.length) {
    const stay = db.stays.find((s) => (s.status || 'published') === 'published')
    db.ads = [
      {
        id: uid('ad_'),
        name: 'Homepage · featured stay',
        placement: 'homepage_banner',
        stayId: stay?.id || null,
        status: 'active',
        budget: 400,
        spent: 86,
        impressions: 4200,
        clicks: 210,
        conversions: 9,
        targeting: { countries: ['SO', 'ET'], devices: ['mobile', 'desktop'] },
        startsAt: now.slice(0, 10),
        endsAt: '2026-10-31',
        createdAt: now,
      },
    ]
    changed = true
  }

  if (!db.reviews.length) {
    const stay = db.stays.find((s) => (s.status || 'published') === 'published')
    if (stay) {
      db.reviews = [
        {
          id: uid('rev_'),
          stayId: stay.id,
          stayName: stay.name,
          guestName: 'Khadra M.',
          rating: 5,
          title: 'Impeccable stay',
          body: 'Quiet rooms, warm staff, and a seamless airport transfer.',
          status: 'published',
          verifiedStay: true,
          reported: false,
          hotelResponse: 'Mahadsanid — welcome back anytime.',
          createdAt: now,
        },
        {
          id: uid('rev_'),
          stayId: stay.id,
          stayName: stay.name,
          guestName: 'Anon',
          rating: 1,
          title: 'Suspicious duplicate?',
          body: 'Worst ever!!!!',
          status: 'flagged',
          verifiedStay: false,
          reported: true,
          hotelResponse: '',
          createdAt: now,
        },
      ]
      changed = true
    }
  }

  if (!db.cmsPages.length) {
    db.cmsPages = [
      {
        id: uid('cms_'),
        slug: 'home',
        title: 'Homepage',
        type: 'homepage',
        status: 'published',
        seoTitle: 'NomadStay — Atelier stays across the Horn',
        seoDescription: 'Handpicked sanctuaries in Hargeisa, Mogadishu, and beyond.',
        body: 'Hero and featured destinations.',
        updatedAt: now,
      },
      {
        id: uid('cms_'),
        slug: 'help/cancellation',
        title: 'Cancellation guidance',
        type: 'help',
        status: 'published',
        seoTitle: 'Cancellation guidance',
        seoDescription: 'How cancellations and refunds work on NomadStay.',
        body: 'Policy snapshot and guest steps.',
        updatedAt: now,
      },
      {
        id: uid('cms_'),
        slug: 'legal/privacy',
        title: 'Privacy policy',
        type: 'legal',
        status: 'draft',
        seoTitle: 'Privacy policy',
        seoDescription: 'How we handle guest data.',
        body: 'Draft privacy policy.',
        updatedAt: now,
      },
    ]
    changed = true
  }

  if (!db.supportTickets.length) {
    db.supportTickets = [
      {
        id: uid('tkt_'),
        subject: 'Late check-in assistance',
        category: 'booking',
        priority: 'high',
        status: 'open',
        customerEmail: 'guest@example.com',
        stayName: db.stays[0]?.name || null,
        bookingRef: db.bookings[0]?.bookingRef || null,
        assignee: null,
        messages: [{ from: 'customer', body: 'Flight lands at 23:40 — can I still check in?', at: now }],
        createdAt: now,
        updatedAt: now,
      },
    ]
    changed = true
  }

  if (!db.fraudFlags.length) {
    db.fraudFlags = [
      {
        id: uid('frd_'),
        type: 'velocity',
        severity: 'medium',
        status: 'open',
        summary: '3 failed card attempts from same device fingerprint',
        entityType: 'payment',
        entityId: db.payments[0]?.id || 'n/a',
        createdAt: now,
      },
    ]
    changed = true
  }

  if (!db.notificationTemplates.length) {
    db.notificationTemplates = [
      {
        id: uid('tpl_'),
        channel: 'email',
        key: 'booking_confirmed',
        name: 'Booking confirmation',
        language: 'en',
        subject: 'Your NomadStay is confirmed — {{bookingRef}}',
        body: 'Hello {{guestName}}, your stay at {{stayName}} is confirmed.',
        status: 'active',
      },
      {
        id: uid('tpl_'),
        channel: 'sms',
        key: 'booking_confirmed',
        name: 'Booking confirmation SMS',
        language: 'so',
        subject: null,
        body: 'NomadStay: {{bookingRef}} waa la xaqiijiyay. {{stayName}}',
        status: 'active',
      },
    ]
    changed = true
  }

  if (!db.languages.length) {
    db.languages = [
      { code: 'en', name: 'English', rtl: false, enabled: true },
      { code: 'so', name: 'Somali', rtl: false, enabled: true },
      { code: 'ar', name: 'Arabic', rtl: true, enabled: true },
    ]
    changed = true
  }

  if (!db.taxRules.length) {
    db.taxRules = [
      {
        id: uid('tax_'),
        name: 'Somaliland service levy',
        country: 'Somaliland',
        city: null,
        rate: 0.05,
        inclusive: false,
        effectiveFrom: '2026-01-01',
        status: 'active',
      },
      {
        id: uid('tax_'),
        name: 'Mogadishu tourism fee',
        country: 'Somalia',
        city: 'Mogadishu',
        rate: 0.03,
        inclusive: false,
        effectiveFrom: '2026-01-01',
        status: 'active',
      },
    ]
    changed = true
  }

  if (!db.adminRoles.length) {
    db.adminRoles = [
      {
        id: 'role_super',
        name: 'Super admin',
        permissions: ['*'],
        financeAccess: true,
        customerDataAccess: true,
        approvalRights: true,
      },
      {
        id: 'role_ops',
        name: 'Operations',
        permissions: ['hotels.read', 'hotels.write', 'bookings.read', 'bookings.write', 'support.*'],
        financeAccess: false,
        customerDataAccess: true,
        approvalRights: false,
      },
      {
        id: 'role_finance',
        name: 'Finance',
        permissions: ['payments.*', 'refunds.*', 'payouts.*', 'commissions.*', 'ledger.read'],
        financeAccess: true,
        customerDataAccess: false,
        approvalRights: true,
      },
    ]
    changed = true
  }

  if (!db.ratePlans.length) {
    db.ratePlans = (db.rooms || []).slice(0, 8).map((room) => ({
      id: uid('rate_'),
      stayId: room.stayId,
      roomId: room.id,
      name: `${room.name} · Flexible`,
      nightlyRate: room.nightlyRate || 100,
      minStay: 1,
      maxStay: 30,
      refundable: true,
      status: 'active',
      weekendMultiplier: 1.1,
      createdAt: now,
    }))
    changed = true
  }

  if (!db.financeLedger.length) {
    const rate = Number(db.settings.defaultCommissionRate || 0.12)
    for (const booking of (db.bookings || []).filter((b) => b.paymentStatus === 'PAID').slice(0, 20)) {
      const commission = Math.round(Number(booking.total || 0) * rate)
      const hotelNet = Math.round(Number(booking.total || 0) - commission)
      db.financeLedger.push(
        {
          id: uid('fin_'),
          type: 'commission',
          bookingId: booking.id,
          stayId: booking.stayId,
          amount: commission,
          currency: 'USD',
          status: 'posted',
          note: `Platform commission ${Math.round(rate * 100)}%`,
          createdAt: booking.createdAt || now,
        },
        {
          id: uid('fin_'),
          type: 'hotel_payable',
          bookingId: booking.id,
          stayId: booking.stayId,
          amount: hotelNet,
          currency: 'USD',
          status: 'pending_payout',
          note: 'Net hotel payable',
          createdAt: booking.createdAt || now,
        },
      )
    }
    if (db.financeLedger.length) changed = true
  }

  if (changed) {
    audit(db, {
      actorId: 'system',
      action: 'SEED',
      entity: 'PlatformAdmin',
      entityId: 'modules',
      meta: { phases: '2-11' },
    })
  }
  return changed
}

export function registerPlatformAdmin(app, deps) {
  const { authRequired, requireRoles, loadDb, saveDb, uid, audit, publicUser } = deps
  const guard = [authRequired, requireRoles('admin')]

  const run = (handler) => (req, res) => {
    try {
      const db = loadDb()
      ensurePlatformCollections(db)
      return handler(req, res, db)
    } catch (err) {
      console.error(err)
      res.status(400).json({ error: err.message || 'Request failed' })
    }
  }

  // Onboarding
  app.get(
    '/api/admin/applications',
    ...guard,
    run((req, res, db) => {
      let rows = [...db.applications].sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))
      if (req.query.status && req.query.status !== 'all') {
        rows = rows.filter((r) => r.status === req.query.status)
      }
      res.json({ applications: rows, count: rows.length })
    }),
  )

  
  app.post(
    '/api/admin/applications',
    ...guard,
    run((req, res, db) => {
      const body = req.body || {}
      const propertyName = String(body.propertyName || body.name || '').trim()
      const city = String(body.city || '').trim()
      const country = String(body.country || '').trim()
      const ownerName = String(body.ownerName || '').trim()
      const ownerEmail = String(body.ownerEmail || '').trim().toLowerCase()
      if (!propertyName || !city || !ownerName || !ownerEmail) {
        return res.status(400).json({ error: 'propertyName, city, ownerName, and ownerEmail are required' })
      }
      const type = String(body.type || 'hotel')
      const typeLabel =
        body.typeLabel ||
        ({
          hotel: 'Hotel',
          guest_house: 'Guest house',
          holiday_home: 'Holiday home',
          car_rental: 'Car rental',
        }[type] || 'Property')
      const now = new Date().toISOString()
      const application = {
        id: uid('app_'),
        propertyName,
        city,
        country: country || 'Somaliland',
        type,
        typeLabel,
        ownerName,
        ownerEmail,
        ownerPhone: String(body.ownerPhone || ''),
        status: 'submitted',
        progress: 35,
        assignedTo: null,
        documents: [
          { id: 'doc_reg', label: 'Business registration', status: body.registrationDoc ? 'received' : 'missing' },
          { id: 'doc_id', label: 'Owner identification', status: 'missing' },
          { id: 'doc_bank', label: 'Bank & payout details', status: body.payoutAccount ? 'received' : 'missing' },
          { id: 'doc_license', label: 'Operating licence', status: 'missing' },
          { id: 'doc_tax', label: 'Tax information', status: 'missing' },
          { id: 'doc_contract', label: 'Commission agreement', status: 'missing' },
        ],
        checklist: [
          { id: 'loc', label: 'Verify location', done: false },
          { id: 'rooms', label: 'Verify inventory / rooms', done: false },
          { id: 'photos', label: 'Review property photos', done: false },
          { id: 'bank', label: 'Verify payout beneficiary', done: false },
        ],
        reviewerNotes: [],
        photos: Array.isArray(body.photos) ? body.photos : [],
        commissionRate: Number(body.commissionRate ?? db.settings?.defaultCommissionRate ?? 0.12),
        payoutAccount: body.payoutAccount || null,
        nightlyFrom: Number(body.nightlyFrom || body.nightlyRate || 50),
        verificationExpiresAt: null,
        submittedAt: now,
        updatedAt: now,
      }
      db.applications.unshift(application)

      const stayId = uid('stay_')
      const stay = {
        id: stayId,
        name: propertyName,
        city,
        country: application.country,
        neighborhood: body.neighborhood || city,
        type,
        typeLabel,
        image: application.photos[0] || '/hotels/damal/exterior.jpg',
        gallery: application.photos,
        nightlyFrom: application.nightlyFrom,
        rating: 0,
        reviews: 0,
        amenities: body.amenities || ['Wi-Fi'],
        highlights: ['New applicant'],
        summary: body.summary || `${propertyName} — pending platform approval.`,
        featured: false,
        status: 'pending',
        applicationId: application.id,
        ownerEmail,
        ownerPhone: application.ownerPhone,
        commissionRate: application.commissionRate,
        payoutAccount: application.payoutAccount,
        createdAt: now,
        updatedAt: now,
      }
      db.stays.unshift(stay)
      audit(db, {
        actorId: req.auth.sub,
        action: 'CREATE',
        entity: 'Application',
        entityId: application.id,
        meta: { propertyName, type },
      })
      saveDb(db)
      res.status(201).json({ application, stay })
    }),
  )

app.patch(
    '/api/admin/applications/:id',
    ...guard,
    run((req, res, db) => {
      const application = db.applications.find((a) => a.id === req.params.id)
      if (!application) return res.status(404).json({ error: 'Application not found' })
      const body = req.body || {}
      for (const key of ['status', 'progress', 'assignedTo', 'commissionRate', 'verificationExpiresAt', 'checklist', 'documents']) {
        if (body[key] !== undefined) application[key] = body[key]
      }
      if (body.reviewerNote) {
        application.reviewerNotes = application.reviewerNotes || []
        application.reviewerNotes.unshift({ text: String(body.reviewerNote), at: new Date().toISOString() })
      }
      application.updatedAt = new Date().toISOString()
      const stay = db.stays.find((s) => s.applicationId === application.id)
      if (body.status === 'approved') {
        application.status = 'approved'
        application.progress = 100
        if (stay) {
          stay.status = 'published'
          stay.verified = true
          stay.updatedAt = application.updatedAt
        }
      } else if (body.status === 'rejected') {
        application.status = 'rejected'
        application.rejectionReason = body.rejectionReason || 'Did not meet platform standards'
        if (stay) {
          stay.status = 'rejected'
          stay.updatedAt = application.updatedAt
        }
      } else if (['corrections_requested', 'draft', 'submitted', 'in_review'].includes(body.status) && stay) {
        stay.status = 'pending'
      }
      audit(db, {
        actorId: req.auth.sub,
        action: 'UPDATE',
        entity: 'Application',
        entityId: application.id,
        meta: { status: application.status },
      })
      saveDb(db)
      res.json({ application, stay })
    }),
  )

  // Customers
  app.get(
    '/api/admin/customers',
    ...guard,
    run((req, res, db) => {
      const q = String(req.query.q || '').toLowerCase()
      let customers = db.users.filter((u) => (u.role || 'customer') === 'customer')
      if (q) {
        customers = customers.filter((u) => [u.name, u.email, u.phone, u.id].join(' ').toLowerCase().includes(q))
      }
      const enriched = customers.map((u) => {
        const bookings = db.bookings.filter((b) => b.userId === u.id || b.guestEmail === u.email)
        const spent = bookings
          .filter((b) => b.paymentStatus === 'PAID')
          .reduce((sum, b) => sum + Number(b.total || 0), 0)
        return {
          ...publicUser(u),
          bookingCount: bookings.length,
          lifetimeValue: spent,
          risk: u.risk || 'normal',
          vip: Boolean(u.vip),
          marketingConsent: u.marketingConsent !== false,
          internalNotes: u.internalNotes || '',
        }
      })
      res.json({ customers: enriched, count: enriched.length })
    }),
  )

  app.patch(
    '/api/admin/customers/:id',
    ...guard,
    run((req, res, db) => {
      const user = db.users.find((u) => u.id === req.params.id)
      if (!user) return res.status(404).json({ error: 'Customer not found' })
      const body = req.body || {}
      for (const key of ['status', 'vip', 'risk', 'marketingConsent', 'phone', 'internalNotes']) {
        if (body[key] !== undefined) user[key] = body[key]
      }
      if (body.anonymize) {
        user.name = 'Anonymized Guest'
        user.email = `anon_${user.id}@redacted.local`
        user.phone = ''
        user.status = 'ANONYMIZED'
      }
      audit(db, {
        actorId: req.auth.sub,
        action: body.anonymize ? 'ANONYMIZE' : 'UPDATE',
        entity: 'Customer',
        entityId: user.id,
      })
      saveDb(db)
      res.json({ customer: publicUser(user) })
    }),
  )

  // Bookings deepen
  app.patch(
    '/api/admin/bookings/:id',
    ...guard,
    run((req, res, db) => {
      const booking = db.bookings.find((b) => b.id === req.params.id)
      if (!booking) return res.status(404).json({ error: 'Booking not found' })
      const body = req.body || {}
      for (const key of [
        'status',
        'paymentStatus',
        'checkIn',
        'checkOut',
        'guestName',
        'guestEmail',
        'guestPhone',
        'roomId',
        'roomName',
        'specialRequests',
        'flagged',
        'locked',
      ]) {
        if (body[key] !== undefined) booking[key] = body[key]
      }
      if (body.internalNote) {
        booking.notes = booking.notes || []
        booking.notes.unshift({ text: String(body.internalNote), at: new Date().toISOString(), by: req.auth.sub })
      }
      booking.updatedAt = new Date().toISOString()
      booking.history = booking.history || []
      booking.history.unshift({ at: booking.updatedAt, by: req.auth.sub, changes: body })
      audit(db, {
        actorId: req.auth.sub,
        action: 'UPDATE',
        entity: 'Booking',
        entityId: booking.id,
        meta: { status: booking.status },
      })
      saveDb(db)
      res.json({ booking })
    }),
  )

  // Inventory & rates
  app.get(
    '/api/admin/inventory',
    ...guard,
    run((_req, res, db) => {
      const rooms = (db.rooms || []).map((room) => {
        const stay = db.stays.find((s) => s.id === room.stayId)
        const sold = (db.bookings || []).filter(
          (b) => b.roomId === room.id && !['CANCELLED', 'NO_SHOW'].includes(String(b.status || '').toUpperCase()),
        ).length
        return {
          ...room,
          stayName: stay?.name,
          city: stay?.city,
          sold,
          available: Math.max(0, Number(room.inventory || 0) - sold),
          stopSell: Boolean(room.stopSell),
        }
      })
      res.json({
        rooms,
        holds: db.inventoryHolds || [],
        alerts: rooms
          .filter((r) => r.available <= 2)
          .map((r) => ({ level: 'warn', text: `Low inventory · ${r.stayName} · ${r.name}` })),
      })
    }),
  )

  app.patch(
    '/api/admin/inventory/:roomId',
    ...guard,
    run((req, res, db) => {
      const room = db.rooms.find((r) => r.id === req.params.roomId)
      if (!room) return res.status(404).json({ error: 'Room not found' })
      const body = req.body || {}
      if (body.inventory !== undefined) {
        if (!body.reason) return res.status(400).json({ error: 'Reason required for inventory changes' })
        room.inventory = Number(body.inventory)
        room.lastInventoryReason = String(body.reason)
      }
      for (const key of ['stopSell', 'closedToArrival', 'closedToDeparture', 'minStay', 'maxStay']) {
        if (body[key] !== undefined) room[key] = body[key]
      }
      room.updatedAt = new Date().toISOString()
      audit(db, {
        actorId: req.auth.sub,
        action: 'UPDATE',
        entity: 'Inventory',
        entityId: room.id,
        meta: body,
      })
      saveDb(db)
      res.json({ room })
    }),
  )

  app.get(
    '/api/admin/rates',
    ...guard,
    run((_req, res, db) => res.json({ ratePlans: db.ratePlans, count: db.ratePlans.length })),
  )

  app.patch(
    '/api/admin/rates/:id',
    ...guard,
    run((req, res, db) => {
      const plan = db.ratePlans.find((r) => r.id === req.params.id)
      if (!plan) return res.status(404).json({ error: 'Rate plan not found' })
      const body = req.body || {}
      for (const key of ['nightlyRate', 'minStay', 'maxStay', 'refundable', 'status', 'weekendMultiplier', 'name']) {
        if (body[key] !== undefined) plan[key] = body[key]
      }
      plan.updatedAt = new Date().toISOString()
      audit(db, { actorId: req.auth.sub, action: 'UPDATE', entity: 'RatePlan', entityId: plan.id })
      saveDb(db)
      res.json({ ratePlan: plan })
    }),
  )

  // Finance
  app.get(
    '/api/admin/commissions',
    ...guard,
    run((_req, res, db) => {
      const rate = Number(db.settings.defaultCommissionRate || 0.12)
      const entries = db.financeLedger.filter((e) => e.type === 'commission')
      const byStay = new Map()
      for (const entry of entries) {
        const stay = db.stays.find((s) => s.id === entry.stayId)
        const row = byStay.get(entry.stayId) || {
          stayId: entry.stayId,
          stayName: stay?.name || entry.stayId,
          commission: 0,
          bookings: 0,
        }
        row.commission += Number(entry.amount || 0)
        row.bookings += 1
        byStay.set(entry.stayId, row)
      }
      res.json({
        defaultRate: rate,
        hotelRates: db.stays
          .filter((s) => s.commissionRate != null)
          .map((s) => ({ stayId: s.id, stayName: s.name, rate: s.commissionRate })),
        entries,
        byStay: [...byStay.values()],
        unpaid: entries.filter((e) => e.status !== 'settled').reduce((s, e) => s + Number(e.amount || 0), 0),
      })
    }),
  )

  app.patch(
    '/api/admin/settings/commission',
    ...guard,
    run((req, res, db) => {
      const rate = Number(req.body?.defaultCommissionRate)
      if (!(rate >= 0 && rate <= 1)) return res.status(400).json({ error: 'Rate must be between 0 and 1' })
      db.settings.defaultCommissionRate = rate
      if (req.body?.stayId && req.body?.hotelRate != null) {
        const stay = db.stays.find((s) => s.id === req.body.stayId)
        if (stay) stay.commissionRate = Number(req.body.hotelRate)
      }
      audit(db, {
        actorId: req.auth.sub,
        action: 'UPDATE',
        entity: 'Commission',
        entityId: 'default',
        meta: { rate },
      })
      saveDb(db)
      res.json({ settings: db.settings })
    }),
  )

  app.get('/api/admin/refunds', ...guard, run((_req, res, db) => res.json({ refunds: db.refunds, count: db.refunds.length })))

  app.post(
    '/api/admin/refunds',
    ...guard,
    run((req, res, db) => {
      const { bookingId, amount, reason, fundedBy = 'platform', approved } = req.body || {}
      const booking = db.bookings.find((b) => b.id === bookingId)
      if (!booking) return res.status(404).json({ error: 'Booking not found' })
      const refundAmount = Number(amount)
      if (!(refundAmount > 0)) return res.status(400).json({ error: 'Invalid amount' })
      const threshold = Number(db.settings.makerCheckerThreshold || 500)
      if (refundAmount > threshold && !approved) {
        const pending = {
          id: uid('ref_'),
          bookingId,
          bookingRef: booking.bookingRef,
          amount: refundAmount,
          reason: reason || '',
          fundedBy,
          status: 'awaiting_approval',
          createdAt: new Date().toISOString(),
        }
        db.refunds.unshift(pending)
        saveDb(db)
        return res.status(202).json({ refund: pending, message: 'Requires secondary approval' })
      }
      const refund = {
        id: uid('ref_'),
        bookingId,
        bookingRef: booking.bookingRef,
        amount: refundAmount,
        reason: reason || '',
        fundedBy,
        status: 'completed',
        gatewayRef: `rfnd_${uid('')}`,
        createdAt: new Date().toISOString(),
      }
      db.refunds.unshift(refund)
      booking.paymentStatus = refundAmount >= Number(booking.total || 0) ? 'REFUNDED' : 'PARTIAL_REFUND'
      db.financeLedger.unshift({
        id: uid('fin_'),
        type: 'refund',
        bookingId,
        stayId: booking.stayId,
        amount: -refundAmount,
        currency: 'USD',
        status: 'posted',
        note: reason || 'Refund',
        createdAt: refund.createdAt,
      })
      audit(db, {
        actorId: req.auth.sub,
        action: 'REFUND',
        entity: 'Booking',
        entityId: bookingId,
        meta: { amount: refundAmount },
      })
      saveDb(db)
      res.status(201).json({ refund })
    }),
  )

  app.patch(
    '/api/admin/refunds/:id',
    ...guard,
    run((req, res, db) => {
      const refund = db.refunds.find((r) => r.id === req.params.id)
      if (!refund) return res.status(404).json({ error: 'Refund not found' })
      if (req.body?.status === 'approved' && refund.status === 'awaiting_approval') {
        refund.status = 'completed'
        refund.gatewayRef = `rfnd_${uid('')}`
        const booking = db.bookings.find((b) => b.id === refund.bookingId)
        if (booking) {
          booking.paymentStatus = refund.amount >= Number(booking.total || 0) ? 'REFUNDED' : 'PARTIAL_REFUND'
        }
      } else if (req.body?.status === 'rejected') {
        refund.status = 'rejected'
        refund.rejectionReason = req.body.reason || 'Rejected'
      }
      audit(db, {
        actorId: req.auth.sub,
        action: 'UPDATE',
        entity: 'Refund',
        entityId: refund.id,
        meta: { status: refund.status },
      })
      saveDb(db)
      res.json({ refund })
    }),
  )

  app.get(
    '/api/admin/payouts',
    ...guard,
    run((_req, res, db) => {
      res.json({
        payouts: db.payouts,
        forecast: db.financeLedger
          .filter((e) => e.type === 'hotel_payable' && e.status === 'pending_payout')
          .reduce((s, e) => s + Number(e.amount || 0), 0),
      })
    }),
  )

  app.post(
    '/api/admin/payouts',
    ...guard,
    run((req, res, db) => {
      const { stayId, amount, period = 'weekly' } = req.body || {}
      const stay = db.stays.find((s) => s.id === stayId)
      if (!stay) return res.status(404).json({ error: 'Stay not found' })
      const payout = {
        id: uid('payo_'),
        stayId,
        stayName: stay.name,
        amount: Number(amount),
        period,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
      }
      db.payouts.unshift(payout)
      audit(db, { actorId: req.auth.sub, action: 'CREATE', entity: 'Payout', entityId: payout.id })
      saveDb(db)
      res.status(201).json({ payout })
    }),
  )

  app.patch(
    '/api/admin/payouts/:id',
    ...guard,
    run((req, res, db) => {
      const payout = db.payouts.find((p) => p.id === req.params.id)
      if (!payout) return res.status(404).json({ error: 'Payout not found' })
      if (req.body?.status) payout.status = req.body.status
      if (req.body?.status === 'paid') {
        payout.paidAt = new Date().toISOString()
        for (const entry of db.financeLedger) {
          if (entry.stayId === payout.stayId && entry.type === 'hotel_payable' && entry.status === 'pending_payout') {
            entry.status = 'settled'
          }
        }
      }
      if (req.body?.status === 'rejected') payout.rejectionReason = req.body.reason || 'Rejected'
      audit(db, {
        actorId: req.auth.sub,
        action: 'UPDATE',
        entity: 'Payout',
        entityId: payout.id,
        meta: { status: payout.status },
      })
      saveDb(db)
      res.json({ payout })
    }),
  )

  app.get('/api/admin/ledger', ...guard, run((_req, res, db) => res.json({ entries: db.financeLedger, count: db.financeLedger.length })))

  // Growth / content / ops / config helpers
  const patchList = (key, idParam = 'id') =>
    run((req, res, db) => {
      const row = db[key].find((item) => item.id === req.params[idParam])
      if (!row) return res.status(404).json({ error: 'Not found' })
      Object.assign(row, req.body || {})
      saveDb(db)
      res.json({ item: row })
    })

  app.get('/api/admin/promotions', ...guard, run((_req, res, db) => res.json({ promotions: db.promotions })))
  app.post(
    '/api/admin/promotions',
    ...guard,
    run((req, res, db) => {
      const promo = { id: uid('promo_'), usedCount: 0, status: 'active', createdAt: new Date().toISOString(), ...(req.body || {}) }
      db.promotions.unshift(promo)
      saveDb(db)
      res.status(201).json({ promotion: promo })
    }),
  )
  app.patch('/api/admin/promotions/:id', ...guard, patchList('promotions'))

  app.get('/api/admin/ads', ...guard, run((_req, res, db) => res.json({ ads: db.ads })))
  app.patch('/api/admin/ads/:id', ...guard, patchList('ads'))

  app.get('/api/admin/reviews', ...guard, run((_req, res, db) => res.json({ reviews: db.reviews })))
  app.patch(
    '/api/admin/reviews/:id',
    ...guard,
    run((req, res, db) => {
      const review = db.reviews.find((r) => r.id === req.params.id)
      if (!review) return res.status(404).json({ error: 'Not found' })
      Object.assign(review, req.body || {})
      audit(db, {
        actorId: req.auth.sub,
        action: 'MODERATE',
        entity: 'Review',
        entityId: review.id,
        meta: { status: review.status },
      })
      saveDb(db)
      res.json({ review })
    }),
  )

  app.get('/api/admin/cms', ...guard, run((_req, res, db) => res.json({ pages: db.cmsPages })))
  app.patch(
    '/api/admin/cms/:id',
    ...guard,
    run((req, res, db) => {
      const page = db.cmsPages.find((p) => p.id === req.params.id)
      if (!page) return res.status(404).json({ error: 'Not found' })
      Object.assign(page, req.body || {}, { updatedAt: new Date().toISOString() })
      saveDb(db)
      res.json({ page })
    }),
  )

  app.get('/api/admin/destinations', ...guard, run((_req, res, db) => res.json({ destinations: db.destinations })))
  app.post(
    '/api/admin/destinations',
    ...guard,
    run((req, res, db) => {
      const destination = { id: uid('dest_'), status: 'active', popularity: 50, ...(req.body || {}) }
      db.destinations.unshift(destination)
      saveDb(db)
      res.status(201).json({ destination })
    }),
  )
  app.patch('/api/admin/destinations/:id', ...guard, patchList('destinations'))

  app.get('/api/admin/taxonomy', ...guard, run((_req, res, db) => res.json({ taxonomy: db.taxonomy })))
  app.patch(
    '/api/admin/taxonomy',
    ...guard,
    run((req, res, db) => {
      db.taxonomy = { ...db.taxonomy, ...(req.body || {}) }
      saveDb(db)
      res.json({ taxonomy: db.taxonomy })
    }),
  )

  app.get('/api/admin/support', ...guard, run((_req, res, db) => res.json({ tickets: db.supportTickets })))
  app.patch(
    '/api/admin/support/:id',
    ...guard,
    run((req, res, db) => {
      const ticket = db.supportTickets.find((t) => t.id === req.params.id)
      if (!ticket) return res.status(404).json({ error: 'Not found' })
      const body = req.body || {}
      for (const key of ['status', 'priority', 'assignee', 'category']) {
        if (body[key] !== undefined) ticket[key] = body[key]
      }
      if (body.message) {
        ticket.messages = ticket.messages || []
        ticket.messages.push({ from: 'agent', body: String(body.message), at: new Date().toISOString() })
      }
      ticket.updatedAt = new Date().toISOString()
      saveDb(db)
      res.json({ ticket })
    }),
  )

  app.get('/api/admin/fraud', ...guard, run((_req, res, db) => res.json({ flags: db.fraudFlags })))
  app.patch('/api/admin/fraud/:id', ...guard, patchList('fraudFlags'))

  app.get('/api/admin/notifications', ...guard, run((_req, res, db) => res.json({ templates: db.notificationTemplates })))
  app.patch('/api/admin/notifications/:id', ...guard, patchList('notificationTemplates'))

  app.get(
    '/api/admin/languages',
    ...guard,
    run((_req, res, db) => res.json({ languages: db.languages, base: db.settings.baseLanguage })),
  )
  app.patch(
    '/api/admin/languages',
    ...guard,
    run((req, res, db) => {
      if (req.body?.languages) db.languages = req.body.languages
      if (req.body?.baseLanguage) db.settings.baseLanguage = req.body.baseLanguage
      saveDb(db)
      res.json({ languages: db.languages, base: db.settings.baseLanguage })
    }),
  )

  app.get('/api/admin/taxes', ...guard, run((_req, res, db) => res.json({ rules: db.taxRules })))
  app.post(
    '/api/admin/taxes',
    ...guard,
    run((req, res, db) => {
      const rule = { id: uid('tax_'), status: 'active', ...(req.body || {}) }
      db.taxRules.unshift(rule)
      saveDb(db)
      res.status(201).json({ rule })
    }),
  )

  app.get(
    '/api/admin/loyalty',
    ...guard,
    run((_req, res, db) => {
      res.json({
        config: db.settings.loyalty,
        liabilities: db.users.reduce((s, u) => s + Number(u.points || 0), 0),
        ledger: (db.ledger || []).slice(0, 50),
      })
    }),
  )
  app.patch(
    '/api/admin/loyalty',
    ...guard,
    run((req, res, db) => {
      db.settings.loyalty = { ...db.settings.loyalty, ...(req.body || {}) }
      saveDb(db)
      res.json({ config: db.settings.loyalty })
    }),
  )

  app.get(
    '/api/admin/reports/summary',
    ...guard,
    run((req, res, db) => {
      const paid = db.bookings.filter((b) => b.paymentStatus === 'PAID')
      res.json({
        generatedAt: new Date().toISOString(),
        range: req.query.range || '30',
        bookings: db.bookings.length,
        revenue: paid.reduce((s, b) => s + Number(b.total || 0), 0),
        refunds: db.refunds.reduce((s, r) => s + Number(r.amount || 0), 0),
        payouts: db.payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0),
        commission: db.financeLedger
          .filter((e) => e.type === 'commission')
          .reduce((s, e) => s + Number(e.amount || 0), 0),
        paymentsFailed: db.payments.filter((p) => p.status === 'FAILED').length,
        supportOpen: db.supportTickets.filter((t) => t.status === 'open').length,
        fraudOpen: db.fraudFlags.filter((f) => f.status === 'open').length,
      })
    }),
  )

  app.get('/api/admin/roles', ...guard, run((_req, res, db) => res.json({ roles: db.adminRoles })))
  app.patch(
    '/api/admin/roles/:id',
    ...guard,
    run((req, res, db) => {
      const role = db.adminRoles.find((r) => r.id === req.params.id)
      if (!role) return res.status(404).json({ error: 'Not found' })
      Object.assign(role, req.body || {})
      audit(db, { actorId: req.auth.sub, action: 'UPDATE', entity: 'AdminRole', entityId: role.id })
      saveDb(db)
      res.json({ role })
    }),
  )

  app.get(
    '/api/admin/audit',
    ...guard,
    run((req, res, db) => {
      let rows = db.audit || []
      if (req.query.entity) rows = rows.filter((r) => r.entity === req.query.entity)
      if (req.query.q) {
        const q = String(req.query.q).toLowerCase()
        rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
      }
      res.json({ audit: rows.slice(0, 200), count: rows.length })
    }),
  )
}
