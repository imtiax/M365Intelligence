import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { FindingsRepository } from "../application/findings.repository";
import { FindingActionsService } from "../application/finding-actions.service";
import {
  AssignFindingDto,
  CreateFindingRemediationDto,
} from "./finding-actions.dto";
import type { PlatformRole } from "../../../shared/security/tenant-context";
import type { Severity } from "../domain/finding";

class ListFindingsQuery {
  @IsOptional()
  @IsIn(["critical", "high", "medium", "low"])
  severity?: Severity;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

@ApiTags("findings")
@ApiBearerAuth()
@Controller("api/v1/findings")
export class FindingsController {
  constructor(
    private readonly findings: FindingsRepository,
    private readonly actions: FindingActionsService,
  ) {}

  @Get()
  async list(@Req() request: Request, @Query() query: ListFindingsQuery) {
    const items = await this.findings.list(
      request.tenantContext!.tenantId,
      query,
    );
    return { items, page: { count: items.length, nextCursor: null } };
  }

  @Get(":id")
  async get(@Req() request: Request, @Param("id") id: string) {
    const finding = await this.findings.get(
      request.tenantContext!.tenantId,
      id,
    );
    if (!finding) throw new NotFoundException("Finding not found");
    return finding;
  }

  @Get(":id/case")
  case(@Req() request: Request, @Param("id") id: string) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, [
      "platform-admin",
      "security-admin",
      "m365-admin",
      "auditor",
    ]);
    return this.actions.getCase(context.tenantId, id);
  }

  @Post(":id/assignments")
  assign(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() body: AssignFindingDto,
  ) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin", "security-admin", "m365-admin"]);
    return this.actions.assign(
      context.tenantId,
      id,
      context.actorId,
      request.correlationId!,
      body,
    );
  }

  @Post(":id/remediation")
  remediation(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() body: CreateFindingRemediationDto,
  ) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin", "security-admin", "m365-admin"]);
    return this.actions.createRemediation(
      context.tenantId,
      id,
      context.actorId,
      request.correlationId!,
      body,
    );
  }

  private requireRole(actual: PlatformRole[], allowed: PlatformRole[]) {
    if (!actual.some((role) => allowed.includes(role)))
      throw new ForbiddenException(
        "The active platform role cannot modify findings.",
      );
  }
}
