import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { IS_PUBLIC } from './public.decorator';
import type { PlatformRole, SessionType } from './tenant-context';

@Injectable()
export class TenantContextGuard implements CanActivate {
  private readonly seenNonces = new Map<string, number>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    request.correlationId = String(request.headers['x-correlation-id'] ?? randomUUID());
    response.setHeader('x-correlation-id', request.correlationId);
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;

    if (process.env.AUTH_MODE === 'internal') {
      const encoded = request.headers['x-aegis-identity'];
      const suppliedSignature = request.headers['x-aegis-signature'];
      const secret = process.env.AEGIS_INTERNAL_API_SECRET;
      if (typeof encoded !== 'string' || typeof suppliedSignature !== 'string' || !secret || secret.length < 43) throw new UnauthorizedException('A signed internal workforce identity is required.');
      const expected = createHmac('sha256', secret).update(encoded).digest();
      let supplied: Buffer;
      try { supplied = Buffer.from(suppliedSignature, 'base64url'); }
      catch { throw new UnauthorizedException('The internal identity signature is invalid.'); }
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new UnauthorizedException('The internal identity signature is invalid.');

      let identity: { tenantId?: unknown; actorId?: unknown; roles?: unknown; issuedAt?: unknown; nonce?: unknown; sessionType?: unknown };
      try { identity = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); }
      catch { throw new UnauthorizedException('The internal identity payload is invalid.'); }
      const allowedRoles: PlatformRole[] = ['platform-admin', 'security-admin', 'm365-admin', 'auditor', 'report-admin', 'read-only'];
      const sessionType: SessionType = identity.sessionType === undefined ? 'workforce' : identity.sessionType as SessionType;
      if (typeof identity.tenantId !== 'string' || typeof identity.actorId !== 'string' || !Array.isArray(identity.roles) || !identity.roles.length || !identity.roles.every((role) => allowedRoles.includes(role as PlatformRole)) || sessionType !== 'workforce' || typeof identity.issuedAt !== 'number' || Math.abs(Date.now() - identity.issuedAt) > 60_000 || typeof identity.nonce !== 'string' || !/^[0-9a-f-]{36}$/i.test(identity.nonce)) throw new UnauthorizedException('The internal identity claims are invalid or expired.');
      for (const [nonce, expiresAt] of this.seenNonces) if (expiresAt < Date.now()) this.seenNonces.delete(nonce);
      if (this.seenNonces.has(identity.nonce)) throw new UnauthorizedException('The internal identity envelope has already been used.');
      this.seenNonces.set(identity.nonce, Date.now() + 60_000);
      request.tenantContext = { tenantId: identity.tenantId, actorId: identity.actorId, roles: identity.roles as PlatformRole[], sessionType };
      return true;
    }

    if (process.env.AUTH_MODE === 'development' && process.env.NODE_ENV !== 'production') {
      request.tenantContext = {
        tenantId: String(request.headers['x-tenant-id'] ?? randomUUID()),
        actorId: String(request.headers['x-actor-id'] ?? 'local-development-user'),
        roles: String(request.headers['x-platform-roles'] ?? 'platform-admin').split(',').map((role) => role.trim() as PlatformRole),
        sessionType: 'workforce',
      };
      return true;
    }
    throw new UnauthorizedException('A verified workforce identity is required.');
  }
}
