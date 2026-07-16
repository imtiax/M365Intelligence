import { Module } from "@nestjs/common";
import { OperationsModule } from "../operations/operations.module";
import { FindingActionsService } from "./application/finding-actions.service";
import { FindingsRepository } from "./application/findings.repository";
import { InMemoryFindingsRepository } from "./infrastructure/in-memory-findings.repository";
import { FindingsController } from "./presentation/findings.controller";

@Module({
  imports: [OperationsModule],
  controllers: [FindingsController],
  providers: [
    { provide: FindingsRepository, useClass: InMemoryFindingsRepository },
    FindingActionsService,
  ],
  exports: [FindingsRepository],
})
export class FindingsModule {}
