// Deterministic synthetic tenant dataset and report catalogue for the
// Reporter 360 portal (/portal). Client-side demo data only.

export type CellValue = string | number;
export type Row = Record<string, CellValue>;
export type ColumnType = "text" | "number" | "date" | "badge";
export type Column = { key: string; label: string; type: ColumnType; width?: number };

export type FilterOp = "equals" | "not" | "contains" | "gt" | "lt";
export type Filter = { column: string; op: FilterOp; value: string };
export type SortSpec = { column: string; dir: "asc" | "desc" };

export type QuickFilter = { label: string; filter: Filter };
export type ChartSpec =
  | { kind: "donut"; groupBy: string }
  | { kind: "bar"; groupBy: string }
  | { kind: "line"; series: string; keys: string[] }
  | { kind: "area"; series: string; keys: string[] };

export type Plane = "reports" | "auditing" | "analytics";
export type ReportDef = {
  id: string;
  name: string;
  service: string;
  plane: Plane;
  category: string;
  description: string;
  source: keyof PortalTables;
  baseFilters?: Filter[];
  columns: string[];
  quickFilters?: QuickFilter[];
  defaultSort?: SortSpec;
  chart?: ChartSpec;
};

// ---------------------------------------------------------------- RNG helpers

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260719);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const chance = (p: number) => rand() < p;

const NOW = new Date("2026-07-19T10:00:00Z").getTime();
const DAY = 86_400_000;
const daysAgoDate = (days: number) => new Date(NOW - days * DAY).toISOString().slice(0, 10);
const recentTimestamp = (maxDays: number) => {
  const t = new Date(NOW - rand() * maxDays * DAY);
  return `${t.toISOString().slice(0, 10)} ${t.toISOString().slice(11, 16)}`;
};

// ---------------------------------------------------------------- entity pools

const FIRST = ["Nadia","Robert","Li","Amira","James","Sofia","Omar","Elena","David","Fatima","Marcus","Yuki","Priya","Carlos","Ingrid","Tariq","Hannah","Viktor","Leila","Samuel","Aisha","Diego","Mei","Lucas","Zara","Ahmed","Clara","Rafael","Nina","Khalid","Erik","Maya","Jonas","Layla","Andre","Sana","Felix","Dana","Hugo","Rania"];
const LAST = ["Almasi","Santos","Chen","Malik","Wilson","Rossi","Haddad","Petrova","Okafor","Rahman","Weber","Tanaka","Sharma","Alvarez","Larsen","Aziz","Novak","Ivanov","Karimi","Osei","Begum","Torres","Lin","Moreau","Khalil","Saleh","Dubois","Costa","Kovacs","Nasser","Berg","Patel","Vogel","Hassan","Silva","Iqbal","Braun","Farah","Meyer","Amin"];
const DEPARTMENTS = ["Corporate Banking","Retail Banking","Technology","Operations","Risk & Compliance","Finance","Human Resources","Legal","Marketing","Private Banking","Treasury","Facilities"];
const TITLES = ["Analyst","Senior Analyst","Manager","Director","Specialist","Coordinator","Engineer","Consultant","Team Lead","Officer"];
const COUNTRIES = ["United Arab Emirates","United Kingdom","Germany","Singapore","United States","India","Brazil","Japan"];
const SKUS = ["Microsoft 365 E5","Microsoft 365 E3","Office 365 E1","Power BI Pro","Visio Plan 2","Project Plan 3","Teams Premium"];
const ADMIN_ROLES = ["Global Administrator","User Administrator","Exchange Administrator","SharePoint Administrator","Security Administrator","Helpdesk Administrator","Teams Administrator"];
const MFA_METHODS = ["Microsoft Authenticator","FIDO2 security key","Phone (SMS)","Windows Hello"];
const APPS = ["Outlook Web","Microsoft Teams","SharePoint Online","Azure Portal","Exchange ActiveSync","Power BI","OneDrive Sync","Microsoft 365 Portal"];
const FAILURE_REASONS = ["Invalid password","MFA denied","Conditional Access blocked","Account locked","Legacy protocol blocked","Session expired"];
const CITIES = ["Dubai","London","Berlin","Singapore","New York","Mumbai","São Paulo","Tokyo","Riga","Lagos"];
const CA_POLICIES = ["Require MFA - All users","Block legacy authentication","Require compliant device - Finance","Require MFA - Admins","Block high-risk sign-ins"];

// ---------------------------------------------------------------- users

export type PortalTables = {
  users: Row[];
  mailboxes: Row[];
  teams: Row[];
  sites: Row[];
  drives: Row[];
  devices: Row[];
  distributionGroups: Row[];
  groupMembers: Row[];
  caPolicies: Row[];
  auditEvents: Row[];
  signIns: Row[];
};

const users: Row[] = [];
const usedNames = new Set<string>();
for (let i = 0; i < 420; i++) {
  let first = pick(FIRST); let last = pick(LAST);
  let attempts = 0;
  while (usedNames.has(`${first}.${last}`) && attempts++ < 30) { first = pick(FIRST); last = pick(LAST); }
  usedNames.add(`${first}.${last}`);
  const guest = chance(0.09);
  const upn = guest
    ? `${first.toLowerCase()}.${last.toLowerCase()}_partner#EXT#@sample.invalid`
    : `${first.toLowerCase()}.${last.toLowerCase()}@sample.invalid`;
  const licensed = !guest && chance(0.86);
  const skus = licensed ? [pick(SKUS.slice(0, 3)), ...(chance(0.3) ? [pick(SKUS.slice(3))] : [])] : [];
  const admin = !guest && chance(0.055);
  const mfa = guest ? (chance(0.5) ? "Enabled" : "Disabled") : chance(0.78) ? (chance(0.6) ? "Enforced" : "Enabled") : "Disabled";
  const lastSignInDays = chance(0.16) ? int(45, 320) : int(0, 30);
  const risk = chance(0.05) ? "High" : chance(0.09) ? "Medium" : chance(0.12) ? "Low" : "None";
  users.push({
    displayName: `${first} ${last}`,
    upn,
    department: guest ? "External" : pick(DEPARTMENTS),
    jobTitle: guest ? "Guest" : `${pick(TITLES)}`,
    country: pick(COUNTRIES),
    userType: guest ? "Guest" : "Member",
    accountEnabled: chance(0.96) ? "Enabled" : "Disabled",
    licensed: licensed ? "Licensed" : "Unlicensed",
    licenses: skus.join(" + ") || "—",
    adminRole: admin ? pick(ADMIN_ROLES) : "—",
    mfaStatus: mfa,
    mfaMethod: mfa === "Disabled" ? "—" : pick(MFA_METHODS),
    lastSignIn: daysAgoDate(lastSignInDays),
    inactiveDays: lastSignInDays,
    signIns30d: lastSignInDays > 30 ? 0 : int(4, 160),
    riskLevel: risk,
    legacyAuth: chance(0.07) ? "Yes" : "No",
    passwordNeverExpires: chance(0.1) ? "Yes" : "No",
    createdDate: daysAgoDate(int(30, 1600)),
  });
}

// ---------------------------------------------------------------- mailboxes

const mailboxes: Row[] = users
  .filter((u) => u.userType === "Member" && u.licensed === "Licensed")
  .map((u) => {
    const quota = pick([50, 50, 100]);
    const size = Math.round(rand() * quota * 0.92 * 10) / 10;
    return {
      displayName: u.displayName,
      upn: u.upn,
      mailboxType: "User",
      sizeGB: size,
      quotaGB: quota,
      usagePercent: Math.round((size / quota) * 100),
      itemCount: int(2_000, 240_000),
      lastActivity: u.lastSignIn,
      inactiveDays: u.inactiveDays,
      forwardingTo: chance(0.06) ? `${pick(["archive","backup","assistant"])}@${chance(0.4) ? "outside-partner.example" : "sample.invalid"}` : "—",
      fullAccessDelegates: chance(0.12) ? int(1, 4) : 0,
      archiveEnabled: chance(0.4) ? "Yes" : "No",
      holdStatus: chance(0.18) ? "Litigation hold" : "None",
    };
  });
