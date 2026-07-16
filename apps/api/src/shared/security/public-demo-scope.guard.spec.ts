import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHmac, randomUUID } from 'node:crypto';
import { IS_PUBLIC_DEMO_ROUTE } from './public-demo.decorator';
import { PublicDemoScopeGuard } from './public-demo-scope.guard';
import { TenantContextGuard } from './tenant-context.guard';

const secret = 'public-demo-test-secret-with-more-than-forty-three-characters-12345';

function httpContext(
  request: Record<string, any>,
  markedPublicDemo = false,
): ExecutionContext {
  const handler = function testHandler() {};
  const controller = function TestController() {};
  if (markedPublicDemo) {
    Reflect.defineMetadata(IS_PUBLIC_DEMO_ROUTE, true, handler);
  }
  const response = { setHeader: jest.fn() };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: () => undefined,
    }),
    getHandler: () => handler,
    getClass: () => controller,
    getType: () => 'http',
    getArgs: () => [request, response],
    getArgByIndex: (index: number) => [request, response][index],
    switchToRpc: () => { throw new Error('not used'); },
    switchToWs: () => { throw new Error('not used'); },
  } as unknown as ExecutionContext;
}

function signedRequest(payload: Record<string, unknown>): {
  headers: Record<string, string>;
  tenantContext?: Record<string, unknown>;
} {
  const identity = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return {
    headers: {
      'x-aegis-identity': identity,
      'x-aegis-signature': createHmac('sha256', secret)
        .update(identity)
        .digest('base64url'),
    },
  };
}

describe('public demo API boundary', () => {
  const originalMode = process.env.AUTH_MODE;
  const originalSecret = process.env.AEGIS_INTERNAL_API_SECRET;
  const originalDemoEnabled = process.env.AEGIS_PUBLIC_DEMO_ENABLED;

  beforeAll(() => {
    process.env.AUTH_MODE = 'internal';
    process.env.AEGIS_INTERNAL_API_SECRET = secret;
    process.env.AEGIS_PUBLIC_DEMO_ENABLED = 'true';
  });

  afterAll(() => {
    if (originalMode === undefined) delete process.env.AUTH_MODE;
    else process.env.AUTH_MODE = originalMode;
    if (originalSecret === undefined) delete process.env.AEGIS_INTERNAL_API_SECRET;
    else process.env.AEGIS_INTERNAL_API_SECRET = originalSecret;
    if (originalDemoEnabled === undefined) delete process.env.AEGIS_PUBLIC_DEMO_ENABLED;
    else process.env.AEGIS_PUBLIC_DEMO_ENABLED = originalDemoEnabled;
  });

  it('accepts a signed read-only public-demo context with session and persona', () => {
    const request = signedRequest({
      tenantId: 'public-demo-v1',
      actorId: 'public-demo:11111111',
      roles: ['read-only'],
      sessionType: 'public-demo',
      demoSessionId: '11111111-1111-4111-8111-111111111111',
      demoPersona: 'security',
      issuedAt: Date.now(),
      nonce: randomUUID(),
    });
    const guard = new TenantContextGuard(new Reflector());
    expect(guard.canActivate(httpContext(request))).toBe(true);
    expect(request.tenantContext).toMatchObject({
      sessionType: 'public-demo',
      demoSessionId: '11111111-1111-4111-8111-111111111111',
      demoPersona: 'security',
      roles: ['read-only'],
    });
  });

  it.each([
    { roles: ['platform-admin'], demoPersona: 'security' },
    { roles: ['read-only'], demoPersona: 'platform-admin' },
    { roles: ['read-only'], demoPersona: undefined },
  ])('rejects forged or incomplete public-demo claims: %o', (claims) => {
    const request = signedRequest({
      tenantId: 'public-demo-v1',
      actorId: 'public-demo:invalid',
      sessionType: 'public-demo',
      demoSessionId: '11111111-1111-4111-8111-111111111111',
      issuedAt: Date.now(),
      nonce: randomUUID(),
      ...claims,
    });
    const guard = new TenantContextGuard(new Reflector());
    expect(() => guard.canActivate(httpContext(request))).toThrow(
      UnauthorizedException,
    );
  });

  it('preserves a legacy signed workforce context', () => {
    const request = signedRequest({
      tenantId: '00000000-0000-4000-8000-000000000001',
      actorId: 'workforce@northstar.example',
      roles: ['platform-admin'],
      issuedAt: Date.now(),
      nonce: randomUUID(),
    });
    const guard = new TenantContextGuard(new Reflector());
    expect(guard.canActivate(httpContext(request))).toBe(true);
    expect(request.tenantContext).toMatchObject({ sessionType: 'workforce' });
  });

  it('allows demo sessions only on explicitly marked controllers', () => {
    const demoRequest = {
      tenantContext: {
        tenantId: 'public-demo-v1',
        actorId: 'public-demo:11111111',
        roles: ['read-only'],
        sessionType: 'public-demo',
        demoSessionId: '11111111-1111-4111-8111-111111111111',
        demoPersona: 'executive',
      },
    };
    const guard = new PublicDemoScopeGuard(new Reflector());
    expect(guard.canActivate(httpContext(demoRequest, true))).toBe(true);
    try {
      guard.canActivate(httpContext(demoRequest, false));
      throw new Error('Expected the customer runtime boundary to deny access.');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: 'public_demo_boundary',
      });
    }
  });

  it('blocks workforce sessions from public-demo-only controllers', () => {
    const request = {
      tenantContext: {
        tenantId: 'tenant-a',
        actorId: 'admin@northstar.example',
        roles: ['platform-admin'],
        sessionType: 'workforce',
      },
    };
    const guard = new PublicDemoScopeGuard(new Reflector());
    expect(() => guard.canActivate(httpContext(request, true))).toThrow(
      ForbiddenException,
    );
    expect(guard.canActivate(httpContext(request, false))).toBe(true);
  });

  it('fails closed when the API public-demo feature flag is disabled', () => {
    const request = {
      tenantContext: {
        tenantId: 'public-demo-v1',
        actorId: 'public-demo:11111111',
        roles: ['read-only'],
        sessionType: 'public-demo',
        demoSessionId: '11111111-1111-4111-8111-111111111111',
        demoPersona: 'executive',
      },
    };
    const guard = new PublicDemoScopeGuard(new Reflector());
    process.env.AEGIS_PUBLIC_DEMO_ENABLED = 'false';
    try {
      expect(() => guard.canActivate(httpContext(request, true))).toThrow(
        'The public demo is not enabled on this deployment.',
      );
    } finally {
      process.env.AEGIS_PUBLIC_DEMO_ENABLED = 'true';
    }
  });
});
