// Report definitions are bundled; all tenant data is collected locally after approval.
export type CellValue = string | number;
export type Row = Record<string, CellValue>;
export type ColumnType = "text" | "number" | "date" | "badge";
export type Column = { key: string; label: string; type: ColumnType; width?: number };
export type FilterOp = "equals" | "not" | "contains" | "gt" | "lt";
export type Filter = { column: string; op: FilterOp; value: string };
export type SortSpec = { column: string; dir: "asc" | "desc" };
export type QuickFilter = { label: string; filter: Filter };
export type ChartSpec = { kind: "donut"; groupBy: string } | { kind: "bar"; groupBy: string } | { kind: "line"; series: string; keys: string[] } | { kind: "area"; series: string; keys: string[] };
export type Plane = "reports" | "auditing" | "analytics";
export type PortalTables = { users: Row[]; mailboxes: Row[]; teams: Row[]; sites: Row[]; drives: Row[]; devices: Row[]; distributionGroups: Row[]; groupMembers: Row[]; caPolicies: Row[]; auditEvents: Row[]; signIns: Row[] };
export type ReportDef = { id: string; name: string; service: string; plane: Plane; category: string; description: string; source: keyof PortalTables; baseFilters?: Filter[]; columns: string[]; quickFilters?: QuickFilter[]; defaultSort?: SortSpec; chart?: ChartSpec };