for (let i = 0; i < 24; i++) {
  const quota = 50;
  const size = Math.round(rand() * 30 * 10) / 10;
  mailboxes.push({
    displayName: `${pick(["Support","Invoices","Careers","Info","Press","Facilities","Ops","Sales"])} ${pick(["Desk","Team","Inbox","Group"])} ${i + 1}`,
    upn: `shared.${i + 1}@sample.invalid`,
    mailboxType: chance(0.7) ? "Shared" : "Room",
    sizeGB: size, quotaGB: quota, usagePercent: Math.round((size / quota) * 100),
    itemCount: int(500, 80_000),
    lastActivity: daysAgoDate(int(0, 120)),
    inactiveDays: int(0, 120),
    forwardingTo: "—", fullAccessDelegates: int(1, 6),
    archiveEnabled: "No", holdStatus: "None",
  });
}

// ---------------------------------------------------------------- teams / sites / drives / devices

const TEAM_WORDS = ["Falcon","Atlas","Horizon","Quantum","Aurora","Summit","Pioneer","Vertex","Nimbus","Compass","Beacon","Cedar","Orion","Delta","Harbor"];
const teams: Row[] = [];
for (let i = 0; i < 64; i++) {
  const owners = chance(0.08) ? 0 : int(1, 3);
  const members = int(4, 120);
  const inactive = chance(0.18);
  teams.push({
    teamName: `${pick(TEAM_WORDS)} ${pick(["Project","Program","Squad","Initiative","Workstream","Chapter"])}`,
    privacy: chance(0.72) ? "Private" : "Public",
    owners, members,
    guests: chance(0.3) ? int(1, 9) : 0,
    channels: int(2, 24),
    messages30d: inactive ? 0 : int(40, 9_000),
    meetings30d: inactive ? 0 : int(2, 160),
    lastActivity: inactive ? daysAgoDate(int(60, 300)) : daysAgoDate(int(0, 14)),
    archived: chance(0.06) ? "Yes" : "No",
    createdDate: daysAgoDate(int(60, 1400)),
  });
}

const sites: Row[] = [];
for (let i = 0; i < 84; i++) {
  const external = chance(0.27);
  const quota = pick([1024, 2048, 5120]);
  const storage = Math.round(rand() * quota * 0.7);
  sites.push({
    siteName: `${pick(TEAM_WORDS)} ${pick(["Workspace","Hub","Portal","Records","Archive","Library"])}`,
    url: `/sites/${pick(TEAM_WORDS).toLowerCase()}-${i + 1}`,
    owner: String(pick(users.filter((u) => u.userType === "Member")).displayName),
    template: chance(0.6) ? "Team site" : "Communication site",
    storageGB: storage, quotaGB: quota,
    files: int(200, 90_000),
    externalSharing: external ? "Enabled" : "Disabled",
    anyoneLinks: external && chance(0.4) ? int(1, 26) : 0,
    guestUsers: external ? int(0, 18) : 0,
    sensitivityLabel: pick(["General","General","Confidential","Highly Confidential","Public"]),
    lastActivity: chance(0.15) ? daysAgoDate(int(90, 400)) : daysAgoDate(int(0, 21)),
  });
}

const drives: Row[] = users
  .filter((u) => u.userType === "Member" && u.licensed === "Licensed" && chance(0.9))
  .map((u) => {
    const externalLinks = chance(0.18) ? int(1, 40) : 0;
    const anyoneLinks = chance(0.06) ? int(1, 8) : 0;
    return {
      owner: u.displayName,
      upn: u.upn,
      storageGB: Math.round(rand() * 512 * 10) / 10,
      quotaGB: 1024,
      files: int(100, 42_000),
      sharedFiles: int(0, 900),
      externalLinks,
      anyoneLinks,
      sharingState: anyoneLinks > 0 ? "Anyone links" : externalLinks > 0 ? "External" : "Internal only",
      lastActivity: u.lastSignIn,
      inactiveDays: u.inactiveDays,
    };
  });

const devices: Row[] = [];
for (const u of users.filter((x) => x.userType === "Member" && chance(0.72))) {
  const os = pick(["Windows","Windows","Windows","macOS","iOS","Android"]);
  const compliant = chance(0.84);
  const lastDays = chance(0.12) ? int(45, 200) : int(0, 14);
  devices.push({
    deviceName: `${os === "Windows" ? "WIN" : os === "macOS" ? "MAC" : os.toUpperCase()}-NSG-${int(1000, 9999)}`,
    owner: u.displayName,
    upn: u.upn,
    os,
    osVersion: os === "Windows" ? pick(["11 23H2","11 24H2","10 22H2"]) : os === "macOS" ? pick(["14.5","15.1"]) : pick(["17.5","18.2","14"]),
    compliance: compliant ? "Compliant" : chance(0.5) ? "Non-compliant" : "In grace period",
    complianceIssue: compliant ? "—" : pick(["Encryption disabled","OS below minimum","Defender inactive","Password policy"]),
    encrypted: compliant || chance(0.5) ? "Yes" : "No",
    managedBy: "Intune",
    lastCheckIn: daysAgoDate(lastDays),
    staleDays: lastDays,
    enrolledDate: daysAgoDate(int(20, 900)),
  });
}

const distributionGroups: Row[] = [];
for (let i = 0; i < 40; i++) {
  distributionGroups.push({
    groupName: `DL - ${pick(DEPARTMENTS)} ${pick(["All","Leads","Announcements","Region","Core"])}`,
    email: `dl.${i + 1}@sample.invalid`,
    members: chance(0.1) ? 0 : int(3, 400),
    managedBy: String(pick(users).displayName),
    externalSenders: chance(0.2) ? "Allowed" : "Blocked",
    createdDate: daysAgoDate(int(100, 1500)),
  });
}

// Membership is modeled as a separate evidence table so administrators can
// report on individual owners and members, rather than only group counts.
const groupMembers: Row[] = [];
for (const team of teams) {
  const total = Math.min(Number(team.members), 18);
  const ownerCount = Math.min(Number(team.owners), total);
  for (let index = 0; index < total; index++) {
    const user = users[(groupMembers.length * 17 + index * 13) % users.length];
    groupMembers.push({
      groupName: team.teamName,
      groupEmail: `${String(team.teamName).toLowerCase().replaceAll(/[^a-z0-9]+/g, ".").replaceAll(/^\.|\.$/g, "")}@sample.invalid`,
      groupType: "Microsoft 365 group",
      memberName: user.displayName,
      memberUpn: user.upn,
      memberType: user.userType,
      membershipRole: index < ownerCount ? "Owner" : "Member",
      department: user.department,
      accountEnabled: user.accountEnabled,
      lastSignIn: user.lastSignIn,
      addedDate: daysAgoDate(int(8, 950)),
    });
  }
}
for (const group of distributionGroups) {
  const total = Math.min(Number(group.members), 16);
  for (let index = 0; index < total; index++) {
    const user = users[(groupMembers.length * 11 + index * 19) % users.length];
    groupMembers.push({
      groupName: group.groupName,
      groupEmail: group.email,
      groupType: "Distribution group",
      memberName: user.displayName,
      memberUpn: user.upn,
      memberType: user.userType,
      membershipRole: index === 0 ? "Owner" : "Member",
      department: user.department,
      accountEnabled: user.accountEnabled,
      lastSignIn: user.lastSignIn,
      addedDate: daysAgoDate(int(8, 950)),
    });
  }
}

const caPolicies: Row[] = CA_POLICIES.map((name, i) => ({
  policyName: name,
  state: i === 4 ? "Report-only" : "Enabled",
  includedUsers: i === 3 ? "Directory roles" : "All users",
  excludedUsers: int(0, 6),
  controls: name.startsWith("Block") ? "Block access" : "Require MFA",
  appliedLast30d: int(400, 52_000),
  failuresLast30d: int(5, 900),
  modifiedDate: daysAgoDate(int(10, 200)),
}));

