import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { FindingsRepository } from "../application/findings.repository";
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
  constructor(private readonly findings: FindingsRepository) {}

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
}
