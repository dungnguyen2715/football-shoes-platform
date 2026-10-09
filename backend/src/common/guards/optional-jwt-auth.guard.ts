import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers.authorization) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthUser | undefined>(
    _error: unknown,
    user: AuthUser | null | undefined,
  ): TUser {
    // This guard is used only on public routes; invalid or expired credentials
    // must not turn an otherwise public request into a 401 response.
    return (user ?? undefined) as TUser;
  }
}
