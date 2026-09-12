import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertPropertyAccess(user: AuthUser, propertyId: string) {
    if (user.isPlatform) return this.getProperty(propertyId);
    const property = await this.getProperty(propertyId);
    const allowed = user.memberships.some(
      (m) =>
        m.propertyId === propertyId ||
        (m.hotelGroupId != null && m.hotelGroupId === property.hotelGroupId),
    );
    if (!allowed) throw new ForbiddenException('No access to this property');
    return property;
  }

  async assertHotelGroupAccess(user: AuthUser, hotelGroupId: string) {
    if (user.isPlatform) return;
    if (user.memberships.some((m) => m.hotelGroupId === hotelGroupId)) return;
    const propertyIds = user.memberships
      .map((m) => m.propertyId)
      .filter(Boolean) as string[];
    if (propertyIds.length) {
      const count = await this.prisma.property.count({
        where: { id: { in: propertyIds }, hotelGroupId, deletedAt: null },
      });
      if (count > 0) return;
    }
    throw new ForbiddenException('No access to this hotel group');
  }

  private async getProperty(propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }
}
