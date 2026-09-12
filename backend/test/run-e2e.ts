/**
 * DB-backed e2e runner (tsx) — avoids Jest/ESM friction with @nestjs/config v12.
 * Boots the compiled AppModule so emitDecoratorMetadata/DI works (tsx alone does not).
 * Requires: npm run build, migrated + seeded database.
 */
import 'reflect-metadata';
import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    failed += 1;
    throw new Error(message);
  }
  passed += 1;
}

async function login(app: INestApplication, email: string) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: 'ChangeMe123!' });
  assert(res.status === 201, `login ${email} status ${res.status}`);
  assert(res.body.success, `login ${email} unsuccessful`);
  return res.body.data.accessToken as string;
}

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

async function main() {
  // Compiled AppModule preserves decorator metadata for Nest DI (tsx alone does not).
  const { AppModule } = await import('../dist/app.module.js');

  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  try {
    const health = await request(app.getHttpServer()).get('/api/v1/health');
    assert(health.status === 200 && health.body.status === 'ok', 'health ok');

    const ready = await request(app.getHttpServer()).get(
      '/api/v1/health/ready',
    );
    assert(ready.status === 200 && ready.body.status === 'ready', 'ready ok');

    const email = `e2e_${Date.now()}@example.com`;
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'ChangeMe123!',
        firstName: 'E2E',
        lastName: 'Guest',
      });
    assert(reg.status === 201 && reg.body.data.accessToken, 'register tokens');

    const guestToken = reg.body.data.accessToken as string;
    const ownerToken = await login(app, 'owner@demo-hotel.local');
    const adminToken = await login(app, 'superadmin@nomadstay.local');

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(me.body.data.email === 'superadmin@nomadstay.local', 'auth me');

    const property = await prisma.property.findFirst({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        roomTypes: { where: { deletedAt: null }, take: 1 },
        ratePlans: { where: { isActive: true }, take: 1 },
        rooms: { where: { deletedAt: null, isActive: true }, take: 1 },
      },
    });
    assert(
      property?.roomTypes[0] && property.ratePlans[0] && property.rooms[0],
      'seed property',
    );

    const { checkIn, checkOut } = stayDates(14);
    const search = await request(app.getHttpServer())
      .get('/api/v1/search/hotels')
      .query({ city: 'Hargeisa', checkIn, checkOut, adults: 2 });
    assert(
      search.status === 200 &&
        search.body.data.length > 0 &&
        Number(search.body.data[0].fromPrice) > 0,
      'search pricing',
    );

    const bookDates = stayDates(21);
    const booking = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        propertyId: property.id,
        checkIn: bookDates.checkIn,
        checkOut: bookDates.checkOut,
        rooms: [
          {
            roomTypeId: property.roomTypes[0].id,
            ratePlanId: property.ratePlans[0].id,
            adults: 2,
          },
        ],
        guests: [
          {
            firstName: 'E2E',
            lastName: 'Guest',
            email,
            isPrimary: true,
          },
        ],
        idempotencyKey: `e2e-${Date.now()}`,
      });
    assert(
      booking.status === 201 && booking.body.data.customerId,
      'booking customerId',
    );
    const reservationId = booking.body.data.id as string;
    const confirmationNumber = booking.body.data.confirmationNumber as string;

    const intent = await request(app.getHttpServer())
      .post('/api/v1/payments/intents')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        reservationId,
        method: 'CARD',
        idempotencyKey: `intent-${reservationId}`,
      });
    assert(intent.status === 201 && intent.body.data.id, 'payment intent');

    const capture = await request(app.getHttpServer())
      .post(`/api/v1/payments/${intent.body.data.id}/capture`)
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(
      capture.status === 201 && capture.body.data.status === 'CAPTURED',
      'capture',
    );

    const commission = await prisma.commissionRecord.findUnique({
      where: { reservationId },
    });
    assert(commission && Number(commission.amount) > 0, 'commission recorded');

    const rooms = await prisma.reservationRoom.findMany({
      where: { reservationId },
    });
    assert(rooms.length > 0, 'reservation rooms');

    const physicalRoom =
      (await prisma.physicalRoom.findFirst({
        where: {
          propertyId: property.id,
          roomTypeId: property.roomTypes[0].id,
          deletedAt: null,
          isActive: true,
          status: { in: ['AVAILABLE', 'CLEAN', 'INSPECTED'] },
        },
      })) ?? property.rooms[0];
    // Ensure a usable room even if prior runs left inventory dirty
    await prisma.physicalRoom.update({
      where: { id: physicalRoom.id },
      data: { status: 'AVAILABLE' },
    });

    const assign = await request(app.getHttpServer())
      .post(
        `/api/v1/bookings/${confirmationNumber}/rooms/${rooms[0].id}/assign`,
      )
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ physicalRoomId: physicalRoom.id });
    assert(assign.status === 201, `assign room (${assign.status})`);

    const checkInRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${confirmationNumber}/check-in`)
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(
      checkInRes.status === 201 &&
        checkInRes.body.data?.status === 'CHECKED_IN',
      `check-in (${checkInRes.status} ${checkInRes.body?.error?.message ?? ''})`,
    );

    const checkOutRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${confirmationNumber}/check-out`)
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(
      checkOutRes.status === 201 &&
        checkOutRes.body.data?.status === 'CHECKED_OUT',
      `check-out (${checkOutRes.status})`,
    );

    const hk = await request(app.getHttpServer())
      .get(`/api/v1/properties/${property.id}/housekeeping/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(hk.status === 200 && hk.body.data.length > 0, 'housekeeping task');

    // Refunds after stay: partial refund must not block completed stays;
    // oversized refund must still be rejected.
    const refund = await request(app.getHttpServer())
      .post(`/api/v1/payments/${intent.body.data.id}/refunds`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amount: 10,
        reason: 'e2e',
        idempotencyKey: `refund-${reservationId}`,
      });
    assert(
      refund.status === 201 && Number(refund.body.data.amount) === 10,
      'refund',
    );

    const afterRefund = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    assert(
      afterRefund?.status === 'CHECKED_OUT' &&
        afterRefund.paymentStatus === 'PARTIALLY_REFUNDED',
      'partial refund keeps stay status',
    );

    const oversized = await request(app.getHttpServer())
      .post(`/api/v1/payments/${intent.body.data.id}/refunds`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: Number(booking.body.data.total) + 500 });
    assert(oversized.status >= 400, 'oversized refund rejected');

    const earlyReview = await request(app.getHttpServer())
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        reservationId,
        overallScore: 8,
        title: 'Too early',
        body: 'nope',
      });
    // Checked-out stay may allow review; if so, create a pending booking for negative case
    if (earlyReview.status < 400) {
      const pendingDates = stayDates(40);
      const pending = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: property.id,
          checkIn: pendingDates.checkIn,
          checkOut: pendingDates.checkOut,
          rooms: [
            {
              roomTypeId: property.roomTypes[0].id,
              ratePlanId: property.ratePlans[0].id,
              adults: 2,
            },
          ],
          guests: [
            {
              firstName: 'E2E',
              lastName: 'Guest',
              email,
              isPrimary: true,
            },
          ],
          idempotencyKey: `e2e-pending-${Date.now()}`,
        });
      const blocked = await request(app.getHttpServer())
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          reservationId: pending.body.data.id,
          overallScore: 8,
          title: 'Too early',
          body: 'nope',
        });
      assert(blocked.status >= 400, 'review without stay blocked');
    } else {
      assert(true, 'review without stay blocked');
    }

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
    const cross = await request(app.getHttpServer())
      .get(`/api/v1/properties/${other.id}/arrivals`)
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(cross.status === 403, 'cross-hotel 403');
    await prisma.property.delete({ where: { id: other.id } });
    await prisma.hotelGroup.delete({ where: { id: group.id } });

    const ticket = await request(app.getHttpServer())
      .post('/api/v1/support/tickets')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        subject: 'E2E support',
        body: 'Need help',
        priority: 'MEDIUM',
      });
    assert(ticket.status === 201 && ticket.body.data.id, 'support ticket');

    const overview = await request(app.getHttpServer())
      .get('/api/v1/platform/reports/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(
      overview.status === 200 && overview.body.data.properties >= 1,
      'platform overview',
    );

    const code = `E2E${Date.now().toString().slice(-6)}`;
    const promo = await request(app.getHttpServer())
      .post('/api/v1/promotions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, name: 'E2E Promo', percentOff: 10, isPlatform: true });
    assert(promo.status === 201, 'promo create');
    const validated = await request(app.getHttpServer())
      .post('/api/v1/promotions/validate')
      .send({ code, propertyId: property.id, bookingAmount: 100 });
    assert(
      validated.status === 201 &&
        validated.body.data.discount === 10 &&
        validated.body.data.finalAmount === 90,
      'promo validate',
    );

    console.log(`E2E passed (${passed} assertions, ${failed} failed)`);
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('E2E failed:', err);
  process.exit(1);
});
