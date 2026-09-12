import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createTestApp, login } from './utils/e2e-app';

describe('Critical flows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let propertyId: string;
  let roomTypeId: string;
  let ratePlanId: string;
  let physicalRoomId: string;
  let guestToken: string;
  let ownerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = new PrismaClient();

    const property = await prisma.property.findFirst({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        roomTypes: { where: { deletedAt: null }, take: 1 },
        ratePlans: { where: { isActive: true }, take: 1 },
        rooms: { where: { deletedAt: null, isActive: true }, take: 1 },
      },
    });
    if (
      !property?.roomTypes[0] ||
      !property.ratePlans[0] ||
      !property.rooms[0]
    ) {
      throw new Error('Seed data missing property/roomType/ratePlan/room');
    }

    propertyId = property.id;
    roomTypeId = property.roomTypes[0].id;
    ratePlanId = property.ratePlans[0].id;
    physicalRoomId = property.rooms[0].id;

    adminToken = await login(app, 'superadmin@nomadstay.local');
    ownerToken = await login(app, 'owner@demo-hotel.local');

    const email = `e2e_guest_${Date.now()}@example.com`;
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'ChangeMe123!',
        firstName: 'Flow',
        lastName: 'Guest',
      })
      .expect(201);
    guestToken = reg.body.data.accessToken as string;
  }, 120000);

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  function stayDates(offsetDays: number, nights = 2) {
    const checkIn = new Date();
    checkIn.setUTCHours(0, 0, 0, 0);
    checkIn.setUTCDate(checkIn.getUTCDate() + offsetDays);
    const checkOut = new Date(checkIn);
    checkOut.setUTCDate(checkOut.getUTCDate() + nights);
    return {
      checkIn: checkIn.toISOString().slice(0, 10),
      checkOut: checkOut.toISOString().slice(0, 10),
    };
  }

  async function createBooking(token: string, offsetDays: number) {
    const { checkIn, checkOut } = stayDates(offsetDays);
    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propertyId,
        checkIn,
        checkOut,
        rooms: [{ roomTypeId, ratePlanId, adults: 2 }],
        guests: [
          {
            firstName: 'Flow',
            lastName: 'Guest',
            email: 'flow@example.com',
            isPrimary: true,
          },
        ],
        idempotencyKey: `e2e-book-${offsetDays}-${Date.now()}`,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.customerId).toBeTruthy();
    return res.body.data as {
      id: string;
      confirmationNumber: string;
      total: string | number;
      customerId: string;
    };
  }

  it('searches hotels with live pricing', async () => {
    const { checkIn, checkOut } = stayDates(14);
    const res = await request(app.getHttpServer())
      .get('/api/v1/search/hotels')
      .query({ city: 'Hargeisa', checkIn, checkOut, adults: 2 })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(Number(res.body.data[0].fromPrice)).toBeGreaterThan(0);
  });

  it('books → pays → captures → refunds with commission', async () => {
    const booking = await createBooking(guestToken, 21);

    const intent = await request(app.getHttpServer())
      .post('/api/v1/payments/intents')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        reservationId: booking.id,
        method: 'CARD',
        idempotencyKey: `intent-${booking.id}`,
      })
      .expect(201);
    expect(['PENDING', 'AUTHORIZED']).toContain(intent.body.data.status);

    const paymentId = intent.body.data.id as string;
    const captured = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/capture`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);
    expect(captured.body.data.status).toBe('CAPTURED');

    const commission = await prisma.commissionRecord.findUnique({
      where: { reservationId: booking.id },
    });
    expect(commission).toBeTruthy();
    expect(Number(commission!.amount)).toBeGreaterThan(0);

    const refund = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/refunds`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amount: 10,
        reason: 'e2e partial refund',
        idempotencyKey: `refund-${paymentId}`,
      })
      .expect(201);
    expect(Number(refund.body.data.amount)).toBe(10);

    const statement = await request(app.getHttpServer())
      .get(`/api/v1/properties/${propertyId}/statements`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(statement.body.data.totals).toBeDefined();
  });

  it('rejects oversized refunds', async () => {
    const booking = await createBooking(guestToken, 28);
    const intent = await request(app.getHttpServer())
      .post('/api/v1/payments/intents')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ reservationId: booking.id, method: 'CARD' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/payments/${intent.body.data.id}/capture`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    const oversized = await request(app.getHttpServer())
      .post(`/api/v1/payments/${intent.body.data.id}/refunds`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: Number(booking.total) + 500 });
    expect(oversized.status).toBeGreaterThanOrEqual(400);
  });

  it('blocks cross-hotel property access with 403', async () => {
    const group = await prisma.hotelGroup.create({
      data: {
        name: `Other Group ${Date.now()}`,
        slug: `other-group-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    const other = await prisma.property.create({
      data: {
        hotelGroupId: group.id,
        name: 'Other Hotel E2E',
        slug: `other-hotel-${Date.now()}`,
        status: 'ACTIVE',
        timezone: 'UTC',
        currency: 'USD',
        city: 'Mogadishu',
        countryCode: 'SO',
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/properties/${other.id}/arrivals`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(403);

    await prisma.property.delete({ where: { id: other.id } });
    await prisma.hotelGroup.delete({ where: { id: group.id } });
  });

  it('rejects review without completed stay', async () => {
    const booking = await createBooking(guestToken, 35);
    const res = await request(app.getHttpServer())
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        reservationId: booking.id,
        overallScore: 8,
        title: 'Too early',
        body: 'Still pending stay',
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('front desk assign → check-in → check-out creates housekeeping', async () => {
    const booking = await createBooking(guestToken, 7);
    const intent = await request(app.getHttpServer())
      .post('/api/v1/payments/intents')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ reservationId: booking.id, method: 'CARD' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/payments/${intent.body.data.id}/capture`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    const rooms = await prisma.reservationRoom.findMany({
      where: { reservationId: booking.id },
    });
    expect(rooms.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post(
        `/api/v1/bookings/${booking.confirmationNumber}/rooms/${rooms[0].id}/assign`,
      )
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ physicalRoomId })
      .expect(201);

    const checkedIn = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.confirmationNumber}/check-in`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);
    expect(checkedIn.body.data.status).toBe('CHECKED_IN');

    const checkedOut = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.confirmationNumber}/check-out`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);
    expect(checkedOut.body.data.status).toBe('CHECKED_OUT');

    const hk = await request(app.getHttpServer())
      .get(`/api/v1/properties/${propertyId}/housekeeping/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(hk.body.data.length).toBeGreaterThan(0);
  });

  it('opens support ticket and reads platform overview', async () => {
    const ticket = await request(app.getHttpServer())
      .post('/api/v1/support/tickets')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        subject: 'E2E support',
        body: 'Need help with a booking',
        priority: 'MEDIUM',
      })
      .expect(201);
    expect(ticket.body.data.id).toBeTruthy();

    const overview = await request(app.getHttpServer())
      .get('/api/v1/platform/reports/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(overview.body.data.properties).toBeGreaterThanOrEqual(1);
  });

  it('creates and validates a platform promotion', async () => {
    const code = `E2E${Date.now().toString().slice(-6)}`;
    await request(app.getHttpServer())
      .post('/api/v1/promotions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code,
        name: 'E2E Promo',
        percentOff: 10,
        isPlatform: true,
      })
      .expect(201);

    const validated = await request(app.getHttpServer())
      .post('/api/v1/promotions/validate')
      .send({ code, propertyId, bookingAmount: 100 })
      .expect(201);
    expect(validated.body.data.discount).toBe(10);
    expect(validated.body.data.finalAmount).toBe(90);
  });
});
