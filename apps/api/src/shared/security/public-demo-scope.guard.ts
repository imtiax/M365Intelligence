import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_DEMO_ROUTE } from './public-demo.decorator';

@Injectable()
export class PublicDemoScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const isPublicDemoRoute = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_DEMO_ROUTE,
      [context.getHandler(), context.getClass()],
    );
    const tenantContext = request.tenantContext;

    if (isPublicDemoRoute) {
      if (process.env.AEGIS_PUBLIC_DEMO_ENABLED !== 'true') {
        throw new NotFoundException({
          code: 'public_demo_disabled',
          message: 'The public demo is not enabled on this deployment.',
        });
      }
      if (
        tenantContext?.sessionType !== 'public-demo' ||
        !tenantContext.demoSessionId ||
        !tenantContext.demoPersona
      ) {
        throw new ForbiddenException({
          code: 'public_demo_boundary',
          message:
            'This endpoint is available only to an isolated public demo session.',
        });
      }
      return true;
    }

    if (tenantContext?.sessionType === 'public-demo') {
      throw new ForbiddenException({
        code: 'public_demo_boundary',
        message: 'Public demo sessions cannot access the customer runtime API.',
      });
    }

    return true;
  }
}
