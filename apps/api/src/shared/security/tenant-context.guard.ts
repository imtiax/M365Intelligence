import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { IS_PUBLIC } from './public.decorator';
import type { PlatformRole } from './tenant-context';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    request.correlationId = String(request.headers['x-correlation-id'] ?? randomUUID());
    response.setHeader('x-correlation-id', request.correlationId);

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) {
      return true;
    }

    // Development-only identity adapter. Production must replace this with verified OIDC claims.
    if (process.env.AUTH_MODE === 'development' && process.env.NODE_ENV !== 'production') {
      request.tenantContext = {
        tenantId: String(request.headers['x-tenant-id'] ?? '00000000-0000-4000-8000-000000000001'),
        actorId: String(request.headers['x-actor-id'] ?? 'local-development-user'),
        roles: String(request.headers['x-platform-roles'] ?? 'platform-admin')
          .split(',')
          .map((role) => role.trim() as PlatformRole),
      };
      return true;
    }

    throw new UnauthorizedException('A verified workforce identity is required.');
  }
}
