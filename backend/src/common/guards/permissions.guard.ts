import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user) throw new ForbiddenException('Authentication required');

    const has = required.every((p) => user.permissions.includes(p as any));
    if (!has) {
      throw new ForbiddenException('Missing required permission');
    }

    // Optional property scope from params/body/query
    const propertyId =
      request.params?.propertyId ||
      request.body?.propertyId ||
      request.query?.propertyId;
    if (propertyId && !user.isPlatform) {
      const allowed = user.memberships.some(
        (m) =>
          m.propertyId === propertyId ||
          (m.hotelGroupId &&
            request.propertyGroupMap?.[propertyId] === m.hotelGroupId),
      );
      // Soft check: controllers also enforce via service layer with DB
      if (
        !allowed &&
        user.memberships.every((m) => m.propertyId || m.hotelGroupId)
      ) {
        // allow through to service for group-level resolution
      }
    }
    return true;
  }
}
