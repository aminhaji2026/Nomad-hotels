import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  addDays,
  eachNight,
  parseDateOnly,
  toDateOnlyString,
} from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  AdjustInventoryDto,
  CreateHoldDto,
  OpenInventoryDto,
  SetInventoryStateDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async openRange(user: AuthUser, propertyId: string, dto: OpenInventoryDto) {
    await this.access.assertPropertyAccess(user, propertyId);
    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, propertyId, deletedAt: null },
    });
    if (!roomType) throw new NotFoundException('Room type not found');

    const start = parseDateOnly(dto.startDate);
    const end = parseDateOnly(dto.endDate);
    if (end < start) throw new BadRequestException('Invalid date range');
    const total = dto.total ?? roomType.sellableUnits;
    const nights = eachNight(start, addDays(end, 1));

    let upserted = 0;
    for (const date of nights) {
      await this.prisma.inventoryDay.upsert({
        where: { roomTypeId_date: { roomTypeId: dto.roomTypeId, date } },
        update: {
          total,
          available: total,
          reserved: 0,
          blocked: 0,
          sold: 0,
          state: 'OPEN',
        },
        create: {
          propertyId,
          roomTypeId: dto.roomTypeId,
          date,
          total,
          available: total,
          state: 'OPEN',
        },
      });
      upserted += 1;
    }

    await this.audit.log({
      actorId: user.id,
      action: 'inventory.open_range',
      resource: 'InventoryDay',
      propertyId,
      metadata: {
        roomTypeId: dto.roomTypeId,
        start: dto.startDate,
        end: dto.endDate,
        total,
        upserted,
      },
    });
    return { upserted, total };
  }

  async calendar(
    user: AuthUser,
    propertyId: string,
    roomTypeId: string,
    from: string,
    to: string,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.inventoryDay.findMany({
      where: {
        propertyId,
        roomTypeId,
        date: { gte: parseDateOnly(from), lte: parseDateOnly(to) },
      },
      orderBy: { date: 'asc' },
    });
  }

  async adjust(user: AuthUser, propertyId: string, dto: AdjustInventoryDto) {
    await this.access.assertPropertyAccess(user, propertyId);
    const nights = eachNight(
      parseDateOnly(dto.startDate),
      addDays(parseDateOnly(dto.endDate), 1),
    );
    let updated = 0;
    for (const date of nights) {
      const day = await this.prisma.inventoryDay.findUnique({
        where: { roomTypeId_date: { roomTypeId: dto.roomTypeId, date } },
      });
      if (!day) continue;
      const newTotal = Math.max(0, day.total + dto.delta);
      const newAvailable = Math.max(
        0,
        Math.min(
          newTotal - day.reserved - day.blocked - day.sold,
          day.available + dto.delta,
        ),
      );
      await this.prisma.inventoryDay.update({
        where: { id: day.id },
        data: { total: newTotal, available: newAvailable },
      });
      await this.prisma.inventoryAdjustment.create({
        data: {
          roomTypeId: dto.roomTypeId,
          date,
          delta: dto.delta,
          reason: dto.reason,
          actorId: user.id,
        },
      });
      updated += 1;
    }
    return { updated };
  }

  async setState(
    user: AuthUser,
    propertyId: string,
    dto: SetInventoryStateDto,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    const result = await this.prisma.inventoryDay.updateMany({
      where: {
        propertyId,
        roomTypeId: dto.roomTypeId,
        date: {
          gte: parseDateOnly(dto.startDate),
          lte: parseDateOnly(dto.endDate),
        },
      },
      data: { state: dto.state },
    });
    return { updated: result.count };
  }

  async expireHolds(now = new Date()) {
    const expired = await this.prisma.inventoryHold.findMany({
      where: { status: 'ACTIVE', expiresAt: { lt: now } },
    });
    for (const hold of expired) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.inventoryHold.updateMany({
          where: { id: hold.id, status: 'ACTIVE' },
          data: { status: 'EXPIRED' },
        });
        if (updated.count !== 1) return;
        await tx.inventoryDay.update({
          where: { id: hold.inventoryDayId },
          data: {
            available: { increment: hold.quantity },
            reserved: { decrement: hold.quantity },
          },
        });
      });
    }
    return { expired: expired.length };
  }

  async createHold(user: AuthUser, propertyId: string, dto: CreateHoldDto) {
    await this.access.assertPropertyAccess(user, propertyId);
    await this.expireHolds();
    const quantity = dto.quantity ?? 1;
    const ttl = dto.ttlSeconds ?? 900;
    const nights = eachNight(
      parseDateOnly(dto.checkIn),
      parseDateOnly(dto.checkOut),
    );
    if (!nights.length) throw new BadRequestException('Invalid stay dates');

    const expiresAt = new Date(Date.now() + ttl * 1000);
    const holdIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const date of nights) {
        const day = await tx.inventoryDay.findUnique({
          where: { roomTypeId_date: { roomTypeId: dto.roomTypeId, date } },
        });
        if (!day || day.state === 'STOP_SELL' || day.available < quantity) {
          throw new ConflictException(
            `Insufficient inventory for ${toDateOnlyString(date)}`,
          );
        }
        const locked = await tx.inventoryDay.updateMany({
          where: { id: day.id, available: { gte: quantity } },
          data: {
            available: { decrement: quantity },
            reserved: { increment: quantity },
          },
        });
        if (locked.count !== 1) {
          throw new ConflictException(
            `Race: inventory unavailable for ${toDateOnlyString(date)}`,
          );
        }
        const hold = await tx.inventoryHold.create({
          data: {
            inventoryDayId: day.id,
            quantity,
            status: 'ACTIVE',
            expiresAt,
          },
        });
        holdIds.push(hold.id);
      }
    });

    return { holdIds, expiresAt, quantity, nights: nights.length };
  }
}
