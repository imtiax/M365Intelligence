// Deterministic SOC demo data. This is intentionally local synthetic evidence
// for the product demonstration; no Defender, Sentinel, or tenant call occurs
// until a connected deployment is explicitly configured.

export type SocSeverity = "Informational" | "Low" | "Medium" | "High" | "Critical";
export type SocStatus = "New" | "Investigating" | "Contained" | "Resolved";
export type SocAlert = {
  id: string;
  title: string;
  severity: SocSeverity;
  source: string;
  category: string;
  timestamp: string;
  status: SocStatus;
  owner: string;
  incident: string;
  affected: string[];
  mitre: string[];
  description: string;
  recommended: string;
  reportId: string;
};

export type SocInvestigationStep = { id: string; title: string; detail: string; defaultDone: boolean };
export type SocAuditItem = { id: string; at: string; actor: string; action: string; detail: string; kind: "Alert" | "Investigation" | "Response" | "Automation" | "Approval" };
export type SocPlaybook = { id: string; name: string; trigger: string; action: string; integrations: string[]; enabled: boolean };

export const socAlerts: SocAlert[] = [
  { id: "MDA-20481", title: "Potential ransomware activity blocked", severity: "Critical", source: "Defender for Endpoint", category: "Ransomware", timestamp: "2026-07-19 09:42", status: "Investigating", owner: "Endpoint Response", incident: "INC-78421", affected: ["WIN-NSG-4821", "nadia.almasi@sample.invalid"], mitre: ["T1486 Data Encrypted for Impact", "T1489 Service Stop"], description: "Defender prevented rapid file-encryption behaviour and suspended the originating process on a managed Windows device.", recommended: "Validate containment, collect the investigation package, and review lateral-movement evidence before recovery.", reportId: "intune-noncompliant" },
  { id: "MDO-20466", title: "High-confidence phishing message delivered", severity: "High", source: "Defender for Office 365", category: "Phishing", timestamp: "2026-07-19 09:26", status: "New", owner: "Messaging Security", incident: "INC-78418", affected: ["omar.rahman@sample.invalid", "sales@sample.invalid"], mitre: ["T1566 Phishing", "T1204 User Execution"], description: "A credential-harvesting message matched high-confidence phishing intelligence after delivery to two mailboxes.", recommended: "Purge matching messages, block the sender URL, and revoke sessions for users who interacted with the link.", reportId: "exo-permission-audit" },
  { id: "MDI-20459", title: "Suspected credential theft using directory replication", severity: "High", source: "Defender for Identity", category: "Credential access", timestamp: "2026-07-19 08:57", status: "Investigating", owner: "Identity Defense", incident: "INC-78412", affected: ["DC-NSG-01", "svc.sync@sample.invalid"], mitre: ["T1003 OS Credential Dumping", "T1003.006 DCSync"], description: "An account performed replication-like requests inconsistent with its historical role and scheduled activity.", recommended: "Validate the service-account change record, disable compromised credentials if unapproved, and investigate related sign-ins.", reportId: "entra-risky-signins" },
  { id: "MCA-20452", title: "Mass download from confidential SharePoint site", severity: "Medium", source: "Defender for Cloud Apps", category: "Data exfiltration", timestamp: "2026-07-19 08:31", status: "New", owner: "Cloud Security", incident: "INC-78409", affected: ["li.chen@sample.invalid", "Aurora Records"], mitre: ["T1213 Data from Information Repositories", "T1530 Data from Cloud Storage"], description: "Cloud App Security observed an unusual volume of downloads from a confidential site by a user on a newly seen network.", recommended: "Review the file set, validate business purpose, and apply session controls or sharing restrictions where required.", reportId: "spo-audit" },
  { id: "MDE-20437", title: "Malicious PowerShell command blocked", severity: "Medium", source: "Defender for Endpoint", category: "Execution", timestamp: "2026-07-19 07:44", status: "Contained", owner: "Endpoint Response", incident: "INC-78402", affected: ["WIN-NSG-1974", "fatima.haddad@sample.invalid"], mitre: ["T1059.001 PowerShell", "T1105 Ingress Tool Transfer"], description: "A scripted download-and-execute command was blocked by attack surface reduction controls.", recommended: "Confirm device health, scan for persistence, and retain the script telemetry as evidence.", reportId: "intune-devices" },
  { id: "MDO-20418", title: "Suspicious inbox forwarding rule created", severity: "Low", source: "Defender for Office 365", category: "Email collection", timestamp: "2026-07-19 06:13", status: "Resolved", owner: "Messaging Security", incident: "INC-78391", affected: ["finance.ap@sample.invalid"], mitre: ["T1114 Email Collection", "T1098 Account Manipulation"], description: "A rule forwarded messages containing payment terms to an external recipient. The rule was removed after validation.", recommended: "Verify no related rules remain and review mailbox sign-ins around the rule-creation event.", reportId: "exo-forwarding" },
  { id: "MDE-20397", title: "Vulnerability exploitation attempt prevented", severity: "Informational", source: "Defender Vulnerability Management", category: "Vulnerability", timestamp: "2026-07-19 05:22", status: "Resolved", owner: "Vulnerability Management", incident: "INC-78384", affected: ["WIN-NSG-3118"], mitre: ["T1190 Exploit Public-Facing Application"], description: "Endpoint protection blocked an exploit pattern against an application with an available security update.", recommended: "Confirm patch deployment and track the exposure to closure in the vulnerability backlog.", reportId: "intune-noncompliant" },
];

