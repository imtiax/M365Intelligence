import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  PUBLIC_DEMO_MODULE_IDS,
  PUBLIC_DEMO_REPORT_FIELDS,
  PUBLIC_DEMO_SCENARIO_IDS,
  type PublicDemoModuleId,
  type PublicDemoScenarioId,
} from './public-demo.seed';

const filterOperators = [
  'equals',
  'not_equals',
  'contains',
  'gte',
  'lte',
] as const;
type FilterOperator = (typeof filterOperators)[number];

const reportFilterFields = [
  ...PUBLIC_DEMO_REPORT_FIELDS,
  'department',
  'type',
  'external',
  'activityScore',
] as const;

export class PublicDemoReportFilterDto {
  @IsIn([...reportFilterFields])
  field!: (typeof reportFilterFields)[number];

  @IsIn([...filterOperators])
  operator!: FilterOperator;

  @IsString()
  @MaxLength(80)
  value!: string;

  @IsOptional()
  @IsIn(['and', 'or'])
  logic?: 'and' | 'or';
}

export class PublicDemoReportPreviewDto {
  @IsOptional()
  @IsIn(['report', 'ai'])
  kind: 'report' | 'ai' = 'report';

  @IsOptional()
  @IsIn([...PUBLIC_DEMO_MODULE_IDS])
  moduleId?: PublicDemoModuleId;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reportId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  workload?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  question?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(PUBLIC_DEMO_REPORT_FIELDS.length)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  columns?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => PublicDemoReportFilterDto)
  filters: PublicDemoReportFilterDto[] = [];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export class PublicDemoModuleQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search = '';

  @IsOptional()
  @IsString()
  @MaxLength(20)
  risk = '';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(250)
  limit = 100;
}

export class PublicDemoScenarioDto {
  @IsOptional()
  @IsIn([...PUBLIC_DEMO_SCENARIO_IDS])
  scenario?: PublicDemoScenarioId;

  @IsOptional()
  @IsIn(['tick'])
  action?: 'tick';
}
