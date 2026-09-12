import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { slugify } from '../../common/utils/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateApplicationDto,
  ReviewApplicationDto,
  UpdateApplicationDto,
} from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  create(user: AuthUser, dto: CreateApplicationDto) {
    return this.prisma.propertyApplication.create({
      data: {
        ownerUserId: user.id,
        legalBusinessName: dto.legalBusinessName,
        tradingName: dto.tradingName,
        registrationNumber: dto.registrationNumber,
        taxId: dto.taxId,
        ownerName: dto.ownerName,
        ownerEmail: dto.ownerEmail,
        ownerPhone: dto.ownerPhone,
        propertyName: dto.propertyName,
        propertyType: dto.propertyType ?? 'HOTEL',
        starCategory: dto.starCategory,
        addressLine1: dto.addressLine1,
        city: dto.city,
        countryCode: dto.countryCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        checklist: {
          legalInfo: false,
          ownerInfo: false,
          propertyDetails: false,
          policies: false,
          banking: false,
          documents: false,
          photos: false,
          rooms: false,
          contract: false,
        },
        history: {
          create: { toStatus: 'DRAFT', notes: 'Application created' },
        },
      },
      include: { history: true },
    });
  }

  listMine(user: AuthUser) {
    return this.prisma.propertyApplication.findMany({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { history: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
  }

  async get(user: AuthUser, id: string) {
    const app = await this.prisma.propertyApplication.findUnique({
      where: { id },
      include: {
        history: { orderBy: { createdAt: 'desc' } },
        documents: true,
        property: true,
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (!user.isPlatform && app.ownerUserId !== user.id) {
      throw new NotFoundException('Application not found');
    }
    return app;
  }

  async update(user: AuthUser, id: string, dto: UpdateApplicationDto) {
    const app = await this.get(user, id);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(app.status)) {
      throw new BadRequestException(
        'Application cannot be edited in current status',
      );
    }
    return this.prisma.propertyApplication.update({
      where: { id },
      data: dto as any,
    });
  }

  async submit(user: AuthUser, id: string) {
    const app = await this.get(user, id);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(app.status)) {
      throw new BadRequestException(
        'Only draft/changes-requested applications can be submitted',
      );
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.propertyApplication.update({
        where: { id },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      });
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: app.status,
          toStatus: 'SUBMITTED',
          notes: 'Submitted for review',
        },
      });
      return next;
    });
    await this.audit.log({
      actorId: user.id,
      action: 'onboarding.submit',
      resource: 'PropertyApplication',
      resourceId: id,
    });
    return updated;
  }

  platformList(status?: ApplicationStatus) {
    return this.prisma.propertyApplication.findMany({
      where: status ? { status } : { status: { not: 'DRAFT' } },
      orderBy: { submittedAt: 'desc' },
      include: { ownerUser: true },
      take: 100,
    });
  }

  async review(user: AuthUser, id: string, dto: ReviewApplicationDto) {
    const app = await this.prisma.propertyApplication.findUnique({
      where: { id },
    });
    if (!app) throw new NotFoundException('Application not found');

    const statusMap = {
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      REQUEST_CHANGES: 'CHANGES_REQUESTED',
      SUSPEND: 'SUSPENDED',
    } as const;
    const toStatus = statusMap[dto.decision];

    const result = await this.prisma.$transaction(async (tx) => {
      let propertyId = app.propertyId;
      let hotelGroupId = app.hotelGroupId;

      if (dto.decision === 'APPROVE') {
        const ownerRole = await tx.role.findUnique({
          where: { code: 'HOTEL_OWNER' },
        });
        if (!ownerRole)
          throw new BadRequestException('HOTEL_OWNER role missing');

        if (!hotelGroupId) {
          const slug = await this.uniqueSlug(
            tx,
            'hotelGroup',
            slugify(app.legalBusinessName),
          );
          const group = await tx.hotelGroup.create({
            data: {
              name: app.tradingName || app.legalBusinessName,
              legalName: app.legalBusinessName,
              slug,
              countryCode: app.countryCode,
              status: 'ACTIVE',
            },
          });
          hotelGroupId = group.id;
          await tx.staffMembership.create({
            data: {
              userId: app.ownerUserId,
              roleId: ownerRole.id,
              hotelGroupId: group.id,
              isActive: true,
              acceptedAt: new Date(),
            },
          });
        }

        if (!propertyId) {
          const slug = await this.uniqueSlug(
            tx,
            'property',
            slugify(app.propertyName),
          );
          const property = await tx.property.create({
            data: {
              hotelGroupId: hotelGroupId,
              name: app.propertyName,
              slug,
              propertyType: app.propertyType,
              starRating: app.starCategory,
              status: 'ACTIVE',
              email: app.contactEmail ?? app.ownerEmail,
              phone: app.contactPhone ?? app.ownerPhone,
              addressLine1: app.addressLine1,
              city: app.city,
              countryCode: app.countryCode,
              latitude: app.latitude,
              longitude: app.longitude,
              checkInFrom: app.checkInFrom ?? '14:00',
              checkOutUntil: app.checkOutUntil ?? '11:00',
              commissionRate: app.commissionRate ?? 15,
              publishedAt: new Date(),
            },
          });
          propertyId = property.id;
          await tx.staffMembership.create({
            data: {
              userId: app.ownerUserId,
              roleId: ownerRole.id,
              propertyId: property.id,
              hotelGroupId: hotelGroupId,
              isActive: true,
              acceptedAt: new Date(),
            },
          });
        }
      }

      if (dto.decision === 'SUSPEND' && app.propertyId) {
        await tx.property.update({
          where: { id: app.propertyId },
          data: { status: 'SUSPENDED' },
        });
      }

      const updated = await tx.propertyApplication.update({
        where: { id },
        data: { status: toStatus, hotelGroupId, propertyId },
      });
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: app.status,
          toStatus,
          reviewerId: user.id,
          notes: dto.notes,
        },
      });
      return updated;
    });

    await this.audit.log({
      actorId: user.id,
      action: `onboarding.${dto.decision.toLowerCase()}`,
      resource: 'PropertyApplication',
      resourceId: id,
      metadata: { notes: dto.notes },
    });
    return result;
  }

  private async uniqueSlug(
    tx: any,
    type: 'hotelGroup' | 'property',
    base: string,
  ) {
    let slug = base || type;
    let i = 0;
    while (true) {
      const found =
        type === 'hotelGroup'
          ? await tx.hotelGroup.findUnique({ where: { slug } })
          : await tx.property.findUnique({ where: { slug } });
      if (!found) return slug;
      i += 1;
      slug = `${base}-${i}`;
    }
  }
}
