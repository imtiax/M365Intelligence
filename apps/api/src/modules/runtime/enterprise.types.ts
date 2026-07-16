export type DemoScenario = "baseline" | "security-breach" | "license-optimization" | "compliance-audit" | "identity-risk" | "executive-cio";

export type DemoUser = {
  id: string;
  displayName: string;
  username: string;
  department: string;
  location: string;
  manager: string;
  jobTitle: string;
  license: string;
  accountStatus: "Active" | "Inactive";
  riskLevel: "High" | "Medium" | "Low" | "None";
  lastLogin: string;
  mfaStatus: "Enabled" | "Disabled";
  devices: number;
  teams: number;
  mailboxGb: number;
};

export type DemoEntity = {
  id: string;
  name: string;
  status: string;
  owner?: string;
  detail?: string;
};

export type SecurityEvent = {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  user: string;
  location: string;
  detection: string;
  occurredAt: string;
  status: "Active" | "Investigating" | "Resolved";
};

export type RiskFinding = {
  id: string;
  title: string;
  count: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  recommendation: string;
};

export type ComplianceControl = {
  id: string;
  framework: "ISO 27001" | "NIST" | "CIS" | "SOC 2";
  control: string;
  score: number;
  failed: number;
  status: "Compliant" | "Partial" | "Failed";
  recommendation: string;
};

export type LicensePlan = {
  id: string;
  name: string;
  assigned: number;
  activeUsage: number;
  unused: number;
  monthlyUnitCost: number;
};

export type DemoTimelineEvent = {
  id: string;
  occurredAt: string;
  type: "login" | "risk" | "alert" | "recommendation" | "license" | "device" | "scenario";
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
};

export type EnterpriseDemoState = {
  tenant: {
    id: string;
    name: string;
    industry: string;
    countries: number;
    activeScenario: DemoScenario;
    lastSimulationAt: string;
    kpis: {
      users: number;
      activeUsers: number;
      inactiveUsers: number;
      securityScore: number;
      complianceScore: number;
      licenseUtilization: number;
      storageUsage: number;
      highRiskUsers: number;
    };
  };
  departments: DemoEntity[];
  locations: DemoEntity[];
  users: DemoUser[];
  groups: DemoEntity[];
  teams: DemoEntity[];
  channels: DemoEntity[];
  sharePointSites: DemoEntity[];
  oneDrives: DemoEntity[];
  mailboxes: DemoEntity[];
  devices: DemoEntity[];
  applications: DemoEntity[];
  licenses: LicensePlan[];
  securityEvents: SecurityEvent[];
  riskFindings: RiskFinding[];
  complianceControls: ComplianceControl[];
  reportTemplates: Array<{ id: string; category: string; name: string; description: string }>;
  timeline: DemoTimelineEvent[];
};
