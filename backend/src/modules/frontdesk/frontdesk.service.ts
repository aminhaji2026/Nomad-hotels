import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { parseDateOnly, toDateOnlyString } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import { AssignRoomDto } from './dto/frontdesk.dto';

@Injectable()
export class FrontDeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  private dayBounds(dateStr?: string) {
    const d = parseDateOnly(dateStr ?? toDateOnlyString(new Date()));
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 1);
    return { start: d, end: next };
  }

  async arrivals(user: AuthUser, propertyId: string, date?: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    const { start } = this.dayBounds(date);
    return this.prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: start,
        status: { in: ['CONFIRMED', 'MODIFIED'] },
      },
      include: { guests: true, rooms: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async departures(user: AuthUser, propertyId: string, date?: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    const { start } = this.dayBounds(date);
    return this.prisma.reservation.findMany({
      where: {
        propertyId,
        checkOut: start,
        status: { in: ['CHECKED_IN'] },
      },
      include: { guests: true, rooms: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inHouse(user: AuthUser, propertyId: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.reservation.findMany({
      where: { propertyId, status: 'CHECKED_IN' },
      include: { guests: true, rooms: true },
      orderBy: { checkOut: 'asc' },
    });
  }

  async checkIn(user: AuthUser, confirmationNumber: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { confirmationNumber },
      include: { rooms: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    await this.access.assertPropertyAccess(user, reservation.propertyId);
    if (!['CONFIRMED', 'MODIFIED'].includes(reservation.status)) {
      throw new BadRequestException('Reservation cannot be checked in');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const room of reservation.rooms) {
        if (room.physicalRoomId) {
          await tx.physicalRoom.update({
            where: { id: room.physicalRoomId },
            data: { status: 'OCCUPIED' },
          });
        }
      }
      return tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CHECKED_IN',
          statusHistory: {
            create: {
              fromStatus: reservation.status,
              toStatus: 'CHECKED_IN',
              actorId: user.id,
              note: 'Checked in',
            },
          },
        },
        include: { rooms: true, guests: true },
      });
    });

    await this.audit.log({
      actorId: user.id,
      action: 'frontdesk.checkin',
      resource: 'Reservation',
      resourceId: reservation.id,
      propertyId: reservation.propertyId,
    });
    return updated;
  }

  async checkOut(user: AuthUser, confirmationNumber: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { confirmationNumber },
      include: { rooms: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    await this.access.assertPropertyAccess(user, reservation.propertyId);
    if (reservation.status !== 'CHECKED_IN') {
      throw new BadRequestException('Reservation is not in-house');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const room of reservation.rooms) {
        if (room.physicalRoomId) {
          await tx.physicalRoom.update({
            where: { id: room.physicalRoomId },
            data: { status: 'DIRTY' },
          });
          await tx.housekeepingTask.create({
            data: {
              propertyId: reservation.propertyId,
              physicalRoomId: room.physicalRoomId,
              priority: 2,
              status: 'PENDING',
              notes: `Checkout cleaning for ${confirmationNumber}`,
            },
          });
        }
      }
      return tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CHECKED_OUT',
          statusHistory: {
            create: {
              fromStatus: reservation.status,
              toStatus: 'CHECKED_OUT',
              actorId: user.id,
              note: 'Checked out',
            },
          },
        },
        include: { rooms: true, guests: true },
      });
    });

    await this.audit.log({
      actorId: user.id,
      action: 'frontdesk.checkout',
      resource: 'Reservation',
      resourceId: reservation.id,
      propertyId: reservation.propertyId,
    });
    return updated;
  }

  async assignRoom(
    user: AuthUser,
    confirmationNumber: string,
    reservationRoomId: string,
    dto: AssignRoomDto,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { confirmationNumber },
      include: { rooms: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    await this.access.assertPropertyAccess(user, reservation.propertyId);
    const roomLine = reservation.rooms.find((r) => r.id === reservationRoomId);
    if (!roomLine) throw new NotFoundException('Reservation room not found');

    const physical = await this.prisma.physicalRoom.findFirst({
      where: {
        id: dto.physicalRoomId,
        propertyId: reservation.propertyId,
        deletedAt: null,
        isActive: true,
      },
    });
    if (!physical) throw new NotFoundException('Physical room not found');
    if (physical.roomTypeId !== roomLine.roomTypeId) {
      throw new BadRequestException('Room type mismatch');
    }
    if (!['AVAILABLE', 'CLEAN', 'INSPECTED'].includes(physical.status)) {
      throw new BadRequestException('Physical room not available');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (roomLine.physicalRoomId) {
        await tx.physicalRoom.update({
          where: { id: roomLine.physicalRoomId },
          data: { status: 'AVAILABLE' },
        });
      }
      await tx.physicalRoom.update({
        where: { id: physical.id },
        data: {
          status:
            reservation.status === 'CHECKED_IN' ? 'OCCUPIED' : 'AVAILABLE',
        },
      });
      return tx.reservationRoom.update({
        where: { id: reservationRoomId },
        data: { physicalRoomId: physical.id },
      });
    });

    await this.audit.log({
      actorId: user.id,
      action: 'frontdesk.assign_room',
      resource: 'ReservationRoom',
      resourceId: reservationRoomId,
      propertyId: reservation.propertyId,
      metadata: { physicalRoomId: dto.physicalRoomId, note: dto.note },
    });
    return updated;
  }

  async markNoShow(user: AuthUser, confirmationNumber: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { confirmationNumber },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    await this.access.assertPropertyAccess(user, reservation.propertyId);
    if (!['CONFIRMED', 'MODIFIED'].includes(reservation.status)) {
      throw new BadRequestException('Cannot mark no-show');
    }
    const updated = await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'NO_SHOW',
        statusHistory: {
          create: {
            fromStatus: reservation.status,
            toStatus: 'NO_SHOW',
            actorId: user.id,
            note: 'Marked no-show',
          },
        },
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'frontdesk.no_show',
      resource: 'Reservation',
      resourceId: reservation.id,
      propertyId: reservation.propertyId,
    });
    return updated;
  }
}
