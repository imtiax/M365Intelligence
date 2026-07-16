import type { ComplianceControl, DemoEntity, DemoTimelineEvent, DemoUser, EnterpriseDemoState, SecurityEvent } from "./enterprise.types";

const departments = ["IT", "Finance", "HR", "Sales", "Operations", "Security", "Legal", "Marketing", "Management"];
const locations = [
  ["Dubai", "United Arab Emirates"], ["London", "United Kingdom"], ["Singapore", "Singapore"],
  ["New York", "United States"], ["Frankfurt", "Germany"], ["Bengaluru", "India"], ["Sydney", "Australia"],
] as const;
const firstNames = ["Ahmed", "Sara", "John", "Maya", "David", "Nadia", "Omar", "Emma", "Liam", "Priya", "Chen", "Fatima", "Daniel", "Aisha", "Noah"];
const lastNames = ["Khan", "Wilson", "Smith", "Patel", "Chen", "Ali", "Rahman", "Brown", "Taylor", "Sharma", "Wang", "Hassan", "Miller", "Ibrahim", "Davis"];
const titles = ["Analyst", "Manager", "Senior Specialist", "Director", "Engineer", "Consultant", "Coordinator", "Vice President"];
const licenseNames = ["Microsoft 365 E5", "Microsoft 365 E3", "Business Premium", "Exchange Online", "Power BI Pro", "Teams Premium"];

