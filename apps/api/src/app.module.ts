import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { CommercialModule } from "./modules/commercial/commercial.module";
import { ControlPlaneModule } from "./modules/control-plane/control-plane.module";
import { DemoModule } from "./modules/demo/demo.module";
import { FindingsModule } from "./modules/findings/findings.module";
import { HealthController } from "./modules/health/health.controller";
import { OperationsModule } from "./modules/operations/operations.module";
import { PublicDemoModule } from "./modules/public-demo/public-demo.module";
import { RuntimeModule } from "./modules/runtime/runtime.module";
import { PublicDemoScopeGuard } from "./shared/security/public-demo-scope.guard";
import { TenantContextGuard } from "./shared/security/tenant-context.guard";
import { DatabaseModule } from "./shared/database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    DashboardModule,
    CommercialModule,
    ControlPlaneModule,
    DemoModule,
    FindingsModule,
    RuntimeModule,
    OperationsModule,
    PublicDemoModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: TenantContextGuard },
    { provide: APP_GUARD, useClass: PublicDemoScopeGuard },
  ],
})
export class AppModule {}
