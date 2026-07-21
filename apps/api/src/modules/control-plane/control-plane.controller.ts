import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CreateReportDefinitionDto, CreateRunbookExecutionDto, CreateWorkflowCaseDto } from "./control-plane.dto";
import { ControlPlaneService } from "./control-plane.service";

@ApiTags("control-plane")
@ApiBearerAuth()
@Controller("api/v1/control-plane")
export class ControlPlaneController {
  constructor(private readonly service: ControlPlaneService) {}

  @Get("overview") overview(@Req() request: Request) { return this.service.overview(request.tenantContext!.tenantId); }
  @Get("connection-readiness") connectionReadiness(@Req() request: Request) { return this.service.connectionReadiness(request.tenantContext!.tenantId); }
  @Get("connectors") connectors(@Req() request: Request) { return this.service.listConnectors(request.tenantContext!.tenantId); }
  @Get("reports") reports(@Req() request: Request) { return this.service.listReports(request.tenantContext!.tenantId); }
  @Post("reports") createReport(@Req() request: Request, @Body() dto: CreateReportDefinitionDto) { const context = request.tenantContext!; return this.service.createReport(context.tenantId, context.actorId, context.roles, dto); }
  @Get("runbooks") runbooks(@Req() request: Request) { return this.service.listRunbooks(request.tenantContext!.tenantId); }
  @Post("runbooks/prepare") prepareRunbook(@Req() request: Request, @Body() dto: CreateRunbookExecutionDto) { const context = request.tenantContext!; return this.service.prepareRunbookExecution(context.tenantId, context.actorId, context.roles, dto); }
  @Post("workflows") createWorkflow(@Req() request: Request, @Body() dto: CreateWorkflowCaseDto) { const context = request.tenantContext!; return this.service.createWorkflow(context.tenantId, context.actorId, context.roles, dto); }
}
