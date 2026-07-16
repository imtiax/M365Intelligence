import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { PlatformRole } from "../../shared/security/tenant-context";
import { AskDemoAiDto } from "./demo.dto";
import { DemoService } from "./demo.service";

@ApiTags("enterprise-demo")
@Controller("api/v1/demo")
export class DemoController {
  constructor(private readonly demo: DemoService) {}
  @Get("overview") overview() { return this.demo.overview(); }
  @Get("users") users(@Query("search") search = "", @Query("risk") risk = "", @Query("limit") limit = "100") { return this.demo.users(search, risk, Number(limit) || 100); }
  @Get("users/:id") user(@Param("id") id: string) { return this.demo.user(id); }
  @Get("security") security() { return this.demo.security(); }
  @Get("licenses") licenses() { return this.demo.licenses(); }
  @Get("compliance") compliance() { return this.demo.compliance(); }
  @Get("timeline") timeline() { return this.demo.timeline(); }
  @Get("report-templates") reportTemplates() { return this.demo.reportTemplates(); }
  @Post("ai") ask(@Body() body: AskDemoAiDto) { return this.demo.ask(body.question); }
  @Post("scenarios/:scenario/activate") activate(@Req() request: Request, @Param("scenario") scenario: string) {
    this.requireRole(request.tenantContext!.roles, ["platform-admin", "security-admin", "m365-admin"]);
    return this.demo.activateScenario(scenario, request.tenantContext!.actorId, request.correlationId!);
  }
  @Post("tick") tick(@Req() request: Request) {
    this.requireRole(request.tenantContext!.roles, ["platform-admin"]);
    return this.demo.tick(request.tenantContext!.actorId, request.correlationId!);
  }
  private requireRole(actual: PlatformRole[], allowed: PlatformRole[]) {
    if (!actual.some((role) => allowed.includes(role))) throw new ForbiddenException("The active platform role cannot perform this demo operation.");
  }
}
