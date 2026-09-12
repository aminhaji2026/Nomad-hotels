import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PermissionCode } from '../constants/permissions';

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  permissions: PermissionCode[];
  memberships: Array<{
    id: string;
    roleCode: string;
    hotelGroupId: string | null;
    propertyId: string | null;
  }>;
  isPlatform: boolean;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