export const tables: PortalTables = { users: [], mailboxes: [], teams: [], sites: [], drives: [], devices: [], distributionGroups: [], groupMembers: [], caPolicies: [], auditEvents: [], signIns: [] };
export const analyticsSeries: Record<string, Row[]> = {};
const text = (key: string, label: string): Column => ({ key, label, type: "text" });
const badge = (key: string, label: string): Column => ({ key, label, type: "badge" });
const date = (key: string, label: string): Column => ({ key, label, type: "date" });
const number = (key: string, label: string): Column => ({ key, label, type: "number" });
export const columnCatalog: Record<keyof PortalTables, Column[]> = {
  users: [text("displayName", "Display name"), text("upn", "User principal name"), text("department", "Department"), badge("accountEnabled", "Account status"), badge("mfaStatus", "MFA status"), badge("riskLevel", "Risk level"), text("adminRole", "Admin role"), date("lastSignIn", "Last sign-in")],
  mailboxes: [text("mailbox", "Mailbox"), badge("type", "Type"), text("owner", "Owner"), number("usagePercent", "Usage (%)"), text("forwardingTo", "Forwarding"), badge("status", "Status")],
  teams: [text("teamName", "Team"), text("owner", "Owner"), number("members", "Members"), badge("guestAccess", "Guest access"), date("created", "Created")],
  sites: [text("siteName", "Site"), text("url", "URL"), text("owner", "Owner"), badge("externalSharing", "External sharing"), number("storageUsedGb", "Storage (GB)")],
  drives: [text("owner", "Owner"), text("upn", "User principal name"), number("storageUsedGb", "Storage (GB)"), badge("externalSharing", "External sharing"), date("lastActivity", "Last activity")],
  devices: [text("deviceName", "Device"), text("owner", "Owner"), text("os", "OS"), badge("compliance", "Compliance"), badge("encrypted", "Encrypted"), date("lastCheckIn", "Last check-in")],
  distributionGroups: [text("groupName", "Group"), text("email", "Email"), text("owner", "Owner"), number("members", "Members"), badge("type", "Type")],
  groupMembers: [text("groupName", "Group"), text("member", "Member"), text("upn", "User principal name"), badge("role", "Role"), date("added", "Added")],
  caPolicies: [text("policyName", "Policy"), badge("state", "State"), text("includedUsers", "Included users"), text("controls", "Controls"), date("modified", "Modified")],
  auditEvents: [date("time", "Time"), text("service", "Service"), text("operation", "Operation"), text("actor", "Actor"), text("target", "Target"), badge("result", "Result"), text("ipAddress", "IP address")],
  signIns: [date("time", "Time"), text("user", "User"), text("upn", "User principal name"), text("application", "Application"), badge("status", "Status"), badge("riskLevel", "Risk level"), text("location", "Location")],
};
const r = (value: ReportDef) => value;
export const reportCatalog: ReportDef[] = [
  r({ id: "entra-all-users", name: "All Users", service: "Entra ID", plane: "reports", category: "Identity", description: "Directory users from the connected tenant.", source: "users", columns: ["displayName", "upn", "department", "accountEnabled", "mfaStatus", "riskLevel", "lastSignIn"] }),
  r({ id: "entra-signins", name: "Sign-in Activity", service: "Entra ID", plane: "auditing", category: "Sign-in Audit", description: "Tenant sign-in events from the approved source.", source: "signIns", columns: ["time", "user", "upn", "application", "status", "riskLevel", "location"] }),
  r({ id: "exchange-mailboxes", name: "All Mailboxes", service: "Exchange Online", plane: "reports", category: "Mailbox", description: "Mailbox inventory and capacity from Exchange Online.", source: "mailboxes", columns: ["mailbox", "type", "owner", "usagePercent", "forwardingTo", "status"] }),
  r({ id: "exchange-audit", name: "Exchange Administrator Activity", service: "Exchange Online", plane: "auditing", category: "Administrator Audit", description: "Exchange changes in the audit pipeline.", source: "auditEvents", columns: ["time", "operation", "actor", "target", "result", "ipAddress"] }),
  r({ id: "teams-inventory", name: "Teams Inventory", service: "Microsoft Teams", plane: "reports", category: "Teams", description: "Teams ownership, membership, and guest access.", source: "teams", columns: ["teamName", "owner", "members", "guestAccess", "created"] }),
  r({ id: "sharepoint-sites", name: "SharePoint Sites", service: "SharePoint Online", plane: "reports", category: "Sites", description: "Site governance and external-sharing posture.", source: "sites", columns: ["siteName", "url", "owner", "externalSharing", "storageUsedGb"] }),
  r({ id: "onedrive-usage", name: "OneDrive Usage", service: "OneDrive", plane: "reports", category: "Storage", description: "OneDrive ownership, activity, and sharing posture.", source: "drives", columns: ["owner", "upn", "storageUsedGb", "externalSharing", "lastActivity"] }),
  r({ id: "intune-devices", name: "Managed Devices", service: "Intune & Devices", plane: "reports", category: "Endpoint", description: "Intune device inventory and compliance results.", source: "devices", columns: ["deviceName", "owner", "os", "compliance", "encrypted", "lastCheckIn"] }),
  r({ id: "intune-audit", name: "Intune Administrator Activity", service: "Intune & Devices", plane: "auditing", category: "Administrator Audit", description: "Endpoint changes in the audit pipeline.", source: "auditEvents", columns: ["time", "operation", "actor", "target", "result", "ipAddress"] }),
  r({ id: "security-audit", name: "Unified Audit Search", service: "Security & Compliance", plane: "auditing", category: "Governance", description: "Cross-workload administrator audit evidence.", source: "auditEvents", columns: ["time", "service", "operation", "actor", "target", "result", "ipAddress"] }),
  r({ id: "security-conditional-access", name: "Conditional Access Policies", service: "Security & Compliance", plane: "reports", category: "Identity Protection", description: "Conditional Access from the connected tenant.", source: "caPolicies", columns: ["policyName", "state", "includedUsers", "controls", "modified"] }),
];
export const SERVICES = ["Entra ID", "Exchange Online", "Microsoft Teams", "SharePoint Online", "OneDrive", "Intune & Devices", "Security & Compliance"] as const;
export const PLANE_LABEL: Record<Plane, string> = { reports: "Statistical Reports", auditing: "Audit Reports", analytics: "Analytics" };
export type DashboardTile = { label: string; value: number; detail: string; reportId: string; tone: "indigo" | "teal" | "amber" | "rose" };
export const dashboardTiles: DashboardTile[] = [
  { label: "Users", value: 0, detail: "Awaiting tenant connection", reportId: "entra-all-users", tone: "indigo" },
  { label: "Mailboxes", value: 0, detail: "Awaiting tenant connection", reportId: "exchange-mailboxes", tone: "teal" },
  { label: "Managed devices", value: 0, detail: "Awaiting tenant connection", reportId: "intune-devices", tone: "amber" },
  { label: "Audit events", value: 0, detail: "Awaiting tenant connection", reportId: "security-audit", tone: "rose" },
];
export type PortalView = { id: string; name: string; reportId: string; columns: string[]; filters: Filter[]; sort: SortSpec[]; createdAt: string };
export type ScheduleRun = { at: string; rows: number; outcome: "delivered" | "suppressed" };
export type PortalSchedule = { id: string; name: string; reportId: string; frequency: string; time: string; recipients: string; format: string; suppressEmpty: boolean; status: "Active" | "Paused"; columns: string[]; filters: Filter[]; sort: SortSpec[]; runs: ScheduleRun[]; createdAt: string };
export type PortalAlert = { id: string; name: string; reportId: string; mode: "Threshold" | "Trend comparison"; operator: "above" | "below"; threshold: number; trendPercent: number; status: "Open" | "Investigating" | "Closed"; firedLast30d: number; filters: Filter[]; lastEvaluatedAt?: string; lastValue?: number; lastOutcome?: "Fired" | "Normal"; createdAt: string };
export const seedViews: PortalView[] = [];
export const seedSchedules: PortalSchedule[] = [];
export const seedAlerts: PortalAlert[] = [];
