import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/permissions.decorator';

/**
 * Default: JWT required.
 * Public routes allow anonymous callers, but still hydrate `request.user`
 * when a valid Bearer token is present (optional auth).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    (context as ExecutionContext & { __nomadPublic?: boolean }).__nomadPublic =
      !!isPublic;

    const request = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
    }>();
    const hasBearer = Boolean(
      request.headers?.authorization?.toLowerCase().startsWith('bearer '),
    );

    if (isPublic && !hasBearer) {
      return true;
    }

    const result = super.canActivate(context);
    const promise = Promise.resolve(result as boolean | Promise<boolean>);
    return isPublic ? promise.catch(() => true) : promise;
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const isPublic =
      (context as ExecutionContext & { __nomadPublic?: boolean })
        .__nomadPublic ?? false;

    if (isPublic) {
      return (user ?? null) as TUser;
    }
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
