// Deterministic local evidence for the Administrator Audit & Governance demo.
// A connected deployment maps these fields to Purview Audit, Graph, Defender
// XDR, Sentinel, Exchange Online, and ServiceNow records.

export type AdminRisk = "Low" | "Medium" | "High" | "Critical";
export type AdminResult = "Success" | "Failed";
export type AdminGovernance = "Recorded" | "Approval required" | "Approved" | "Rejected";
export type AdminActivity = {
  id: string;
  timestamp: string;
  administrator: string;
  service: string;
  center: string;
  action: string;
  category: string;
  target: string;
  previous: string;
  current: string;
  ip: string;
  location: string;
  result: AdminResult;
  risk: AdminRisk;
  governance: AdminGovernance;
  reason: string;
  reportId: string;
};

export type GovernanceAudit = { id: string; at: string; actor: string; event: string; detail: string; type: "Audit" | "Approval" | "Detection" | "Report" };

export const adminActivities: AdminActivity[] = [
  { id: "ADM-30291", timestamp: "2026-07-19 10:12", administrator: "nadia.almasi@northstar.example", service: "Exchange Online", center: "Exchange Admin Center", action: "Added Full Access permission", category: "Mailbox permissions", target: "finance.ap@northstar.example", previous: "None", current: "nadia.almasi@northstar.example", ip: "20.81.19.42", location: "Dubai, AE", result: "Success", risk: "High", governance: "Approval required", reason: "Temporary AP coverage", reportId: "exo-permission-audit" },
  { id: "ADM-30290", timestamp: "2026-07-19 10:04", administrator: "omar.rahman@northstar.example", service: "Microsoft Entra ID", center: "Entra Admin Center", action: "Assigned Global Administrator", category: "Privileged role", target: "svc.sync@northstar.example", previous: "No directory role", current: "Global Administrator", ip: "20.81.19.42", location: "Dubai, AE", result: "Success", risk: "Critical", governance: "Approval required", reason: "Emergency connector recovery", reportId: "entra-admins" },
  { id: "ADM-30289", timestamp: "2026-07-19 09:51", administrator: "li.chen@northstar.example", service: "Microsoft Defender", center: "Defender Portal", action: "Isolated device", category: "Incident response", target: "WIN-NSG-4821", previous: "Network connected", current: "Device isolated", ip: "20.81.19.42", location: "Dubai, AE", result: "Success", risk: "High", governance: "Approved", reason: "Critical ransomware investigation INC-78421", reportId: "intune-devices" },
  { id: "ADM-30288", timestamp: "2026-07-19 09:38", administrator: "sana.patel@northstar.example", service: "Microsoft Intune", center: "Intune Admin Center", action: "Updated endpoint security policy", category: "Endpoint security", target: "Windows ASR Baseline", previous: "Block mode: Audit", current: "Block mode: Enabled", ip: "52.164.82.14", location: "London, GB", result: "Success", risk: "High", governance: "Approved", reason: "CAB-2026-119 security baseline change", reportId: "intune-noncompliant" },
  { id: "ADM-30287", timestamp: "2026-07-19 09:16", administrator: "fatima.haddad@northstar.example", service: "SharePoint Online", center: "SharePoint Admin Center", action: "Changed external sharing policy", category: "Sharing configuration", target: "Aurora Records", previous: "Existing guests", current: "Anyone", ip: "34.248.122.18", location: "Dublin, IE", result: "Success", risk: "High", governance: "Approval required", reason: "Vendor data-room access", reportId: "spo-external" },
  { id: "ADM-30286", timestamp: "2026-07-19 08:59", administrator: "robert.santos@northstar.example", service: "Microsoft Teams", center: "Teams Admin Center", action: "Updated guest access configuration", category: "Teams policy", target: "Global (Org-wide default)", previous: "Guests can create channels", current: "Guests cannot create channels", ip: "20.81.19.42", location: "Dubai, AE", result: "Success", risk: "Medium", governance: "Recorded", reason: "Quarterly collaboration hardening", reportId: "teams-audit" },
  { id: "ADM-30285", timestamp: "2026-07-19 08:42", administrator: "maria.admin@partner-ext.example", service: "Microsoft Purview", center: "Purview Compliance Portal", action: "Modified retention policy", category: "Retention and records", target: "Finance Retention - 7 years", previous: "Retain 7 years", current: "Retain 3 years", ip: "185.219.78.41", location: "Berlin, DE", result: "Failed", risk: "Critical", governance: "Approval required", reason: "No approved change reference", reportId: "sec-audit-search" },
  { id: "ADM-30284", timestamp: "2026-07-19 08:29", administrator: "omar.rahman@northstar.example", service: "Microsoft Entra ID", center: "Entra Admin Center", action: "Updated Conditional Access policy", category: "Conditional Access", target: "Require MFA - Admins", previous: "Enabled for all directory roles", current: "Excluded 4 users", ip: "185.219.78.41", location: "Berlin, DE", result: "Success", risk: "Critical", governance: "Approval required", reason: "No approved change reference", reportId: "entra-ca-policies" },
  { id: "ADM-30283", timestamp: "2026-07-19 08:14", administrator: "li.chen@northstar.example", service: "Microsoft 365", center: "Microsoft 365 Admin Center", action: "Reset user password", category: "Identity lifecycle", target: "samuel.osei@northstar.example", previous: "Existing password", current: "Password reset required", ip: "20.81.19.42", location: "Dubai, AE", result: "Success", risk: "Medium", governance: "Recorded", reason: "Service desk request SD-100384", reportId: "entra-user-mgmt-audit" },
  { id: "ADM-30282", timestamp: "2026-07-19 07:47", administrator: "sana.patel@northstar.example", service: "Azure Portal", center: "Azure Portal", action: "Granted enterprise application consent", category: "Application permissions", target: "Payroll Insights Connector", previous: "No tenant-wide consent", current: "Files.Read.All, User.Read.All", ip: "52.164.82.14", location: "London, GB", result: "Success", risk: "High", governance: "Approval required", reason: "Payroll integration deployment", reportId: "sec-audit-search" },
  { id: "ADM-30281", timestamp: "2026-07-19 07:21", administrator: "robert.santos@northstar.example", service: "Exchange Online", center: "Exchange Admin Center", action: "Created transport rule", category: "Mail flow", target: "Block high-risk attachment types", previous: "Not configured", current: "Active; reject executable attachments", ip: "20.81.19.42", location: "Dubai, AE", result: "Success", risk: "High", governance: "Approved", reason: "CHG-44791 emergency mail-flow protection", reportId: "exo-permission-audit" },
  { id: "ADM-30280", timestamp: "2026-07-19 06:56", administrator: "fatima.haddad@northstar.example", service: "Security & Compliance", center: "Security & Compliance Center", action: "Updated DLP policy", category: "Data protection", target: "PCI data in email", previous: "Test with notifications", current: "Block with user override", ip: "20.81.19.42", location: "Dubai, AE", result: "Success", risk: "High", governance: "Approved", reason: "CAB-2026-116 DLP enforcement", reportId: "sec-audit-search" },
];

