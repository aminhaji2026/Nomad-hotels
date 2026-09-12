import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  HOTEL_ROLE_PERMISSIONS,
  PLATFORM_ROLE_PERMISSIONS,
  PermissionCode,
} from '../../../common/constants/permissions';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

type JwtPayload = { sub: string; typ: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.typ !== 'access')
      throw new UnauthorizedException('Invalid token type');
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      include: {
        memberships: { where: { isActive: true }, include: { role: true } },
      },
    });
    if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new UnauthorizedException('Account unavailable');
    }

    const permissions = new Set<PermissionCode>();
    let isPlatform = false;
    const memberships = user.memberships.map((m) => {
      const roleCode = m.role.code;
      const platform = PLATFORM_ROLE_PERMISSIONS[roleCode];
      const hotel = HOTEL_ROLE_PERMISSIONS[roleCode];
      if (platform) {
        isPlatform = true;
        platform.forEach((p) => permissions.add(p));
      }
      if (hotel) hotel.forEach((p) => permissions.add(p));
      (m.customPermissions ?? []).forEach((p) =>
        permissions.add(p as PermissionCode),
      );
      return {
        id: m.id,
        roleCode,
        hotelGroupId: m.hotelGroupId,
        propertyId: m.propertyId,
      };
    });

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      permissions: [...permissions],
      memberships,
      isPlatform,
    };
  }
}
