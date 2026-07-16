import type { PlatformRole } from "./identity";

const roleModules: Record<PlatformRole, string[]> = {
  "platform-admin": ["*"],
  "security-admin": ["Command center", "Explorer 360", "Security", "Alerts", "Identity", "Automations", "Reporting", "Auditing", "Compliance", "Governance", "AI analyst", "Connection center"],
  "m365-admin": ["Command center", "Explorer 360", "Management", "Automations", "Reporting", "Usage analytics", "Licenses", "Hybrid AD", "Reminders", "AI analyst", "Connection center"],
  "report-admin": ["Command center", "Explorer 360", "Dashboard designer", "Value center", "Reporting", "Custom reports", "Auditing", "Usage analytics", "Licenses", "Report studio"],
  auditor: ["Command center", "Explorer 360", "Security", "Identity", "Reporting", "Auditing", "Compliance", "Governance", "AI analyst"],
  "read-only": ["Command center", "Explorer 360", "Reporting", "Usage analytics", "Compliance", "Licenses"],
};

export function canOpenModule(roles: PlatformRole[], module: string) {
  return roles.some((role) => roleModules[role]?.includes("*") || roleModules[role]?.includes(module));
}

export function canRunChanges(roles: PlatformRole[]) {
  return roles.some((role) => ["platform-admin", "security-admin", "m365-admin"].includes(role));
}
