import { Module } from "@nestjs/common";
import { FindingsRepository } from "./application/findings.repository";
import { InMemoryFindingsRepository } from "./infrastructure/in-memory-findings.repository";
import { FindingsController } from "./presentation/findings.controller";

@Module({
  controllers: [FindingsController],
  providers: [
    { provide: FindingsRepository, useClass: InMemoryFindingsRepository },
  ],
  exports: [FindingsRepository],
})
export class FindingsModule {}
