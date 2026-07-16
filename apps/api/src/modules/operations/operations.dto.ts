import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

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
  @IsIn(["report", "workflow", "finding", "simulation", "runtime"])
  objectType?: string;
}
