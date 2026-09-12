import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  hashToken,
  randomToken,
  slugify,
} from '../../common/utils/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateHotelGroupDto,
  CreatePropertyDto,
  InviteStaffDto,
  UpdatePropertyDto,
} from './dto/hotels.dto';

@Injectable()
export class HotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async createHotelGroup(user: AuthUser, dto: CreateHotelGroupDto) {
    const slug = await this.uniqueGroupSlug(slugify(dto.name));
    const ownerRole = await this.prisma.role.findUnique({
      where: { code: 'HOTEL_OWNER' },
    });
    if (!ownerRole)
      throw new NotFoundException('HOTEL_OWNER role missing — run seed');

    const group = await this.prisma.$transaction(async (tx) => {
      const created = await tx.hotelGroup.create({
        data: {
          name: dto.name,
          legalName: dto.legalName,
          slug,
          description: dto.description,
          countryCode: dto.countryCode,
          status: 'DRAFT',
        },
      });
      await tx.staffMembership.create({
        data: {
          userId: user.id,
          roleId: ownerRole.id,
          hotelGroupId: created.id,
          isActive: true,
          acceptedAt: new Date(),
        },
      });
      return created;
    });

    await this.audit.log({
      actorId: user.id,
      action: 'hotel_group.create',
      resource: 'HotelGroup',
      resourceId: group.id,
    });
    return group;
  }

  async getHotelGroup(user: AuthUser, id: string) {
    await this.access.assertHotelGroupAccess(user, id);
    const group = await this.prisma.hotelGroup.findFirst({
      where: { id, deletedAt: null },
      include: { properties: { where: { deletedAt: null } } },
    });
    if (!group) throw new NotFoundException('Hotel group not found');
    return group;
  }

  async createProperty(user: AuthUser, dto: CreatePropertyDto) {
    await this.access.assertHotelGroupAccess(user, dto.hotelGroupId);
    const slug = await this.uniquePropertySlug(slugify(dto.name));
    const property = await this.prisma.property.create({
      data: {
        hotelGroupId: dto.hotelGroupId,
        name: dto.name,
        slug,
        propertyType: dto.propertyType ?? 'HOTEL',
        starRating: dto.starRating,
        timezone: dto.timezone ?? 'UTC',
        currency: dto.currency ?? 'USD',
        email: dto.email,
        phone: dto.phone,
        addressLine1: dto.addressLine1,
        city: dto.city,
        countryCode: dto.countryCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: 'DRAFT',
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'property.create',
      resource: 'Property',
      resourceId: property.id,
      propertyId: property.id,
    });
    return property;
  }

  async listProperties(user: AuthUser) {
    if (user.isPlatform) {
      return this.prisma.property.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }
    const propertyIds = user.memberships
      .map((m) => m.propertyId)
      .filter(Boolean) as string[];
    const groupIds = user.memberships
      .map((m) => m.hotelGroupId)
      .filter(Boolean) as string[];
    return this.prisma.property.findMany({
      where: {
        deletedAt: null,
        OR: [
          ...(propertyIds.length ? [{ id: { in: propertyIds } }] : []),
          ...(groupIds.length ? [{ hotelGroupId: { in: groupIds } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getProperty(user: AuthUser, id: string) {
    return this.access.assertPropertyAccess(user, id);
  }

  async updateProperty(user: AuthUser, id: string, dto: UpdatePropertyDto) {
    await this.access.assertPropertyAccess(user, id);
    const { hotelGroupId: _ignore, ...rest } = dto;
    const property = await this.prisma.property.update({
      where: { id },
      data: rest,
    });
    await this.audit.log({
      actorId: user.id,
      action: 'property.update',
      resource: 'Property',
      resourceId: id,
      propertyId: id,
    });
    return property;
  }

  async inviteStaff(user: AuthUser, dto: InviteStaffDto) {
    if (dto.propertyId)
      await this.access.assertPropertyAccess(user, dto.propertyId);
    if (dto.hotelGroupId)
      await this.access.assertHotelGroupAccess(user, dto.hotelGroupId);
    const role = await this.prisma.role.findUnique({
      where: { code: dto.roleCode },
    });
    if (!role) throw new NotFoundException('Role not found');
    const token = randomToken();
    const invitation = await this.prisma.staffInvitation.create({
      data: {
        email: dto.email.toLowerCase(),
        roleId: role.id,
        hotelGroupId: dto.hotelGroupId,
        propertyId: dto.propertyId,
        tokenHash: hashToken(token),
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'staff.invite',
      resource: 'StaffInvitation',
      resourceId: invitation.id,
      propertyId: dto.propertyId,
    });
    return {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      inviteToken:
        (process.env.NODE_ENV ?? 'development') !== 'production'
          ? token
          : undefined,
    };
  }

  async listStaff(user: AuthUser, propertyId: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    const property = await this.prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    return this.prisma.staffMembership.findMany({
      where: {
        isActive: true,
        OR: [{ propertyId }, { hotelGroupId: property.hotelGroupId }],
      },
      include: { user: true, role: true },
    });
  }

  private async uniqueGroupSlug(base: string) {
    let slug = base || 'group';
    let i = 0;
    while (await this.prisma.hotelGroup.findUnique({ where: { slug } })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    return slug;
  }

  private async uniquePropertySlug(base: string) {
    let slug = base || 'property';
    let i = 0;
    while (await this.prisma.property.findUnique({ where: { slug } })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    return slug;
  }
}