// ---------------------------------------------------------------- events

const AUDIT_OPS: Record<string, string[]> = {
  "Entra ID": ["Add user","Delete user","Update user","Reset password","Add member to role","Remove member from role","Add member to group","Remove member from group","Update conditional access policy","Consent to application"],
  "Exchange Online": ["Add mailbox permission","Remove mailbox permission","Set mailbox forwarding","New inbox rule","Update transport rule","Mailbox non-owner access"],
  "Microsoft Teams": ["Team created","Team deleted","Member added","Member removed","Channel added","App installed"],
  "SharePoint Online": ["Sharing invitation created","Anonymous link created","File accessed","File downloaded","Permission level modified","Site collection admin added"],
  OneDrive: ["File shared externally","Anonymous link created","File downloaded","File deleted","Sync blocked"],
  Intune: ["Device enrolled","Device retired","Compliance policy changed","Configuration profile assigned","Device wiped"],
  Security: ["Risky sign-in detected","Risk dismissed","User flagged for risk","Alert triggered","Alert resolved"],
};

const auditEvents: Row[] = [];
for (let i = 0; i < 640; i++) {
  const service = pick(Object.keys(AUDIT_OPS));
  const actor = pick(users);
  auditEvents.push({
    time: recentTimestamp(30),
    service,
    operation: pick(AUDIT_OPS[service]),
    actor: String(actor.displayName),
    actorUpn: String(actor.upn),
    target: chance(0.5) ? String(pick(users).upn) : pick([...teams.map((t) => String(t.teamName)), ...sites.map((s) => String(s.siteName))]),
    result: chance(0.94) ? "Success" : "Failed",
    ipAddress: `20.${int(10, 250)}.${int(0, 255)}.${int(1, 254)}`,
    location: pick(CITIES),
  });
}
auditEvents.sort((a, b) => String(b.time).localeCompare(String(a.time)));

const signIns: Row[] = [];
for (let i = 0; i < 900; i++) {
  const u = pick(users);
  const failed = chance(0.16);
  const risk = failed && chance(0.3) ? pick(["Medium","High"]) : chance(0.06) ? "Low" : "None";
  signIns.push({
    time: recentTimestamp(14),
    user: String(u.displayName),
    upn: String(u.upn),
    application: pick(APPS),
    status: failed ? "Failure" : "Success",
    failureReason: failed ? pick(FAILURE_REASONS) : "—",
    caPolicyApplied: chance(0.7) ? pick(CA_POLICIES) : "None applied",
    caResult: failed && chance(0.4) ? "Blocked" : "Satisfied",
    riskLevel: risk,
    mfaRequired: chance(0.6) ? "Yes" : "No",
    ipAddress: `20.${int(10, 250)}.${int(0, 255)}.${int(1, 254)}`,
    location: pick(CITIES),
    client: pick(["Browser","Mobile app","Desktop client","Legacy client"]),
  });
}
signIns.sort((a, b) => String(b.time).localeCompare(String(a.time)));

export const tables: PortalTables = { users, mailboxes, teams, sites, drives, devices, distributionGroups, groupMembers, caPolicies, auditEvents, signIns };

// ---------------------------------------------------------------- time series (analytics)

function series(days: number, build: (i: number) => Row): Row[] {
  return Array.from({ length: days }, (_, i) => ({ date: daysAgoDate(days - 1 - i).slice(5), ...build(i) }));
}
export const analyticsSeries: Record<string, Row[]> = {
  signInTrend: series(30, (i) => ({ Success: 1400 + int(-160, 220) + i * 6, Failure: 180 + int(-60, 90) + (i === 24 ? 260 : 0) })),
  mfaAdoption: series(30, (i) => ({ "MFA capable": 328 + Math.floor(i * 1.1), "MFA enforced": 296 + Math.floor(i * 1.4) })),
  mailTraffic: series(30, () => ({ Sent: 5200 + int(-900, 1200), Received: 8900 + int(-1200, 1600), Spam: 420 + int(-140, 260) })),
  mailboxGrowth: series(30, (i) => ({ "Total size (GB)": 8200 + i * 14 + int(-8, 8) })),
  teamsUsage: series(30, () => ({ Messages: 15200 + int(-2800, 3400), Meetings: 640 + int(-140, 200) })),
  activeUsers: series(30, () => ({ Teams: 300 + int(-30, 40), Exchange: 342 + int(-20, 26), SharePoint: 262 + int(-34, 40) })),
  storageGrowth: series(30, (i) => ({ "SharePoint (GB)": 61_000 + i * 120 + int(-40, 40), "OneDrive (GB)": 38_000 + i * 90 + int(-30, 30) })),
  oneDriveGrowth: series(30, (i) => ({ "Storage (GB)": 38_000 + i * 90 + int(-30, 30) })),
  complianceTrend: series(30, (i) => ({ Compliant: 248 + Math.floor(i * 0.8), "Non-compliant": 46 - Math.floor(i * 0.4) })),
  secureScore: series(30, (i) => ({ "Secure Score %": 62 + Math.floor(i * 0.35) })),
  riskDetections: series(30, (i) => ({ Detections: 14 + int(-6, 9) + (i === 24 ? 21 : 0) })),
};

// ---------------------------------------------------------------- column metadata

