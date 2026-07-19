import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateReportDefinitionDto {
  @IsString() @IsNotEmpty() @MaxLength(140) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) datasetCode!: string;
  @IsObject() definition!: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsIn(["private", "team", "organization"]) visibility?: "private" | "team" | "organization";
}

export class CreateWorkflowCaseDto {
  @IsString() @IsNotEmpty() @MaxLength(100) type!: string;
  @IsString() @IsNotEmpty() @MaxLength(180) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) justification!: string;
  @IsObject() targetScope!: Record<string, unknown>;
}

export class CreateRunbookExecutionDto {
  @IsString() @IsNotEmpty() runbookCode!: string;
  @IsObject() targetScope!: Record<string, unknown>;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) evidenceIds?: string[];
}
