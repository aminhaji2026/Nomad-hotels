import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  eachNight,
  parseDateOnly,
  toDateOnlyString,
} from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  AvailabilityService,
  type PricedOffer,
} from '../availability/availability.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  CancelReservationDto,
  CreateReservationDto,
  ModifyReservationDto,
} from './dto/reservations.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
    private readonly availability: AvailabilityService,
    private readonly inventory: InventoryService,
  ) {}

  private confirmationNumber() {
    return `NS${randomBytes(5).toString('hex').toUpperCase()}`;
  }

  async create(user: AuthUser | null, dto: CreateReservationDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.reservation.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { rooms: true, guests: true, nights: true },
      });
      if (existing) return existing;
    }

    await this.inventory.expireHolds();

    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, status: 'ACTIVE', deletedAt: null },
      include: { policies: true },
    });
    if (!property) throw new NotFoundException('Property not available');

    const checkIn = parseDateOnly(dto.checkIn);
    const checkOut = parseDateOnly(dto.checkOut);
    if (checkOut <= checkIn) {
      throw new BadRequestException('Invalid stay dates');
    }

    const groups = new Map<
      string,
      {
        roomTypeId: string;
        ratePlanId: string;
        adults: number;
        children: number;
        qty: number;
      }
    >();
    for (const room of dto.rooms) {
      const key = `${room.roomTypeId}:${room.ratePlanId}`;
      const prev = groups.get(key);
      if (prev) {
        prev.qty += 1;
        prev.adults = Math.max(prev.adults, room.adults);
        prev.children = Math.max(prev.children, room.children ?? 0);
      } else {
        groups.set(key, {
          roomTypeId: room.roomTypeId,
          ratePlanId: room.ratePlanId,
          adults: room.adults,
          children: room.children ?? 0,
          qty: 1,
        });
      }
    }

    const priced: Array<
      PricedOffer & { adults: number; children: number; qty: number }
    > = [];

    for (const group of groups.values()) {
      const rt = await this.prisma.roomType.findFirst({
        where: {
          id: group.roomTypeId,
          propertyId: property.id,
          deletedAt: null,
        },
      });
      if (!rt) throw new NotFoundException('Room type not found');
      if (!this.availability.canAccommodate(rt, group.adults, group.children)) {
        throw new BadRequestException(
          `Room type ${rt.code} cannot accommodate selected guests`,
        );
      }
      const offer = await this.availability.priceStay({
        propertyId: property.id,
        roomTypeId: group.roomTypeId,
        ratePlanId: group.ratePlanId,
        checkIn,
        checkOut,
        rooms: group.qty,
      });
      if (!offer) {
        throw new ConflictException(
          `No availability/price for room type ${rt.code}`,
        );
      }
      priced.push({
        ...offer,
        adults: group.adults,
        children: group.children,
        qty: group.qty,
      });
    }

    const subtotal = priced.reduce((s, p) => s + p.subtotal, 0);
    const taxes = priced.reduce((s, p) => s + p.taxes, 0);
    const fees = priced.reduce((s, p) => s + p.fees, 0);
    const total = priced.reduce((s, p) => s + p.total, 0);
    const commissionAmount =
      Math.round(((total * Number(property.commissionRate)) / 100) * 100) / 100;
    const adults = dto.rooms.reduce((s, r) => s + r.adults, 0);
    const children = dto.rooms.reduce((s, r) => s + (r.children ?? 0), 0);
    const status: ReservationStatus = dto.payAtProperty
      ? 'CONFIRMED'
      : 'PENDING_PAYMENT';

    try {
      const reservation = await this.prisma.$transaction(
        async (tx) => {
          const qtyByRoomType = new Map<string, number>();
          for (const room of dto.rooms) {
            qtyByRoomType.set(
              room.roomTypeId,
              (qtyByRoomType.get(room.roomTypeId) ?? 0) + 1,
            );
          }

          for (const [roomTypeId, qty] of qtyByRoomType) {
            for (const date of eachNight(checkIn, checkOut)) {
              const day = await tx.inventoryDay.findUnique({
                where: { roomTypeId_date: { roomTypeId, date } },
              });
              if (!day || day.state === 'STOP_SELL') {
                throw new ConflictException(
                  `No inventory for ${toDateOnlyString(date)}`,
                );
              }
              const updated = await tx.inventoryDay.updateMany({
                where: {
                  id: day.id,
                  available: { gte: qty },
                  state: { not: 'STOP_SELL' },
                },
                data: {
                  available: { decrement: qty },
                  reserved: { increment: qty },
                  sold: { increment: status === 'CONFIRMED' ? qty : 0 },
                },
              });
              if (updated.count !== 1) {
                throw new ConflictException(
                  `Double-booking prevented for ${toDateOnlyString(date)}`,
                );
              }
            }
          }

          return tx.reservation.create({
            data: {
              confirmationNumber: this.confirmationNumber(),
              propertyId: property.id,
              customerId: user?.id,
              status,
              checkIn,
              checkOut,
              adults,
              children,
              roomsCount: dto.rooms.length,
              currency: priced[0]?.currency ?? property.currency,
              subtotal,
              taxes,
              fees,
              discounts: 0,
              total,
              commissionAmount,
              paymentStatus: dto.payAtProperty ? 'CAPTURED' : 'PENDING',
              source: dto.source ?? 'web',
              specialRequests: dto.specialRequests,
              policySnapshot: property.policies
                ? {
                    cancellationPolicy: property.policies.cancellationPolicy,
                    prepaymentPolicy: property.policies.prepaymentPolicy,
                    childPolicy: property.policies.childPolicy,
                  }
                : undefined,
              cancellationSnapshot: priced[0]
                ? {
                    isRefundable: priced[0].isRefundable,
                  }
                : undefined,
              idempotencyKey: dto.idempotencyKey,
              createdById: user?.id,
              rooms: {
                create: dto.rooms.map((r) => ({
                  roomTypeId: r.roomTypeId,
                  ratePlanId: r.ratePlanId,
                  adults: r.adults,
                  children: r.children ?? 0,
                })),
              },
              guests: {
                create: dto.guests.map((g, idx) => ({
                  firstName: g.firstName,
                  lastName: g.lastName,
                  email: g.email,
                  phone: g.phone,
                  isPrimary: g.isPrimary ?? idx === 0,
                })),
              },
              nights: {
                create: priced.flatMap((p) =>
                  p.nights.map((n) => ({
                    date: parseDateOnly(n.date),
                    roomTypeId: p.roomTypeId,
                    amount: n.amount,
                    taxAmount:
                      p.subtotal > 0
                        ? Math.round((n.amount / p.subtotal) * p.taxes * 100) /
                          100
                        : 0,
                  })),
                ),
              },
              statusHistory: {
                create: {
                  toStatus: status,
                  actorId: user?.id,
                  note: 'Reservation created',
                },
              },
            },
            include: { rooms: true, guests: true, nights: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (user) {
        await this.audit.log({
          actorId: user.id,
          action: 'reservation.create',
          resource: 'Reservation',
          resourceId: reservation.id,
          propertyId: property.id,
          metadata: { confirmationNumber: reservation.confirmationNumber },
        });
      }
      return reservation;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        dto.idempotencyKey
      ) {
        const again = await this.prisma.reservation.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
          include: { rooms: true, guests: true, nights: true },
        });
        if (again) return again;
      }
      throw err;
    }
  }

  async getByConfirmation(confirmationNumber: string, user?: AuthUser | null) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { confirmationNumber },
      include: {
        rooms: true,
        guests: true,
        nights: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            timezone: true,
            hotelGroupId: true,
          },
        },
      },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (user && !user.isPlatform) {
      const isCustomer = reservation.customerId === user.id;
      if (!isCustomer) {
        await this.access.assertPropertyAccess(user, reservation.propertyId);
      }
    }
    return reservation;
  }

  async listForProperty(user: AuthUser, propertyId: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.reservation.findMany({
      where: { propertyId },
      include: { guests: true, rooms: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listMine(user: AuthUser) {
    return this.prisma.reservation.findMany({
      where: { customerId: user.id },
      include: {
        property: {
          select: { id: true, name: true, slug: true, city: true },
        },
        rooms: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(
    user: AuthUser,
    confirmationNumber: string,
    dto: CancelReservationDto,
  ) {
    const reservation = await this.getByConfirmation(confirmationNumber, user);
    if (['CANCELLED', 'CHECKED_OUT', 'REFUNDED'].includes(reservation.status)) {
      throw new BadRequestException('Reservation cannot be cancelled');
    }

    const nights = eachNight(reservation.checkIn, reservation.checkOut);
    const qtyByRoomType = new Map<string, number>();
    for (const room of reservation.rooms) {
      qtyByRoomType.set(
        room.roomTypeId,
        (qtyByRoomType.get(room.roomTypeId) ?? 0) + 1,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const [roomTypeId, qty] of qtyByRoomType) {
        for (const date of nights) {
          await tx.inventoryDay.updateMany({
            where: { roomTypeId, date },
            data: {
              available: { increment: qty },
              reserved: { decrement: qty },
              sold: {
                decrement: reservation.status === 'CONFIRMED' ? qty : 0,
              },
            },
          });
        }
      }
      return tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          statusHistory: {
            create: {
              fromStatus: reservation.status,
              toStatus: 'CANCELLED',
              actorId: user.id,
              note: dto.reason ?? 'Cancelled',
            },
          },
        },
        include: { rooms: true, guests: true, nights: true },
      });
    });

    await this.audit.log({
      actorId: user.id,
      action: 'reservation.cancel',
      resource: 'Reservation',
      resourceId: reservation.id,
      propertyId: reservation.propertyId,
      metadata: { reason: dto.reason },
    });
    return updated;
  }

  async modify(
    user: AuthUser,
    confirmationNumber: string,
    dto: ModifyReservationDto,
  ) {
    const reservation = await this.getByConfirmation(confirmationNumber, user);
    if (
      !['CONFIRMED', 'PENDING_PAYMENT', 'MODIFIED'].includes(reservation.status)
    ) {
      throw new BadRequestException('Reservation cannot be modified');
    }
    if (!dto.checkIn && !dto.checkOut && dto.specialRequests === undefined) {
      throw new BadRequestException('No changes provided');
    }

    const newCheckIn = dto.checkIn
      ? parseDateOnly(dto.checkIn)
      : reservation.checkIn;
    const newCheckOut = dto.checkOut
      ? parseDateOnly(dto.checkOut)
      : reservation.checkOut;
    if (newCheckOut <= newCheckIn) {
      throw new BadRequestException('Invalid stay dates');
    }

    const datesChanged =
      toDateOnlyString(newCheckIn) !== toDateOnlyString(reservation.checkIn) ||
      toDateOnlyString(newCheckOut) !== toDateOnlyString(reservation.checkOut);

    if (!datesChanged) {
      return this.prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          specialRequests: dto.specialRequests ?? reservation.specialRequests,
          statusHistory: {
            create: {
              fromStatus: reservation.status,
              toStatus: reservation.status,
              actorId: user.id,
              note: dto.note ?? 'Updated special requests',
            },
          },
        },
        include: { rooms: true, guests: true, nights: true },
      });
    }

    const primary = reservation.rooms[0];
    if (!primary?.ratePlanId) {
      throw new BadRequestException('Cannot modify: missing rate plan');
    }

    const offer = await this.availability.priceStay({
      propertyId: reservation.propertyId,
      roomTypeId: primary.roomTypeId,
      ratePlanId: primary.ratePlanId,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      rooms: reservation.rooms.length,
    });
    if (!offer) {
      throw new ConflictException('New dates unavailable or not priced');
    }

    const qtyByRoomType = new Map<string, number>();
    for (const room of reservation.rooms) {
      qtyByRoomType.set(
        room.roomTypeId,
        (qtyByRoomType.get(room.roomTypeId) ?? 0) + 1,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const [roomTypeId, qty] of qtyByRoomType) {
        for (const date of eachNight(
          reservation.checkIn,
          reservation.checkOut,
        )) {
          await tx.inventoryDay.updateMany({
            where: { roomTypeId, date },
            data: {
              available: { increment: qty },
              reserved: { decrement: qty },
            },
          });
        }
      }

      for (const [roomTypeId, qty] of qtyByRoomType) {
        for (const date of eachNight(newCheckIn, newCheckOut)) {
          const day = await tx.inventoryDay.findUnique({
            where: { roomTypeId_date: { roomTypeId, date } },
          });
          if (!day) {
            throw new ConflictException(
              `No inventory for ${toDateOnlyString(date)}`,
            );
          }
          const locked = await tx.inventoryDay.updateMany({
            where: { id: day.id, available: { gte: qty } },
            data: {
              available: { decrement: qty },
              reserved: { increment: qty },
            },
          });
          if (locked.count !== 1) {
            throw new ConflictException('Inventory conflict on modify');
          }
        }
      }

      await tx.nightlyPrice.deleteMany({
        where: { reservationId: reservation.id },
      });

      return tx.reservation.update({
        where: { id: reservation.id },
        data: {
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          subtotal: offer.subtotal,
          taxes: offer.taxes,
          fees: offer.fees,
          total: offer.total,
          specialRequests: dto.specialRequests ?? reservation.specialRequests,
          status: 'MODIFIED',
          nights: {
            create: offer.nights.map((n) => ({
              date: parseDateOnly(n.date),
              roomTypeId: offer.roomTypeId,
              amount: n.amount,
              taxAmount:
                offer.subtotal > 0
                  ? Math.round(
                      (n.amount / offer.subtotal) * offer.taxes * 100,
                    ) / 100
                  : 0,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: reservation.status,
              toStatus: 'MODIFIED',
              actorId: user.id,
              note: dto.note ?? 'Dates modified',
            },
          },
        },
        include: { rooms: true, guests: true, nights: true },
      });
    });

    await this.audit.log({
      actorId: user.id,
      action: 'reservation.modify',
      resource: 'Reservation',
      resourceId: reservation.id,
      propertyId: reservation.propertyId,
      metadata: {
        checkIn: toDateOnlyString(newCheckIn),
        checkOut: toDateOnlyString(newCheckOut),
        total: offer.total,
      },
    });
    return updated;
  }
}