export const columnCatalog: Record<keyof PortalTables, Column[]> = {
  users: [
    { key: "displayName", label: "Display name", type: "text", width: 170 },
    { key: "upn", label: "User principal name", type: "text", width: 250 },
    { key: "department", label: "Department", type: "badge", width: 140 },
    { key: "jobTitle", label: "Job title", type: "text", width: 130 },
    { key: "country", label: "Country", type: "badge", width: 130 },
    { key: "userType", label: "User type", type: "badge", width: 90 },
    { key: "accountEnabled", label: "Account status", type: "badge", width: 110 },
    { key: "licensed", label: "License status", type: "badge", width: 110 },
    { key: "licenses", label: "Licenses", type: "text", width: 200 },
    { key: "adminRole", label: "Admin role", type: "badge", width: 170 },
    { key: "mfaStatus", label: "MFA status", type: "badge", width: 100 },
    { key: "mfaMethod", label: "MFA method", type: "text", width: 160 },
    { key: "lastSignIn", label: "Last sign-in", type: "date", width: 110 },
    { key: "inactiveDays", label: "Inactive days", type: "number", width: 100 },
    { key: "signIns30d", label: "Sign-ins (30d)", type: "number", width: 100 },
    { key: "riskLevel", label: "Risk level", type: "badge", width: 90 },
    { key: "legacyAuth", label: "Legacy auth", type: "badge", width: 95 },
    { key: "passwordNeverExpires", label: "Pwd never expires", type: "badge", width: 120 },
    { key: "createdDate", label: "Created", type: "date", width: 100 },
  ],
  mailboxes: [
    { key: "displayName", label: "Display name", type: "text", width: 170 },
    { key: "upn", label: "Email address", type: "text", width: 240 },
    { key: "mailboxType", label: "Type", type: "badge", width: 90 },
    { key: "sizeGB", label: "Size (GB)", type: "number", width: 90 },
    { key: "quotaGB", label: "Quota (GB)", type: "number", width: 95 },
    { key: "usagePercent", label: "Quota used %", type: "number", width: 105 },
    { key: "itemCount", label: "Items", type: "number", width: 90 },
    { key: "lastActivity", label: "Last activity", type: "date", width: 110 },
    { key: "inactiveDays", label: "Inactive days", type: "number", width: 100 },
    { key: "forwardingTo", label: "Forwarding to", type: "text", width: 210 },
    { key: "fullAccessDelegates", label: "Full-access delegates", type: "number", width: 140 },
    { key: "archiveEnabled", label: "Archive", type: "badge", width: 80 },
    { key: "holdStatus", label: "Hold", type: "badge", width: 110 },
  ],
  teams: [
    { key: "teamName", label: "Team", type: "text", width: 200 },
    { key: "privacy", label: "Privacy", type: "badge", width: 90 },
    { key: "owners", label: "Owners", type: "number", width: 80 },
    { key: "members", label: "Members", type: "number", width: 90 },
    { key: "guests", label: "Guests", type: "number", width: 80 },
    { key: "channels", label: "Channels", type: "number", width: 90 },
    { key: "messages30d", label: "Messages (30d)", type: "number", width: 110 },
    { key: "meetings30d", label: "Meetings (30d)", type: "number", width: 105 },
    { key: "lastActivity", label: "Last activity", type: "date", width: 110 },
    { key: "archived", label: "Archived", type: "badge", width: 85 },
    { key: "createdDate", label: "Created", type: "date", width: 100 },
  ],
  sites: [
    { key: "siteName", label: "Site", type: "text", width: 190 },
    { key: "url", label: "URL", type: "text", width: 190 },
    { key: "owner", label: "Owner", type: "text", width: 150 },
    { key: "template", label: "Template", type: "badge", width: 140 },
    { key: "storageGB", label: "Storage (GB)", type: "number", width: 105 },
    { key: "quotaGB", label: "Quota (GB)", type: "number", width: 95 },
    { key: "files", label: "Files", type: "number", width: 90 },
    { key: "externalSharing", label: "External sharing", type: "badge", width: 120 },
    { key: "anyoneLinks", label: "Anyone links", type: "number", width: 100 },
    { key: "guestUsers", label: "Guests", type: "number", width: 80 },
    { key: "sensitivityLabel", label: "Sensitivity", type: "badge", width: 130 },
    { key: "lastActivity", label: "Last activity", type: "date", width: 110 },
  ],
  drives: [
    { key: "owner", label: "Owner", type: "text", width: 160 },
    { key: "upn", label: "User principal name", type: "text", width: 240 },
    { key: "storageGB", label: "Storage (GB)", type: "number", width: 105 },
    { key: "quotaGB", label: "Quota (GB)", type: "number", width: 95 },
    { key: "files", label: "Files", type: "number", width: 90 },
    { key: "sharedFiles", label: "Shared files", type: "number", width: 100 },
    { key: "externalLinks", label: "External links", type: "number", width: 105 },
    { key: "anyoneLinks", label: "Anyone links", type: "number", width: 100 },
    { key: "sharingState", label: "Sharing state", type: "badge", width: 110 },
    { key: "lastActivity", label: "Last activity", type: "date", width: 110 },
    { key: "inactiveDays", label: "Inactive days", type: "number", width: 100 },
  ],
  devices: [
    { key: "deviceName", label: "Device", type: "text", width: 150 },
    { key: "owner", label: "Owner", type: "text", width: 150 },
    { key: "upn", label: "User principal name", type: "text", width: 230 },
    { key: "os", label: "OS", type: "badge", width: 90 },
    { key: "osVersion", label: "OS version", type: "text", width: 100 },
    { key: "compliance", label: "Compliance", type: "badge", width: 120 },
    { key: "complianceIssue", label: "Issue", type: "text", width: 160 },
    { key: "encrypted", label: "Encrypted", type: "badge", width: 90 },
    { key: "managedBy", label: "Managed by", type: "badge", width: 100 },
    { key: "lastCheckIn", label: "Last check-in", type: "date", width: 110 },
    { key: "staleDays", label: "Stale days", type: "number", width: 90 },
    { key: "enrolledDate", label: "Enrolled", type: "date", width: 100 },
  ],
  distributionGroups: [
    { key: "groupName", label: "Group", type: "text", width: 230 },
    { key: "email", label: "Email", type: "text", width: 200 },
    { key: "members", label: "Members", type: "number", width: 90 },
    { key: "managedBy", label: "Managed by", type: "text", width: 150 },
    { key: "externalSenders", label: "External senders", type: "badge", width: 120 },
    { key: "createdDate", label: "Created", type: "date", width: 100 },
  ],
  groupMembers: [
    { key: "groupName", label: "Group", type: "text", width: 220 },
    { key: "groupEmail", label: "Group email", type: "text", width: 230 },
    { key: "groupType", label: "Group type", type: "badge", width: 150 },
    { key: "memberName", label: "Member", type: "text", width: 180 },
    { key: "memberUpn", label: "Member UPN", type: "text", width: 260 },
    { key: "memberType", label: "Member type", type: "badge", width: 100 },
    { key: "membershipRole", label: "Role", type: "badge", width: 90 },
    { key: "department", label: "Department", type: "text", width: 160 },
    { key: "accountEnabled", label: "Account", type: "badge", width: 90 },
    { key: "lastSignIn", label: "Last sign-in", type: "date", width: 110 },
    { key: "addedDate", label: "Added", type: "date", width: 110 },
  ],
  caPolicies: [
    { key: "policyName", label: "Policy", type: "text", width: 230 },
    { key: "state", label: "State", type: "badge", width: 100 },
    { key: "includedUsers", label: "Included users", type: "text", width: 130 },
    { key: "excludedUsers", label: "Exclusions", type: "number", width: 90 },
    { key: "controls", label: "Grant control", type: "badge", width: 130 },
    { key: "appliedLast30d", label: "Applied (30d)", type: "number", width: 105 },
    { key: "failuresLast30d", label: "Failures (30d)", type: "number", width: 105 },
    { key: "modifiedDate", label: "Modified", type: "date", width: 100 },
  ],
  auditEvents: [
    { key: "time", label: "Time (UTC)", type: "date", width: 130 },
    { key: "service", label: "Service", type: "badge", width: 130 },
    { key: "operation", label: "Operation", type: "text", width: 210 },
    { key: "actor", label: "Actor", type: "text", width: 150 },
    { key: "actorUpn", label: "Actor UPN", type: "text", width: 220 },
    { key: "target", label: "Target", type: "text", width: 210 },
    { key: "result", label: "Result", type: "badge", width: 85 },
    { key: "ipAddress", label: "IP address", type: "text", width: 120 },
    { key: "location", label: "Location", type: "badge", width: 110 },
  ],
  signIns: [
    { key: "time", label: "Time (UTC)", type: "date", width: 130 },
    { key: "user", label: "User", type: "text", width: 150 },
    { key: "upn", label: "User principal name", type: "text", width: 230 },
    { key: "application", label: "Application", type: "badge", width: 140 },
    { key: "status", label: "Status", type: "badge", width: 85 },
    { key: "failureReason", label: "Failure reason", type: "text", width: 170 },
    { key: "caPolicyApplied", label: "CA policy applied", type: "text", width: 210 },
    { key: "caResult", label: "CA result", type: "badge", width: 95 },
    { key: "riskLevel", label: "Risk", type: "badge", width: 80 },
    { key: "mfaRequired", label: "MFA required", type: "badge", width: 100 },
    { key: "ipAddress", label: "IP address", type: "text", width: 120 },
    { key: "location", label: "Location", type: "badge", width: 105 },
    { key: "client", label: "Client", type: "badge", width: 110 },
  ],
};

// ---------------------------------------------------------------- report catalogue

const r = (def: ReportDef) => def;