export const socInvestigationSteps: SocInvestigationStep[] = [
  { id: "evidence", title: "Collect device and user evidence", detail: "Gather alert telemetry, sign-in activity, device health, and message or file metadata.", defaultDone: true },
  { id: "activity", title: "Analyse suspicious activities", detail: "Validate process, network, mail, cloud, and identity signals against known-good behaviour.", defaultDone: true },
  { id: "timeline", title: "Review attack timeline", detail: "Correlate detections and events into a sequenced analyst timeline.", defaultDone: false },
  { id: "resources", title: "Check affected resources", detail: "Confirm every user, device, mailbox, app, or site associated with the alert.", defaultDone: false },
  { id: "root-cause", title: "Identify root cause", detail: "Record the entry vector, control gap, and confirmed malicious artefacts.", defaultDone: false },
  { id: "scope", title: "Determine impact scope", detail: "Assess containment, business impact, recovery requirements, and follow-up controls.", defaultDone: false },
];

export const socPlaybooks: SocPlaybook[] = [
  { id: "critical-xdr", name: "Critical Defender XDR escalation", trigger: "Critical Defender XDR alert", action: "Create Sentinel incident, assign SOC L3, notify on-call", integrations: ["Defender XDR", "Microsoft Sentinel", "Teams"], enabled: true },
  { id: "phish-contain", name: "Phishing containment", trigger: "High-confidence phishing", action: "Create ServiceNow case, purge matching mail, request session revocation", integrations: ["Defender for Office 365", "ServiceNow SIR", "Entra ID"], enabled: true },
  { id: "device-contain", name: "Endpoint containment approval", trigger: "High/Critical endpoint alert", action: "Request approver decision, isolate device, collect package", integrations: ["Defender for Endpoint", "Intune", "Microsoft Sentinel"], enabled: true },
  { id: "cloud-data", name: "Cloud data-exposure triage", trigger: "Mass download or anonymous sharing", action: "Create incident, notify data owner, open sharing evidence", integrations: ["Defender for Cloud Apps", "SharePoint", "ServiceNow SIR"], enabled: false },
];

export const socAuditSeed: SocAuditItem[] = [
  { id: "a1", at: "2026-07-19 09:45", actor: "Defender XDR connector", action: "Incident synchronised", detail: "Critical alert MDA-20481 attached to INC-78421.", kind: "Automation" },
  { id: "a2", at: "2026-07-19 09:47", actor: "A. Almasi", action: "Investigation opened", detail: "Endpoint Response accepted ownership of MDA-20481.", kind: "Investigation" },
  { id: "a3", at: "2026-07-19 09:49", actor: "Sentinel playbook", action: "ServiceNow ticket created", detail: "SIR-46891 linked to INC-78421 with Critical priority.", kind: "Automation" },
  { id: "a4", at: "2026-07-19 09:53", actor: "S. Patel", action: "Approval granted", detail: "Device isolation authorised for WIN-NSG-4821.", kind: "Approval" },
];

export const socIntegrations = [
  ["Microsoft Defender XDR", "Connected", "Alert, incident, and investigation sync"],
  ["Microsoft Sentinel", "Connected", "Incident orchestration and automation rules"],
  ["Microsoft Entra ID", "Connected", "Identity response and session controls"],
  ["Microsoft Intune", "Connected", "Device context and containment actions"],
  ["ServiceNow Security Incident Response", "Connected", "Ticketing, approvals, and closure evidence"],
  ["Teams / notification channels", "Connected", "SOC escalation and stakeholder notification"],
] as const;
