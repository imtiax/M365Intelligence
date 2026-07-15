import { Module } from "@nestjs/common";
import { FindingsModule } from "../findings/findings.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [FindingsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
