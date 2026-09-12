import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import { CreatePromotionDto, ValidatePromoDto } from './dto/promotions.dto';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreatePromotionDto) {
    if (dto.isPlatform && !user.isPlatform) {
      throw new BadRequestException(
        'Platform promotions require platform role',
      );
    }
    if (dto.propertyIds?.length) {
      for (const propertyId of dto.propertyIds) {
        await this.access.assertPropertyAccess(user, propertyId);
      }
    }
    if (dto.percentOff == null && dto.amountOff == null) {
      throw new BadRequestException('percentOff or amountOff required');
    }
    const promo = await this.prisma.promotion.create({
      data: {
        code: dto.code?.toUpperCase(),
        name: dto.name,
        description: dto.description,
        percentOff: dto.percentOff,
        amountOff: dto.amountOff,
        currency: dto.currency,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        usageLimit: dto.usageLimit,
        minBookingAmount: dto.minBookingAmount,
        propertyIds: dto.propertyIds ?? [],
        isPlatform: dto.isPlatform ?? false,
        isActive: true,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'promotion.create',
      resource: 'Promotion',
      resourceId: promo.id,
    });
    return promo;
  }

  async list(activeOnly = true) {
    return this.prisma.promotion.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async validate(dto: ValidatePromoDto) {
    const promo = await this.prisma.promotion.findFirst({
      where: { code: dto.code.toUpperCase(), isActive: true },
    });
    if (!promo) throw new NotFoundException('Promotion not found');
    const now = new Date();
    if (promo.startsAt && promo.startsAt > now)
      throw new BadRequestException('Promotion not started');
    if (promo.endsAt && promo.endsAt < now)
      throw new BadRequestException('Promotion expired');
    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Promotion usage limit reached');
    }
    if (
      promo.propertyIds.length &&
      !promo.propertyIds.includes(dto.propertyId)
    ) {
      throw new BadRequestException('Promotion not valid for this property');
    }
    if (
      promo.minBookingAmount != null &&
      dto.bookingAmount < Number(promo.minBookingAmount)
    ) {
      throw new BadRequestException('Booking amount below minimum');
    }
    let discount = 0;
    if (promo.percentOff != null) {
      discount =
        Math.round(dto.bookingAmount * (Number(promo.percentOff) / 100) * 100) /
        100;
    } else if (promo.amountOff != null) {
      discount = Math.min(dto.bookingAmount, Number(promo.amountOff));
    }
    return {
      promotion: promo,
      discount,
      finalAmount: Math.max(0, dto.bookingAmount - discount),
    };
  }

  async deactivate(user: AuthUser, id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    return this.prisma.promotion.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