export const reportCatalog: ReportDef[] = [
  // ----- Entra ID · statistical
  r({ id: "entra-all-users", name: "All Users", service: "Entra ID", plane: "reports", category: "User Reports", description: "Every user object in the directory with account, license, and authentication posture.", source: "users",
    columns: ["displayName","upn","department","userType","accountEnabled","licensed","mfaStatus","lastSignIn","riskLevel"],
    quickFilters: [
      { label: "Guests only", filter: { column: "userType", op: "equals", value: "Guest" } },
      { label: "Disabled accounts", filter: { column: "accountEnabled", op: "equals", value: "Disabled" } },
      { label: "High risk", filter: { column: "riskLevel", op: "equals", value: "High" } },
    ],
    chart: { kind: "donut", groupBy: "department" } }),
  r({ id: "entra-licensed-users", name: "Licensed vs Unlicensed Users", service: "Entra ID", plane: "reports", category: "User Reports", description: "License assignment state across all members, with SKU detail.", source: "users",
    baseFilters: [{ column: "userType", op: "equals", value: "Member" }],
    columns: ["displayName","upn","department","licensed","licenses","accountEnabled","lastSignIn"],
    quickFilters: [
      { label: "Unlicensed only", filter: { column: "licensed", op: "equals", value: "Unlicensed" } },
      { label: "E5 users", filter: { column: "licenses", op: "contains", value: "E5" } },
    ],
    chart: { kind: "donut", groupBy: "licensed" } }),
  r({ id: "entra-mfa-status", name: "MFA Status of Users", service: "Entra ID", plane: "reports", category: "Security Posture", description: "Multi-factor registration and enforcement state per user.", source: "users",
    columns: ["displayName","upn","department","mfaStatus","mfaMethod","adminRole","riskLevel","lastSignIn"],
    quickFilters: [
      { label: "MFA disabled", filter: { column: "mfaStatus", op: "equals", value: "Disabled" } },
      { label: "Admins without MFA", filter: { column: "adminRole", op: "not", value: "—" } },
    ],
    chart: { kind: "donut", groupBy: "mfaStatus" } }),
  r({ id: "entra-inactive-users", name: "Inactive Users by Last Sign-in", service: "Entra ID", plane: "reports", category: "User Reports", description: "Users ranked by days since last interactive sign-in.", source: "users",
    columns: ["displayName","upn","department","licensed","licenses","lastSignIn","inactiveDays","accountEnabled"],
    defaultSort: { column: "inactiveDays", dir: "desc" },
    quickFilters: [
      { label: "Inactive 90+ days", filter: { column: "inactiveDays", op: "gt", value: "90" } },
      { label: "Inactive 30+ days", filter: { column: "inactiveDays", op: "gt", value: "30" } },
      { label: "Licensed & inactive", filter: { column: "licensed", op: "equals", value: "Licensed" } },
    ],
    chart: { kind: "bar", groupBy: "department" } }),
  r({ id: "entra-admins", name: "Admin Role Members", service: "Entra ID", plane: "reports", category: "Security Posture", description: "Directory role holders and their authentication strength.", source: "users",
    baseFilters: [{ column: "adminRole", op: "not", value: "—" }],
    columns: ["displayName","upn","adminRole","mfaStatus","mfaMethod","lastSignIn","riskLevel","passwordNeverExpires"],
    quickFilters: [{ label: "Without MFA", filter: { column: "mfaStatus", op: "equals", value: "Disabled" } }],
    chart: { kind: "bar", groupBy: "adminRole" } }),
  r({ id: "entra-guests", name: "Guest Users", service: "Entra ID", plane: "reports", category: "User Reports", description: "External identities invited into the tenant.", source: "users",
    baseFilters: [{ column: "userType", op: "equals", value: "Guest" }],
    columns: ["displayName","upn","country","accountEnabled","mfaStatus","lastSignIn","inactiveDays","createdDate"],
    quickFilters: [{ label: "Stale 90+ days", filter: { column: "inactiveDays", op: "gt", value: "90" } }],
    chart: { kind: "donut", groupBy: "mfaStatus" } }),
  r({ id: "entra-legacy-auth", name: "Users with Legacy Authentication", service: "Entra ID", plane: "reports", category: "Security Posture", description: "Accounts observed using basic/legacy protocols in the last 7 days.", source: "users",
    baseFilters: [{ column: "legacyAuth", op: "equals", value: "Yes" }],
    columns: ["displayName","upn","department","mfaStatus","lastSignIn","riskLevel","accountEnabled"],
    chart: { kind: "donut", groupBy: "department" } }),
  r({ id: "entra-ca-policies", name: "Conditional Access Policies", service: "Entra ID", plane: "reports", category: "Security Posture", description: "Policy inventory with 30-day application and failure counts.", source: "caPolicies",
    columns: ["policyName","state","includedUsers","excludedUsers","controls","appliedLast30d","failuresLast30d","modifiedDate"],
    chart: { kind: "bar", groupBy: "controls" } }),
  r({ id: "entra-m365-groups", name: "Microsoft 365 Groups", service: "Entra ID", plane: "reports", category: "Groups & Membership", description: "Team-backed Microsoft 365 groups with ownership, membership, guest exposure, and activity.", source: "teams",
    columns: ["teamName","privacy","owners","members","guests","channels","messages30d","lastActivity","createdDate"],
    quickFilters: [
      { label: "Ownerless groups", filter: { column: "owners", op: "lt", value: "1" } },
      { label: "Guest access", filter: { column: "guests", op: "gt", value: "0" } },
      { label: "Public groups", filter: { column: "privacy", op: "equals", value: "Public" } },
    ],
    chart: { kind: "donut", groupBy: "privacy" } }),
  r({ id: "entra-group-members", name: "Group Membership Detail", service: "Entra ID", plane: "reports", category: "Groups & Membership", description: "Owner and member evidence across Microsoft 365 and distribution groups, with member identity and sign-in context.", source: "groupMembers",
    columns: ["groupName","groupType","memberName","memberUpn","memberType","membershipRole","department","accountEnabled","lastSignIn","addedDate"],
    quickFilters: [
      { label: "Owners", filter: { column: "membershipRole", op: "equals", value: "Owner" } },
      { label: "Guest members", filter: { column: "memberType", op: "equals", value: "Guest" } },
      { label: "Disabled members", filter: { column: "accountEnabled", op: "equals", value: "Disabled" } },
    ],
    chart: { kind: "bar", groupBy: "groupType" } }),
  // ----- Entra ID · audit
  r({ id: "entra-signins", name: "User Sign-in Activity", service: "Entra ID", plane: "auditing", category: "Sign-in Audit", description: "Every interactive sign-in with Conditional Access outcome, client, and location.", source: "signIns",
    columns: ["time","user","upn","application","status","caPolicyApplied","caResult","mfaRequired","ipAddress","location","client"],
    quickFilters: [
      { label: "Failures only", filter: { column: "status", op: "equals", value: "Failure" } },
      { label: "Legacy clients", filter: { column: "client", op: "equals", value: "Legacy client" } },
    ],
    chart: { kind: "donut", groupBy: "status" } }),
  r({ id: "entra-signin-failures", name: "Failed Sign-ins", service: "Entra ID", plane: "auditing", category: "Sign-in Audit", description: "Interactive sign-in failures with reason and Conditional Access outcome.", source: "signIns",
    baseFilters: [{ column: "status", op: "equals", value: "Failure" }],
    columns: ["time","user","upn","application","failureReason","caPolicyApplied","caResult","riskLevel","ipAddress","location"],
    quickFilters: [
      { label: "CA blocked", filter: { column: "caResult", op: "equals", value: "Blocked" } },
      { label: "Risky", filter: { column: "riskLevel", op: "not", value: "None" } },
    ],
    chart: { kind: "bar", groupBy: "failureReason" } }),
  r({ id: "entra-risky-signins", name: "Risky Sign-ins", service: "Entra ID", plane: "auditing", category: "Sign-in Audit", description: "Sign-ins flagged with identity-protection risk.", source: "signIns",
    baseFilters: [{ column: "riskLevel", op: "not", value: "None" }],
    columns: ["time","user","upn","application","status","riskLevel","ipAddress","location","client"],
    chart: { kind: "donut", groupBy: "riskLevel" } }),
  r({ id: "entra-user-mgmt-audit", name: "User Management Events", service: "Entra ID", plane: "auditing", category: "Directory Audit", description: "Who created, updated, deleted, or reset users and memberships.", source: "auditEvents",
    baseFilters: [{ column: "service", op: "equals", value: "Entra ID" }],
    columns: ["time","operation","actor","actorUpn","target","result","ipAddress","location"],
    quickFilters: [{ label: "Role changes", filter: { column: "operation", op: "contains", value: "role" } }],
    chart: { kind: "bar", groupBy: "operation" } }),
  // ----- Entra ID · analytics
  r({ id: "entra-signin-trend", name: "Sign-in Success vs Failure Trend", service: "Entra ID", plane: "analytics", category: "Sign-in Analytics", description: "Daily interactive sign-in outcomes across 30 days. Drill into any day’s failures.", source: "signIns",
    columns: ["time","user","application","status","failureReason","location"],
    chart: { kind: "line", series: "signInTrend", keys: ["Success","Failure"] } }),
  r({ id: "entra-mfa-trend", name: "MFA Adoption Trend", service: "Entra ID", plane: "analytics", category: "Sign-in Analytics", description: "MFA-capable versus MFA-enforced users over time.", source: "users",
    columns: ["displayName","upn","mfaStatus","mfaMethod","department"],
    chart: { kind: "area", series: "mfaAdoption", keys: ["MFA capable","MFA enforced"] } }),
  // ----- Exchange
  r({ id: "exo-all-mailboxes", name: "All Mailboxes", service: "Exchange Online", plane: "reports", category: "Mailbox Reports", description: "User, shared, and room mailboxes with size and activity.", source: "mailboxes",
    columns: ["displayName","upn","mailboxType","sizeGB","quotaGB","usagePercent","lastActivity","archiveEnabled"],
    quickFilters: [{ label: "Shared only", filter: { column: "mailboxType", op: "equals", value: "Shared" } }],
    chart: { kind: "donut", groupBy: "mailboxType" } }),
  r({ id: "exo-mailbox-size", name: "Mailbox Size & Quota", service: "Exchange Online", plane: "reports", category: "Mailbox Reports", description: "Storage consumption against quota, largest first.", source: "mailboxes",
    columns: ["displayName","upn","mailboxType","sizeGB","quotaGB","usagePercent","itemCount","holdStatus"],
    defaultSort: { column: "usagePercent", dir: "desc" },
    quickFilters: [
      { label: "Over 80% quota", filter: { column: "usagePercent", op: "gt", value: "80" } },
      { label: "On hold", filter: { column: "holdStatus", op: "not", value: "None" } },
    ],
    chart: { kind: "bar", groupBy: "mailboxType" } }),
  r({ id: "exo-inactive-mailboxes", name: "Inactive Mailboxes", service: "Exchange Online", plane: "reports", category: "Mailbox Reports", description: "Mailboxes without activity, ranked by idle days.", source: "mailboxes",
    columns: ["displayName","upn","mailboxType","lastActivity","inactiveDays","sizeGB","fullAccessDelegates"],
    defaultSort: { column: "inactiveDays", dir: "desc" },
    quickFilters: [{ label: "Inactive 60+ days", filter: { column: "inactiveDays", op: "gt", value: "60" } }],
    chart: { kind: "donut", groupBy: "mailboxType" } }),
  r({ id: "exo-forwarding", name: "Mailboxes with Forwarding", service: "Exchange Online", plane: "reports", category: "Mail Flow", description: "Mailboxes forwarding mail, including external destinations.", source: "mailboxes",
    baseFilters: [{ column: "forwardingTo", op: "not", value: "—" }],
    columns: ["displayName","upn","forwardingTo","mailboxType","lastActivity","fullAccessDelegates"],
    quickFilters: [{ label: "External destination", filter: { column: "forwardingTo", op: "contains", value: "outside-partner" } }],
    chart: { kind: "donut", groupBy: "mailboxType" } }),
  r({ id: "exo-dls", name: "Distribution Groups", service: "Exchange Online", plane: "reports", category: "Recipient Reports", description: "Distribution lists with membership and sender restrictions.", source: "distributionGroups",
    columns: ["groupName","email","members","managedBy","externalSenders","createdDate"],
    quickFilters: [{ label: "Empty groups", filter: { column: "members", op: "lt", value: "1" } }],
    chart: { kind: "donut", groupBy: "externalSenders" } }),
  r({ id: "exo-permission-audit", name: "Mailbox Permission Changes", service: "Exchange Online", plane: "auditing", category: "Mailbox Audit", description: "Permission, delegation, forwarding, and rule changes on mailboxes.", source: "auditEvents",
    baseFilters: [{ column: "service", op: "equals", value: "Exchange Online" }],
    columns: ["time","operation","actor","target","result","ipAddress","location"],
    chart: { kind: "bar", groupBy: "operation" } }),
  r({ id: "exo-mail-traffic", name: "Daily Mail Traffic", service: "Exchange Online", plane: "analytics", category: "Mail Flow Analytics", description: "Organization-wide sent, received, and spam volumes.", source: "mailboxes",
    columns: ["displayName","upn","sizeGB","itemCount","lastActivity"],
    chart: { kind: "area", series: "mailTraffic", keys: ["Sent","Received","Spam"] } }),
  r({ id: "exo-growth", name: "Mailbox Storage Growth", service: "Exchange Online", plane: "analytics", category: "Storage Analytics", description: "Total mailbox storage trend across the tenant.", source: "mailboxes",
    columns: ["displayName","upn","sizeGB","quotaGB","usagePercent"],
    chart: { kind: "line", series: "mailboxGrowth", keys: ["Total size (GB)"] } }),
  // ----- Teams
  r({ id: "teams-all", name: "All Teams", service: "Microsoft Teams", plane: "reports", category: "Team Reports", description: "Every team with ownership, membership, and activity.", source: "teams",
    columns: ["teamName","privacy","owners","members","guests","channels","messages30d","lastActivity","archived"],
    quickFilters: [
      { label: "Ownerless", filter: { column: "owners", op: "lt", value: "1" } },
      { label: "With guests", filter: { column: "guests", op: "gt", value: "0" } },
      { label: "Public teams", filter: { column: "privacy", op: "equals", value: "Public" } },
    ],
    chart: { kind: "donut", groupBy: "privacy" } }),
  r({ id: "teams-inactive", name: "Inactive Teams", service: "Microsoft Teams", plane: "reports", category: "Team Reports", description: "Teams with no messages or meetings in 30 days.", source: "teams",
    baseFilters: [{ column: "messages30d", op: "lt", value: "1" }],
    columns: ["teamName","privacy","owners","members","lastActivity","createdDate","archived"],
    chart: { kind: "donut", groupBy: "privacy" } }),
  r({ id: "teams-audit", name: "Team Membership & Lifecycle Events", service: "Microsoft Teams", plane: "auditing", category: "Teams Audit", description: "Creation, deletion, membership, and app events.", source: "auditEvents",
    baseFilters: [{ column: "service", op: "equals", value: "Microsoft Teams" }],
    columns: ["time","operation","actor","target","result","location"],
    chart: { kind: "bar", groupBy: "operation" } }),
  r({ id: "teams-usage", name: "Teams Usage Analytics", service: "Microsoft Teams", plane: "analytics", category: "Usage Analytics", description: "Messages and meetings volume across 30 days.", source: "teams",
    columns: ["teamName","members","messages30d","meetings30d","lastActivity"],
    chart: { kind: "area", series: "teamsUsage", keys: ["Messages","Meetings"] } }),
  // ----- SharePoint
  r({ id: "spo-all-sites", name: "All Sites", service: "SharePoint Online", plane: "reports", category: "Site Reports", description: "Site collections with storage, sharing, and sensitivity.", source: "sites",
    columns: ["siteName","url","owner","template","storageGB","externalSharing","guestUsers","sensitivityLabel","lastActivity"],
    quickFilters: [
      { label: "External sharing on", filter: { column: "externalSharing", op: "equals", value: "Enabled" } },
      { label: "Confidential label", filter: { column: "sensitivityLabel", op: "contains", value: "Confidential" } },
    ],
    chart: { kind: "donut", groupBy: "externalSharing" } }),
  r({ id: "spo-external", name: "Sites with External Sharing", service: "SharePoint Online", plane: "reports", category: "Sharing Reports", description: "Externally shared sites including Anyone links and guest counts.", source: "sites",
    baseFilters: [{ column: "externalSharing", op: "equals", value: "Enabled" }],
    columns: ["siteName","owner","anyoneLinks","guestUsers","sensitivityLabel","storageGB","lastActivity"],
    defaultSort: { column: "anyoneLinks", dir: "desc" },
    quickFilters: [{ label: "Anyone links present", filter: { column: "anyoneLinks", op: "gt", value: "0" } }],
    chart: { kind: "bar", groupBy: "sensitivityLabel" } }),
  r({ id: "spo-storage", name: "Site Storage", service: "SharePoint Online", plane: "reports", category: "Storage Reports", description: "Storage consumption per site against quota.", source: "sites",
    columns: ["siteName","owner","storageGB","quotaGB","files","template","lastActivity"],
    defaultSort: { column: "storageGB", dir: "desc" },
    chart: { kind: "bar", groupBy: "template" } }),
  r({ id: "spo-audit", name: "Sharing & Permission Events", service: "SharePoint Online", plane: "auditing", category: "SharePoint Audit", description: "Sharing invitations, anonymous links, and permission changes.", source: "auditEvents",
    baseFilters: [{ column: "service", op: "equals", value: "SharePoint Online" }],
    columns: ["time","operation","actor","target","result","ipAddress","location"],
    quickFilters: [{ label: "Anonymous links", filter: { column: "operation", op: "contains", value: "Anonymous" } }],
    chart: { kind: "bar", groupBy: "operation" } }),
  r({ id: "spo-growth", name: "Storage Growth Trend", service: "SharePoint Online", plane: "analytics", category: "Storage Analytics", description: "SharePoint and OneDrive storage growth across 30 days.", source: "sites",
    columns: ["siteName","storageGB","quotaGB","files"],
    chart: { kind: "area", series: "storageGrowth", keys: ["SharePoint (GB)","OneDrive (GB)"] } }),
  // ----- OneDrive
  r({ id: "od-accounts", name: "All OneDrive Accounts", service: "OneDrive", plane: "reports", category: "Storage Reports", description: "Provisioned OneDrive accounts with storage and sharing.", source: "drives",
    columns: ["owner","upn","storageGB","files","sharedFiles","externalLinks","sharingState","lastActivity"],
    quickFilters: [
      { label: "Externally shared", filter: { column: "externalLinks", op: "gt", value: "0" } },
      { label: "Anyone links", filter: { column: "anyoneLinks", op: "gt", value: "0" } },
    ],
    chart: { kind: "donut", groupBy: "sharingState" } }),
  r({ id: "od-external", name: "Externally Shared OneDrive Content", service: "OneDrive", plane: "reports", category: "Sharing Reports", description: "Accounts sharing content outside the organization.", source: "drives",
    baseFilters: [{ column: "externalLinks", op: "gt", value: "0" }],
    columns: ["owner","upn","externalLinks","anyoneLinks","sharedFiles","storageGB","lastActivity"],
    defaultSort: { column: "externalLinks", dir: "desc" },
    chart: { kind: "donut", groupBy: "sharingState" } }),
  r({ id: "od-audit", name: "OneDrive Sharing Events", service: "OneDrive", plane: "auditing", category: "OneDrive Audit", description: "External shares, anonymous links, downloads, and deletions.", source: "auditEvents",
    baseFilters: [{ column: "service", op: "equals", value: "OneDrive" }],
    columns: ["time","operation","actor","target","result","ipAddress","location"],
    chart: { kind: "bar", groupBy: "operation" } }),
  r({ id: "od-growth", name: "OneDrive Storage Growth", service: "OneDrive", plane: "analytics", category: "Storage Analytics", description: "Aggregate OneDrive storage trend.", source: "drives",
    columns: ["owner","storageGB","files"],
    chart: { kind: "line", series: "oneDriveGrowth", keys: ["Storage (GB)"] } }),
  // ----- Intune
  r({ id: "intune-devices", name: "All Managed Devices", service: "Intune & Devices", plane: "reports", category: "Device Reports", description: "Intune-managed devices with compliance and check-in state.", source: "devices",
    columns: ["deviceName","owner","os","osVersion","compliance","encrypted","lastCheckIn","enrolledDate"],
    quickFilters: [
      { label: "Non-compliant", filter: { column: "compliance", op: "equals", value: "Non-compliant" } },
      { label: "Not encrypted", filter: { column: "encrypted", op: "equals", value: "No" } },
    ],
    chart: { kind: "donut", groupBy: "os" } }),
  r({ id: "intune-noncompliant", name: "Non-Compliant Devices", service: "Intune & Devices", plane: "reports", category: "Compliance Reports", description: "Devices failing compliance policy, with the failing control.", source: "devices",
    baseFilters: [{ column: "compliance", op: "not", value: "Compliant" }],
    columns: ["deviceName","owner","upn","os","compliance","complianceIssue","encrypted","lastCheckIn"],
    chart: { kind: "bar", groupBy: "complianceIssue" } }),
  r({ id: "intune-stale", name: "Stale Devices", service: "Intune & Devices", plane: "reports", category: "Device Reports", description: "Devices that have not checked in for 30+ days.", source: "devices",
    baseFilters: [{ column: "staleDays", op: "gt", value: "30" }],
    columns: ["deviceName","owner","os","lastCheckIn","staleDays","compliance","enrolledDate"],
    defaultSort: { column: "staleDays", dir: "desc" },
    chart: { kind: "donut", groupBy: "os" } }),
  r({ id: "intune-audit", name: "Device Lifecycle Events", service: "Intune & Devices", plane: "auditing", category: "Device Audit", description: "Enrollment, retirement, wipe, and policy assignment events.", source: "auditEvents",
    baseFilters: [{ column: "service", op: "equals", value: "Intune" }],
    columns: ["time","operation","actor","target","result","location"],
    chart: { kind: "bar", groupBy: "operation" } }),
  r({ id: "intune-trend", name: "Device Compliance Trend", service: "Intune & Devices", plane: "analytics", category: "Compliance Analytics", description: "Compliant versus non-compliant devices over time.", source: "devices",
    columns: ["deviceName","owner","compliance","lastCheckIn"],
    chart: { kind: "area", series: "complianceTrend", keys: ["Compliant","Non-compliant"] } }),
  // ----- Security
  r({ id: "sec-risky-users", name: "Risky Users", service: "Security & Compliance", plane: "reports", category: "Identity Protection", description: "Users carrying an active identity-protection risk level.", source: "users",
    baseFilters: [{ column: "riskLevel", op: "not", value: "None" }],
    columns: ["displayName","upn","department","riskLevel","mfaStatus","lastSignIn","accountEnabled","adminRole"],
    defaultSort: { column: "riskLevel", dir: "asc" },
    quickFilters: [{ label: "High risk only", filter: { column: "riskLevel", op: "equals", value: "High" } }],
    chart: { kind: "donut", groupBy: "riskLevel" } }),
  r({ id: "sec-users-no-mfa", name: "Users without MFA", service: "Security & Compliance", plane: "reports", category: "Identity Protection", description: "Accounts with no registered second factor.", source: "users",
    baseFilters: [{ column: "mfaStatus", op: "equals", value: "Disabled" }],
    columns: ["displayName","upn","department","userType","adminRole","riskLevel","lastSignIn"],
    quickFilters: [{ label: "Privileged only", filter: { column: "adminRole", op: "not", value: "—" } }],
    chart: { kind: "donut", groupBy: "userType" } }),
  r({ id: "sec-audit-search", name: "Unified Audit Log Search", service: "Security & Compliance", plane: "auditing", category: "Audit Search", description: "Cross-workload audit trail retained indefinitely in the platform store.", source: "auditEvents",
    columns: ["time","service","operation","actor","actorUpn","target","result","ipAddress","location"],
    quickFilters: [{ label: "Failures only", filter: { column: "result", op: "equals", value: "Failed" } }],
    chart: { kind: "bar", groupBy: "service" } }),
  r({ id: "sec-secure-score", name: "Secure Score Trend", service: "Security & Compliance", plane: "analytics", category: "Posture Analytics", description: "Tenant Secure Score history retained beyond Microsoft’s window.", source: "auditEvents",
    columns: ["time","service","operation","result"],
    chart: { kind: "line", series: "secureScore", keys: ["Secure Score %"] } }),
  r({ id: "sec-risk-trend", name: "Risk Detections Trend", service: "Security & Compliance", plane: "analytics", category: "Posture Analytics", description: "Daily identity risk detections with anomaly spikes visible.", source: "signIns",
    columns: ["time","user","riskLevel","status","location"],
    chart: { kind: "line", series: "riskDetections", keys: ["Detections"] } }),
];

