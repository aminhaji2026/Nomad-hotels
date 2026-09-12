import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { parseDateOnly } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  BulkDailyRatesDto,
  CreateRatePlanDto,
  UpdateRatePlanDto,
  UpsertRestrictionDto,
} from './dto/rates.dto';

@Injectable()
export class RatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, propertyId: string, dto: CreateRatePlanDto) {
    await this.access.assertPropertyAccess(user, propertyId);
    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, propertyId, deletedAt: null },
    });
    if (!roomType) throw new NotFoundException('Room type not found');

    const plan = await this.prisma.ratePlan.create({
      data: {
        propertyId,
        roomTypeId: dto.roomTypeId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        type: dto.type ?? 'STANDARD',
        currency: dto.currency ?? 'USD',
        basePrice: dto.basePrice,
        parentPlanId: dto.parentPlanId,
        derivePercent: dto.derivePercent,
        minStay: dto.minStay,
        maxStay: dto.maxStay,
        isRefundable: dto.isRefundable ?? true,
        cancellationJson: dto.cancellationJson as
          Prisma.InputJsonValue | undefined,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'rate_plan.create',
      resource: 'RatePlan',
      resourceId: plan.id,
      propertyId,
    });
    return plan;
  }

  async list(user: AuthUser, propertyId: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.ratePlan.findMany({
      where: { propertyId },
      include: { roomType: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateRatePlanDto) {
    const existing = await this.prisma.ratePlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Rate plan not found');
    await this.access.assertPropertyAccess(user, existing.propertyId);
    const { cancellationJson, ...rest } = dto;
    return this.prisma.ratePlan.update({
      where: { id },
      data: {
        ...rest,
        ...(cancellationJson !== undefined
          ? {
              cancellationJson: cancellationJson as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }

  async bulkDailyRates(
    user: AuthUser,
    ratePlanId: string,
    dto: BulkDailyRatesDto,
  ) {
    const plan = await this.prisma.ratePlan.findUnique({
      where: { id: ratePlanId },
    });
    if (!plan) throw new NotFoundException('Rate plan not found');
    await this.access.assertPropertyAccess(user, plan.propertyId);
    if (!dto.rates?.length) throw new BadRequestException('rates required');

    await this.prisma.$transaction(
      dto.rates.map((r) =>
        this.prisma.dailyRate.upsert({
          where: {
            ratePlanId_date: {
              ratePlanId,
              date: parseDateOnly(r.date),
            },
          },
          update: { price: r.price },
          create: {
            ratePlanId,
            date: parseDateOnly(r.date),
            price: r.price,
          },
        }),
      ),
    );

    await this.audit.log({
      actorId: user.id,
      action: 'rate_plan.bulk_daily',
      resource: 'RatePlan',
      resourceId: ratePlanId,
      propertyId: plan.propertyId,
      metadata: { count: dto.rates.length },
    });
    return { updated: dto.rates.length };
  }

  async listDailyRates(
    user: AuthUser,
    ratePlanId: string,
    from?: string,
    to?: string,
  ) {
    const plan = await this.prisma.ratePlan.findUnique({
      where: { id: ratePlanId },
    });
    if (!plan) throw new NotFoundException('Rate plan not found');
    await this.access.assertPropertyAccess(user, plan.propertyId);
    return this.prisma.dailyRate.findMany({
      where: {
        ratePlanId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: parseDateOnly(from) } : {}),
                ...(to ? { lte: parseDateOnly(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  async addRestriction(
    user: AuthUser,
    ratePlanId: string,
    dto: UpsertRestrictionDto,
  ) {
    const plan = await this.prisma.ratePlan.findUnique({
      where: { id: ratePlanId },
    });
    if (!plan) throw new NotFoundException('Rate plan not found');
    await this.access.assertPropertyAccess(user, plan.propertyId);
    const start = parseDateOnly(dto.startDate);
    const end = parseDateOnly(dto.endDate);
    if (end < start) throw new BadRequestException('endDate before startDate');
    return this.prisma.rateRestriction.create({
      data: {
        ratePlanId,
        startDate: start,
        endDate: end,
        minStay: dto.minStay,
        maxStay: dto.maxStay,
        closedToArrival: dto.closedToArrival ?? false,
        closedToDeparture: dto.closedToDeparture ?? false,
        stopSell: dto.stopSell ?? false,
      },
    });
  }

  async listRestrictions(user: AuthUser, ratePlanId: string) {
    const plan = await this.prisma.ratePlan.findUnique({
      where: { id: ratePlanId },
    });
    if (!plan) throw new NotFoundException('Rate plan not found');
    await this.access.assertPropertyAccess(user, plan.propertyId);
    return this.prisma.rateRestriction.findMany({
      where: { ratePlanId },
      orderBy: { startDate: 'asc' },
    });
  }
}
