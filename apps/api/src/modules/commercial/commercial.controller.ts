import { Controller, ForbiddenException, Get, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { PlatformRole } from "../../shared/security/tenant-context";
import { CommercialService } from "./commercial.service";

@ApiTags("commercial-product")
@Controller("api/v1/commercial")
export class CommercialController {
  constructor(private readonly commercial: CommercialService) {}

  @Get("organization") organization(@Req() request: Request) { return this.commercial.organization(request.tenantContext!.tenantId); }
  @Get("subscription") subscription(@Req() request: Request) { return this.commercial.subscription(request.tenantContext!.tenantId); }
  @Get("license") license(@Req() request: Request) { return this.commercial.license(request.tenantContext!.tenantId); }
  @Get("connectors") connectors(@Req() request: Request) { return this.commercial.listConnectors(request.tenantContext!.tenantId); }

  @Post("connectors/:code/validate")
  validate(@Req() request: Request, @Param("code") code: string) {
    this.requireRole(request.tenantContext!.roles, ["platform-admin", "m365-admin"]);
    return this.commercial.validateConnector(request.tenantContext!.tenantId, code, request.tenantContext!.actorId, request.correlationId!);
  }

  @Get("super-admin/customers")
  customers(@Req() request: Request) {
    this.requireRole(request.tenantContext!.roles, ["platform-admin"]);
    return this.commercial.customers(request.tenantContext!.tenantId);
  }

  private requireRole(actual: PlatformRole[], allowed: PlatformRole[]) {
    if (!actual.some((role) => allowed.includes(role))) throw new ForbiddenException("The active role cannot perform this commercial control-plane operation.");
  }
}
