import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  UpsertDestinationDto,
  UpsertExchangeRateDto,
  UpsertSettingDto,
} from './dto/platform.dto';

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listSettings() {
    return this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertSetting(user: AuthUser, dto: UpsertSettingDto) {
    const row = await this.prisma.systemSetting.upsert({
      where: { key: dto.key },
      update: { value: dto.value as Prisma.InputJsonValue },
      create: {
        key: dto.key,
        value: dto.value as Prisma.InputJsonValue,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'platform.setting_upsert',
      resource: 'SystemSetting',
      resourceId: row.id,
      metadata: { key: dto.key },
    });
    return row;
  }

  listDestinations(activeOnly = true) {
    return this.prisma.destination.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async upsertDestination(user: AuthUser, dto: UpsertDestinationDto) {
    const row = await this.prisma.destination.upsert({
      where: { slug: dto.slug },
      update: {
        name: dto.name,
        countryCode: dto.countryCode.toUpperCase(),
        type: dto.type,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isActive: dto.isActive ?? true,
      },
      create: {
        name: dto.name,
        slug: dto.slug,
        countryCode: dto.countryCode.toUpperCase(),
        type: dto.type ?? 'city',
        latitude: dto.latitude,
        longitude: dto.longitude,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'platform.destination_upsert',
      resource: 'Destination',
      resourceId: row.id,
    });
    return row;
  }

  async setDestinationActive(user: AuthUser, id: string, isActive: boolean) {
    const existing = await this.prisma.destination.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Destination not found');
    const row = await this.prisma.destination.update({
      where: { id },
      data: { isActive },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'platform.destination_toggle',
      resource: 'Destination',
      resourceId: id,
      metadata: { isActive },
    });
    return row;
  }

  listExchangeRates() {
    return this.prisma.exchangeRate.findMany({
      orderBy: { asOf: 'desc' },
      take: 200,
    });
  }

  async upsertExchangeRate(user: AuthUser, dto: UpsertExchangeRateDto) {
    if (dto.rate <= 0) throw new BadRequestException('Rate must be positive');
    const asOf = dto.asOf ? new Date(dto.asOf) : new Date();
    const row = await this.prisma.exchangeRate.upsert({
      where: {
        baseCurrency_quoteCurrency_asOf: {
          baseCurrency: dto.baseCurrency.toUpperCase(),
          quoteCurrency: dto.quoteCurrency.toUpperCase(),
          asOf,
        },
      },
      update: { rate: dto.rate },
      create: {
        baseCurrency: dto.baseCurrency.toUpperCase(),
        quoteCurrency: dto.quoteCurrency.toUpperCase(),
        rate: dto.rate,
        asOf,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'platform.fx_upsert',
      resource: 'ExchangeRate',
      resourceId: row.id,
    });
    return row;
  }

  async listWebhookEvents(limit = 100) {
    return this.prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  }

  async listAuditLogs(limit = 100, propertyId?: string) {
    return this.prisma.auditLog.findMany({
      where: propertyId ? { propertyId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  }

  async featureProperty(user: AuthUser, propertyId: string, featured: boolean) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found');
    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { isFeatured: featured },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'platform.feature_property',
      resource: 'Property',
      resourceId: propertyId,
      propertyId,
      metadata: { featured },
    });
    return updated;
  }
}
