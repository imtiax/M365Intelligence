import {
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ReportFilterDto {
  @IsIn([
    "status",
    "risk",
    "department",
    "region",
    "type",
    "external",
    "activityScore",
  ])
  field!:
    | "status"
    | "risk"
    | "department"
    | "region"
    | "type"
    | "external"
    | "activityScore";

  @IsIn(["equals", "not_equals", "contains", "gte", "lte"])
  operator!: "equals" | "not_equals" | "contains" | "gte" | "lte";

  @IsString()
  @MaxLength(200)
  value!: string;

  @IsIn(["and", "or"])
  logic!: "and" | "or";
}

export class CreateReportJobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  workload!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  columns?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto[];
}

export class ListReportJobsQuery {
  @IsOptional()
  @IsIn(["queued", "running", "completed", "failed"])
  status?: "queued" | "running" | "completed" | "failed";

  @IsOptional()
  @IsString()
  @MaxLength(100)
  workload?: string;

  @IsOptional()
  @IsIn(["interactive", "schedule_manual"])
  trigger?: "interactive" | "schedule_manual";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  viewId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 100;
}

export class CreateReportViewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reportId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  reportName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  workload!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  columns!: string[];

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ReportFilterDto)
  filters!: ReportFilterDto[];

  @IsIn(["private", "team"])
  visibility!: "private" | "team";

  @IsBoolean()
  favorite!: boolean;
}

export class CreateReportScheduleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsIn(["daily", "weekly", "monthly"])
  cadence!: "daily" | "weekly" | "monthly";

  @IsString()
  @Matches(/^(UTC|[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+)$/)
  timezone!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  runAt!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;

  @IsIn(["local_archive"])
  delivery!: "local_archive";

  @IsOptional()
  @IsIn(["active", "paused"])
  status: "active" | "paused" = "active";
}

export class CreateReportAlertDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsIn(["row_count", "critical_count", "warning_count", "average_risk"])
  metric!:
    | "row_count"
    | "critical_count"
    | "warning_count"
    | "average_risk";

  @IsIn(["gt", "gte", "eq", "lte", "lt"])
  operator!: "gt" | "gte" | "eq" | "lte" | "lt";

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  threshold!: number;

  @IsIn(["info", "warning", "critical"])
  severity!: "info" | "warning" | "critical";

  @IsOptional()
  @IsIn(["active", "paused"])
  status: "active" | "paused" = "active";
}

export class ReportOperationsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  targetScope!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  justification!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  owner?: string;
}

export class WorkflowDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(400)
  comment?: string;
}

export class ListAuditQuery {
  @IsOptional()
  @IsIn([
    "report",
    "report_view",
    "report_schedule",
    "report_alert",
    "workflow",
    "finding",
    "simulation",
    "runtime",
  ])
  objectType?: string;
}