export const governanceAuditSeed: GovernanceAudit[] = [
  { id: "g1", at: "2026-07-19 10:13", actor: "Purview Audit connector", event: "Administrative event ingested", detail: "ADM-30291 normalised from Exchange Admin Center and retained as evidence.", type: "Audit" },
  { id: "g2", at: "2026-07-19 10:05", actor: "Sentinel analytics", event: "Suspicious admin behaviour detected", detail: "Privileged role change and Conditional Access modification originated from new locations within 35 minutes.", type: "Detection" },
  { id: "g3", at: "2026-07-19 09:52", actor: "S. Patel", event: "Emergency response approved", detail: "Device isolation on WIN-NSG-4821 approved under INC-78421.", type: "Approval" },
  { id: "g4", at: "2026-07-19 09:40", actor: "Compliance reporting service", event: "Daily admin activity report generated", detail: "Evidence package delivered to Security Governance with failed and high-risk changes highlighted.", type: "Report" },
];

export const auditIntegrations = [
  ["Microsoft Purview Audit", "Connected", "Unified administrator activity ingestion"],
  ["Microsoft Sentinel", "Connected", "Correlation rules and suspicious-behaviour analytics"],
  ["Microsoft Defender XDR", "Connected", "Incident response and security-action evidence"],
  ["Microsoft Graph API", "Connected", "Directory, Intune, Teams, and service configuration context"],
  ["Exchange Online PowerShell", "Connected", "Mailbox, permission, and transport-change enrichment"],
  ["ServiceNow Security Incident Response", "Connected", "Approval, ticket, and compliance evidence workflow"],
] as const;