export const SERVICES = ["Entra ID","Exchange Online","Microsoft Teams","SharePoint Online","OneDrive","Intune & Devices","Security & Compliance"] as const;

export const PLANE_LABEL: Record<Plane, string> = { reports: "Statistical Reports", auditing: "Audit Reports", analytics: "Analytics" };

// ---------------------------------------------------------------- dashboard KPIs

export type DashboardTile = { label: string; value: number; detail: string; reportId: string; tone: "indigo" | "teal" | "amber" | "rose" };

const count = (rows: Row[], pred: (row: Row) => boolean) => rows.filter(pred).length;

// ---------------------------------------------------------------- workspace types & seeds

export type PortalView = { id: string; name: string; reportId: string; columns: string[]; filters: Filter[]; sort: SortSpec[]; createdAt: string };
export type ScheduleRun = { at: string; rows: number; outcome: "delivered" | "suppressed" };
export type PortalSchedule = {
  id: string; name: string; reportId: string; frequency: string; time: string; recipients: string; format: string;
  suppressEmpty: boolean; status: "Active" | "Paused"; columns: string[]; filters: Filter[]; sort: SortSpec[];
  runs: ScheduleRun[]; createdAt: string;
};
export type PortalAlert = {
  id: string; name: string; reportId: string; mode: "Threshold" | "Trend comparison"; operator: "above" | "below";
  threshold: number; trendPercent: number; status: "Open" | "Investigating" | "Closed"; firedLast30d: number;
  filters: Filter[]; lastEvaluatedAt?: string; lastValue?: number; lastOutcome?: "Fired" | "Normal"; createdAt: string;
};

