import { NotFoundException } from "@nestjs/common";
import { CommercialService } from "./commercial.service";
import { DEMO_TENANT, LocalStateService } from "../runtime/local-state.service";

describe("CommercialService", () => {
  const runtime = { appendAudit: jest.fn(), publish: jest.fn() } as unknown as LocalStateService;
  const service = new CommercialService(runtime);

  beforeEach(() => jest.clearAllMocks());

  it("returns commercial metadata only for the active organization tenant", () => {
    expect(service.organization(DEMO_TENANT).displayName).toBe("Global Enterprise Holdings");
    expect(() => service.organization("00000000-0000-4000-8000-000000000099")).toThrow(NotFoundException);
  });

  it("binds the evaluation license to one tenant and one instance", () => {
    const license = service.license(DEMO_TENANT);
    expect(license.boundTenantId).toBe(DEMO_TENANT);
    expect(license.maxInstances).toBe(1);
    expect(license.cryptographicEnforcement).toBe("not-enabled-in-evaluation");
  });

  it("audits connector validation without returning secret material", () => {
    const result = service.validateConnector(DEMO_TENANT, "entra", "admin@example.test", "correlation-id");
    expect(result.validation).toBe("passed");
    expect(runtime.appendAudit).toHaveBeenCalledWith(DEMO_TENANT, "admin@example.test", "connector.validate", "connector", "entra", "success", "correlation-id");
    expect(JSON.stringify(result)).not.toMatch(/clientSecret|accessToken|privateKey/i);
  });
});
