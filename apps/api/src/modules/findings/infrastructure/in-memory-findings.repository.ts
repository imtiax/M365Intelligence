import { Injectable } from "@nestjs/common";
import {
  FindingFilter,
  FindingsRepository,
} from "../application/findings.repository";
import type { Finding } from "../domain/finding";

@Injectable()
export class InMemoryFindingsRepository extends FindingsRepository {
  async list(tenantId: string, filter: FindingFilter): Promise<Finding[]> {
    // Findings are created only by a configured tenant collector.
    void tenantId;
    void filter;
    return [];
  }

  async get(tenantId: string, id: string): Promise<Finding | undefined> {
    void tenantId;
    void id;
    return undefined;
  }
}
