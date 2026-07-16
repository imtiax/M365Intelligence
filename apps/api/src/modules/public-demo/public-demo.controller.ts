import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PublicDemoRoute } from '../../shared/security/public-demo.decorator';
import {
  PublicDemoModuleQueryDto,
  PublicDemoReportPreviewDto,
  PublicDemoScenarioDto,
} from './public-demo.dto';
import { PublicDemoService } from './public-demo.service';

@ApiTags('public-demo')
@PublicDemoRoute()
@Controller('api/v1/public-demo')
export class PublicDemoController {
  constructor(private readonly demo: PublicDemoService) {}

  @Get('bootstrap')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  bootstrap(@Req() request: Request) {
    return this.demo.bootstrap(
      request.tenantContext!.demoSessionId!,
      request.tenantContext!.demoPersona!,
    );
  }

  @Get('module/:moduleId')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  module(
    @Req() request: Request,
    @Param('moduleId') moduleId: string,
    @Query() query: PublicDemoModuleQueryDto,
  ) {
    return this.demo.module(
      request.tenantContext!.demoSessionId!,
      moduleId,
      query,
    );
  }

  @Post('report-preview')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  reportPreview(
    @Req() request: Request,
    @Body() body: PublicDemoReportPreviewDto,
  ) {
    return this.demo.reportPreview(
      request.tenantContext!.demoSessionId!,
      body,
    );
  }

  @Post('scenario')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  scenario(@Req() request: Request, @Body() body: PublicDemoScenarioDto) {
    if (body.action === 'tick') {
      return this.demo.tick(request.tenantContext!.demoSessionId!);
    }
    if (!body.scenario) {
      throw new BadRequestException('Choose an allow-listed public demo scenario.');
    }
    return this.demo.selectScenario(
      request.tenantContext!.demoSessionId!,
      body.scenario,
    );
  }

  @Post('reset')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  reset(@Req() request: Request) {
    return this.demo.reset(request.tenantContext!.demoSessionId!);
  }
}
