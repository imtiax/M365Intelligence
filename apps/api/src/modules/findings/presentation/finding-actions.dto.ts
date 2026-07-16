import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class AssignFindingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  assigneeId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  assigneeName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  team!: string;

  @IsIn(["low", "medium", "high", "urgent"])
  priority!: "low" | "medium" | "high" | "urgent";

  @IsDateString()
  dueAt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  note!: string;
}

export class CreateFindingRemediationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  targetScope!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  justification!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsIn(["leave", "service_accounts", "legal_hold", "dependencies", "business_exceptions"], {
    each: true,
  })
  exceptionReview!: string[];

  @IsBoolean()
  submitForApproval!: boolean;
}