function entities(prefix: string, count: number, label: string, statuses = ["Active", "Healthy", "Active"]): DemoEntity[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index + 1).padStart(6, "0")}`,
    name: `${label} ${String(index + 1).padStart(4, "0")}`,
    status: statuses[index % statuses.length],
    owner: `user${String((index % 5000) + 1).padStart(4, "0")}@globalholdings.com`,
    detail: departments[index % departments.length],
  }));
}

function users(now: number): DemoUser[] {
  return Array.from({ length: 5000 }, (_, index) => {
    const number = index + 1;
    const name = `${firstNames[index % firstNames.length]} ${lastNames[(index * 7) % lastNames.length]}`;
    const riskLevel = index < 24 ? "High" : index < 110 ? "Medium" : index < 450 ? "Low" : "None";
    return {
      id: `USR-${String(number).padStart(6, "0")}`,
      displayName: name,
      username: `${firstNames[index % firstNames.length].toLowerCase()}.${lastNames[(index * 7) % lastNames.length].toLowerCase()}${number}@globalholdings.com`,
      department: departments[index % departments.length],
      location: locations[(index * 3) % locations.length][0],
      manager: `Manager ${String((index % 250) + 1).padStart(3, "0")}`,
      jobTitle: `${titles[index % titles.length]} - ${departments[index % departments.length]}`,
      license: licenseNames[index % licenseNames.length],
      accountStatus: index < 4620 ? "Active" : "Inactive",
      riskLevel,
      lastLogin: new Date(now - ((index * 37) % (90 * 24 * 60)) * 60_000).toISOString(),
      mfaStatus: index < 120 ? "Disabled" : "Enabled",
      devices: 1 + (index % 4),
      teams: 3 + (index % 18),
      mailboxGb: 4 + ((index * 13) % 47),
    };
  });
}

function securityEvents(now: number): SecurityEvent[] {
  const primary: SecurityEvent[] = [
    { id: "SEC-000001", title: "Global Admin Login From Unknown Country", severity: "Critical", user: "john.admin@globalholdings.com", location: "Russia", detection: "Impossible Travel Detection", occurredAt: new Date(now - 2 * 60_000).toISOString(), status: "Active" },
    { id: "SEC-000002", title: "Multiple Failed MFA Attempts", severity: "High", user: "finance.manager@globalholdings.com", location: "Dubai", detection: "Identity Protection", occurredAt: new Date(now - 8 * 60_000).toISOString(), status: "Investigating" },
    { id: "SEC-000003", title: "Legacy Authentication Detected", severity: "High", user: "145 affected users", location: "Global", detection: "Sign-in Analytics", occurredAt: new Date(now - 21 * 60_000).toISOString(), status: "Active" },
  ];
  return primary.concat(Array.from({ length: 97 }, (_, index) => ({
    id: `SEC-${String(index + 4).padStart(6, "0")}`,
    title: ["Suspicious inbox rule", "Unmanaged device access", "Anonymous sharing link", "Malware attachment blocked"][index % 4],
    severity: (["High", "Medium", "Low", "Medium"] as const)[index % 4],
    user: `user${String((index * 43) % 5000 + 1).padStart(4, "0")}@globalholdings.com`,
    location: locations[index % locations.length][0],
    detection: ["Defender for Office 365", "Conditional Access", "Defender for Cloud Apps", "Defender XDR"][index % 4],
    occurredAt: new Date(now - (index + 1) * 19 * 60_000).toISOString(),
    status: (["Active", "Investigating", "Resolved"] as const)[index % 3],
  })));
}

function complianceControls(): ComplianceControl[] {
  const frameworks = ["ISO 27001", "NIST", "CIS", "SOC 2"] as const;
  const controls = ["MFA Enforcement", "Privileged Access Review", "External Sharing Governance", "Device Compliance", "Audit Log Retention", "Data Loss Prevention"];
  return frameworks.flatMap((framework, frameworkIndex) => controls.map((control, index) => {
    const score = control === "MFA Enforcement" ? 87 : 78 + ((index * 5 + frameworkIndex * 3) % 21);
    return { id: `${framework.replace(/\W/g, "")}-${index + 1}`, framework, control, score, failed: control === "MFA Enforcement" ? 650 : (index + 1) * 37, status: score >= 90 ? "Compliant" : score >= 80 ? "Partial" : "Failed", recommendation: control === "MFA Enforcement" ? "Enable Conditional Access with phishing-resistant MFA." : `Assign an owner and remediate ${control.toLowerCase()} exceptions.` };
  }));
}

function timeline(now: number): DemoTimelineEvent[] {
  const types = ["login", "risk", "alert", "recommendation", "license", "device"] as const;
  return Array.from({ length: 30 }, (_, index) => ({
    id: `EVT-${String(index + 1).padStart(6, "0")}`,
    occurredAt: new Date(now - index * 2 * 60_000).toISOString(),
    type: types[index % types.length],
    title: ["User sign-in succeeded", "Identity risk detected", "Security alert generated", "AI recommendation created", "License assignment changed", "Device compliance changed"][index % 6],
    detail: `Global enterprise simulation event ${index + 1}`,
    severity: index % 11 === 0 ? "critical" : index % 4 === 0 ? "warning" : "info",
  }));
}

export function createEnterpriseDemo(tenantId: string): EnterpriseDemoState {
  const now = Date.now();
  return {
    tenant: { id: tenantId, name: "Global Enterprise Holdings", industry: "Logistics · Manufacturing · Financial Services", countries: 25, activeScenario: "baseline", lastSimulationAt: new Date(now).toISOString(), kpis: { users: 5000, activeUsers: 4620, inactiveUsers: 380, securityScore: 87, complianceScore: 91, licenseUtilization: 76, storageUsage: 68, highRiskUsers: 24 } },
    departments: departments.map((name, index) => ({ id: `DEP-${index + 1}`, name, status: "Active", detail: `${Math.floor(5000 / departments.length) + (index < 5 ? 1 : 0)} employees` })),
    locations: locations.map(([city, country], index) => ({ id: `LOC-${index + 1}`, name: city, status: "Active", detail: country })),
    users: users(now),
    groups: entities("GRP", 500, "Microsoft 365 Group"),
    teams: entities("TEM", 800, "Team"),
    channels: entities("CHN", 5000, "Channel"),
    sharePointSites: entities("SPO", 300, "SharePoint Site"),
    oneDrives: entities("ODF", 5000, "OneDrive Account"),
    mailboxes: entities("MBX", 5000, "Mailbox"),
    devices: entities("DEV", 7000, "Managed Device", ["Compliant", "Compliant", "Noncompliant"]),
    applications: entities("APP", 300, "Enterprise Application"),
    licenses: [
      { id: "M365-E5", name: "Microsoft 365 E5", assigned: 5000, activeUsage: 3500, unused: 1500, monthlyUnitCost: 57 },
      { id: "M365-E3", name: "Microsoft 365 E3", assigned: 1200, activeUsage: 1035, unused: 165, monthlyUnitCost: 36 },
      { id: "BUS-PREM", name: "Business Premium", assigned: 800, activeUsage: 728, unused: 72, monthlyUnitCost: 22 },
      { id: "EXO", name: "Exchange Online", assigned: 5000, activeUsage: 4620, unused: 380, monthlyUnitCost: 8 },
      { id: "PBI-PRO", name: "Power BI Pro", assigned: 1400, activeUsage: 1018, unused: 382, monthlyUnitCost: 14 },
      { id: "TEAMS-PREM", name: "Teams Premium", assigned: 950, activeUsage: 701, unused: 249, monthlyUnitCost: 10 },
    ],
    securityEvents: securityEvents(now),
    riskFindings: [
      { id: "FND-MFA", title: "MFA disabled users", count: 120, severity: "High", recommendation: "Enable Conditional Access MFA." },
      { id: "FND-PRIV", title: "Inactive privileged accounts", count: 15, severity: "Critical", recommendation: "Disable accounts and remove standing privilege." },
      { id: "FND-ROLE", title: "Unused admin roles", count: 8, severity: "Medium", recommendation: "Remove unused assignments and use PIM." },
      { id: "FND-SHARE", title: "External sharing risks", count: 42, severity: "High", recommendation: "Review anonymous links and guest access." },
    ],
    complianceControls: complianceControls(),
    reportTemplates: [
      ["Security", "MFA Compliance Report"], ["Security", "Risk User Report"], ["Security", "Admin Activity Report"],
      ["Identity", "Inactive Users"], ["Identity", "Guest Users"], ["Identity", "Privileged Users"],
      ["License", "License Usage"], ["License", "Cost Optimization"], ["Compliance", "ISO 27001 Report"], ["Compliance", "CIS Benchmark Report"],
    ].map(([category, name], index) => ({ id: `TPL-${index + 1}`, category, name, description: `${name} generated from the persistent enterprise simulation.` })),
    timeline: timeline(now),
  };
}
