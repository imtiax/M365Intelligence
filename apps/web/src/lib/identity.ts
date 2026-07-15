export type PlatformRole =
  | "platform-admin"
  | "security-admin"
  | "m365-admin"
  | "auditor"
  | "report-admin"
  | "read-only";

export type LocalIdentity = {
  username: string;
  name: string;
  title: string;
  tenantId: string;
  roles: PlatformRole[];
  salt: string;
  passwordHash: string;
};

export type PublicIdentity = Omit<LocalIdentity, "salt" | "passwordHash">;

export const roleLabels: Record<PlatformRole, string> = {
  "platform-admin": "Platform Administrator",
  "security-admin": "Security Administrator",
  "m365-admin": "Microsoft 365 Administrator",
  auditor: "Compliance Auditor",
  "report-admin": "Reporting Administrator",
  "read-only": "Read-only Analyst",
};
