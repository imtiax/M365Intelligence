import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { FindingsModule } from "./modules/findings/findings.module";
import { HealthController } from "./modules/health/health.controller";
import { OperationsModule } from "./modules/operations/operations.module";
import { RuntimeModule } from "./modules/runtime/runtime.module";
import { TenantContextGuard } from "./shared/security/tenant-context.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DashboardModule,
    FindingsModule,
    RuntimeModule,
    OperationsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: TenantContextGuard }],
})
export class AppModule {}