const colsOf = (id: string) => reportCatalog.find((d) => d.id === id)?.columns ?? [];

export const seedViews: PortalView[] = [
  { id: "v-seed-mfa", name: "Privileged accounts without MFA", reportId: "entra-mfa-status", columns: colsOf("entra-mfa-status"),
    filters: [{ column: "mfaStatus", op: "equals", value: "Disabled" }, { column: "adminRole", op: "not", value: "—" }],
    sort: [{ column: "displayName", dir: "asc" }], createdAt: "2026-07-12T08:00:00Z" },
  { id: "v-seed-fwd", name: "External forwarding — weekly review", reportId: "exo-forwarding", columns: colsOf("exo-forwarding"),
    filters: [{ column: "forwardingTo", op: "contains", value: "outside-partner" }], sort: [], createdAt: "2026-07-14T08:00:00Z" },
  { id: "v-seed-links", name: "Anyone links on confidential sites", reportId: "spo-external", columns: colsOf("spo-external"),
    filters: [{ column: "anyoneLinks", op: "gt", value: "0" }, { column: "sensitivityLabel", op: "contains", value: "Confidential" }],
    sort: [{ column: "anyoneLinks", dir: "desc" }], createdAt: "2026-07-15T08:00:00Z" },
];

export const seedSchedules: PortalSchedule[] = [
  { id: "s-seed-signin", name: "Daily failed sign-ins to SecOps", reportId: "entra-signin-failures", frequency: "Daily", time: "07:00",
    recipients: "secops@sample.invalid", format: "XLSX", suppressEmpty: true, status: "Active",
    columns: colsOf("entra-signin-failures"), filters: [], sort: [],
    runs: [{ at: "2026-07-18 07:00", rows: 141, outcome: "delivered" }, { at: "2026-07-17 07:00", rows: 129, outcome: "delivered" }],
    createdAt: "2026-07-10T07:00:00Z" },
  { id: "s-seed-quota", name: "Weekly mailbox quota watch", reportId: "exo-mailbox-size", frequency: "Weekly", time: "06:30",
    recipients: "exchange-admins@sample.invalid", format: "PDF", suppressEmpty: true, status: "Active",
    columns: colsOf("exo-mailbox-size"), filters: [{ column: "usagePercent", op: "gt", value: "80" }], sort: [{ column: "usagePercent", dir: "desc" }],
    runs: [{ at: "2026-07-13 06:30", rows: 38, outcome: "delivered" }],
    createdAt: "2026-07-06T06:30:00Z" },
];

