import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FindingsModule } from './modules/findings/findings.module';
import { HealthController } from './modules/health/health.controller';
import { TenantContextGuard } from './shared/security/tenant-context.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DashboardModule,
    FindingsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: TenantContextGuard }],
})
export class AppModule {}