export const seedAlerts: PortalAlert[] = [
  { id: "a-seed-spike", name: "Spike in failed sign-ins", reportId: "entra-signin-failures", mode: "Trend comparison", operator: "above",
    threshold: 0, trendPercent: 40, status: "Investigating", firedLast30d: 2, filters: [],
    lastEvaluatedAt: "2026-07-18 07:05", lastValue: 141, lastOutcome: "Fired", createdAt: "2026-07-08T00:00:00Z" },
  { id: "a-seed-device", name: "Non-compliant devices above 45", reportId: "intune-noncompliant", mode: "Threshold", operator: "above",
    threshold: 45, trendPercent: 0, status: "Open", firedLast30d: 4, filters: [],
    lastEvaluatedAt: "2026-07-18 08:00", lastValue: 52, lastOutcome: "Fired", createdAt: "2026-07-05T00:00:00Z" },
  { id: "a-seed-anyone", name: "Anyone links appearing on OneDrive", reportId: "od-external", mode: "Threshold", operator: "above",
    threshold: 10, trendPercent: 0, status: "Closed", firedLast30d: 0, filters: [{ column: "anyoneLinks", op: "gt", value: "0" }],
    lastEvaluatedAt: "2026-07-17 09:00", lastValue: 7, lastOutcome: "Normal", createdAt: "2026-07-02T00:00:00Z" },
];

export const dashboardTiles: DashboardTile[] = [
  { label: "Total users", value: users.length, detail: `${count(users, (u) => u.userType === "Guest")} guests`, reportId: "entra-all-users", tone: "indigo" },
  { label: "Unlicensed members", value: count(users, (u) => u.userType === "Member" && u.licensed === "Unlicensed"), detail: "reclaim or assign", reportId: "entra-licensed-users", tone: "teal" },
  { label: "Users without MFA", value: count(users, (u) => u.mfaStatus === "Disabled"), detail: `${count(users, (u) => u.mfaStatus === "Disabled" && u.adminRole !== "—")} privileged`, reportId: "sec-users-no-mfa", tone: "rose" },
  { label: "Inactive 90+ days", value: count(users, (u) => Number(u.inactiveDays) > 90), detail: "by last sign-in", reportId: "entra-inactive-users", tone: "amber" },
  { label: "Mailboxes over 80% quota", value: count(mailboxes, (m) => Number(m.usagePercent) > 80), detail: `of ${mailboxes.length} mailboxes`, reportId: "exo-mailbox-size", tone: "amber" },
  { label: "Sites sharing externally", value: count(sites, (s) => s.externalSharing === "Enabled"), detail: `${sites.reduce((a, s) => a + Number(s.anyoneLinks), 0)} anyone links`, reportId: "spo-external", tone: "rose" },
  { label: "Non-compliant devices", value: count(devices, (d) => d.compliance !== "Compliant"), detail: `of ${devices.length} managed`, reportId: "intune-noncompliant", tone: "rose" },
  { label: "Risky sign-ins (14d)", value: count(signIns, (s) => s.riskLevel !== "None"), detail: `${count(signIns, (s) => s.riskLevel === "High")} high risk`, reportId: "entra-risky-signins", tone: "indigo" },
];
