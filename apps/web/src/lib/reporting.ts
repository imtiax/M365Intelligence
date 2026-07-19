import type { CatalogueReport } from "@/data/suite";

export type ReportMetric = { label: string; value: string; detail: string };
export type GeneratedReport = {
  id: string;
  name: string;
  workload: string;
  description: string;
  generatedAt: string;
  sourceFreshness: string;
  totalRows: string;
  columns: string[];
  rows: string[][];
  metrics: ReportMetric[];
};

type Template = {
  columns: string[];
  rows: string[][];
  metrics: ReportMetric[];
};

const templates: Record<string, Template> = {
  "Microsoft Entra ID": {
    columns: [
      "Display name",
      "UPN",
      "Department",
      "Account",
      "MFA strength",
      "Risk",
      "Last sign-in",
    ],
    rows: [
      [
        "Nadia Almasi",
        "n.almasi@northstar.example",
        "Private Banking",
        "Enabled",
        "FIDO2",
        "High",
        "15 Jul 10:31",
      ],
      [
        "Robert Santos",
        "r.santos@northstar.example",
        "Infrastructure",
        "Enabled",
        "Authenticator",
        "Medium",
        "15 Jul 09:44",
      ],
      [
        "Li Chen",
        "l.chen@northstar.example",
        "Treasury",
        "Enabled",
        "Authenticator",
        "High",
        "15 Jul 08:18",
      ],
      [
        "Amira Malik",
        "a.malik@northstar.example",
        "Compliance",
        "Enabled",
        "FIDO2",
        "Low",
        "14 Jul 17:52",
      ],
      [
        "James Wilson",
        "j.wilson_ext@northstar.example",
        "External Audit",
        "Enabled",
        "SMS",
        "Medium",
        "12 Jul 12:06",
      ],
      [
        "Sara Ibrahim",
        "s.ibrahim@northstar.example",
        "Security",
        "Enabled",
        "FIDO2",
        "Low",
        "15 Jul 10:42",
      ],
      [
        "David Okafor",
        "d.okafor@northstar.example",
        "Endpoint",
        "Enabled",
        "Authenticator",
        "Medium",
        "15 Jul 10:22",
      ],
      [
        "Elena Rossi",
        "e.rossi@northstar.example",
        "Finance",
        "Disabled",
        "None",
        "High",
        "28 Jun 14:21",
      ],
    ],
    metrics: [
      {
        label: "Identities",
        value: "5,000",
        detail: "4,800 members / 200 guests",
      },
      {
        label: "MFA coverage",
        value: "96.8%",
        detail: "120 registration gaps",
      },
      { label: "Privileged", value: "186", detail: "45 require stronger MFA" },
      {
        label: "Risk detections",
        value: "142",
        detail: "31 under investigation",
      },
    ],
  },
  "Exchange Online": {
    columns: [
      "Mailbox",
      "Type",
      "Department",
      "Size",
      "Archive",
      "Delegates",
      "Forwarding",
      "Status",
    ],
    rows: [
      [
        "treasury.ops@northstar.example",
        "Shared",
        "Treasury",
        "87.4 GB",
        "122 GB",
        "14",
        "External",
        "Review",
      ],
      [
        "n.almasi@northstar.example",
        "User",
        "Private Banking",
        "42.8 GB",
        "18 GB",
        "2",
        "None",
        "Healthy",
      ],
      [
        "board@northstar.example",
        "Shared",
        "Executive",
        "61.2 GB",
        "94 GB",
        "21",
        "None",
        "Review",
      ],
      [
        "r.santos@northstar.example",
        "User",
        "Infrastructure",
        "18.9 GB",
        "0 GB",
        "1",
        "None",
        "Healthy",
      ],
      [
        "client.notices@northstar.example",
        "Shared",
        "Operations",
        "49.1 GB",
        "42 GB",
        "8",
        "Partner",
        "High risk",
      ],
      [
        "a.malik@northstar.example",
        "User",
        "Compliance",
        "24.6 GB",
        "12 GB",
        "0",
        "None",
        "Healthy",
      ],
      [
        "legacy.fx@northstar.example",
        "Shared",
        "Treasury",
        "96.7 GB",
        "148 GB",
        "17",
        "None",
        "Quota risk",
      ],
      [
        "investigations@northstar.example",
        "Shared",
        "Security",
        "38.3 GB",
        "79 GB",
        "6",
        "None",
        "Healthy",
      ],
    ],
    metrics: [
      { label: "Mailboxes", value: "12,106", detail: "1,284 shared/resource" },
      { label: "Storage", value: "418 TB", detail: "+4.2% over 90 days" },
      {
        label: "External forwarding",
        value: "49",
        detail: "11 newly detected",
      },
      { label: "Quota risk", value: "73", detail: "Above 90% utilization" },
    ],
  },
  "Microsoft Teams": {
    columns: [
      "Team",
      "Owners",
      "Members",
      "Guests",
      "Channels",
      "30-day activity",
      "Lifecycle",
    ],
    rows: [
      ["Infrastructure CAB", "3", "48", "0", "7", "High", "Active"],
      ["Project Falcon", "2", "126", "14", "11", "High", "Active"],
      ["Treasury Operations", "1", "84", "3", "8", "Medium", "Review owner"],
      ["2024 Audit Program", "0", "39", "6", "5", "Low", "Orphaned"],
      ["Private Banking UAE", "4", "316", "2", "16", "High", "Active"],
      ["Legacy Workplace", "1", "72", "0", "4", "None", "Archive"],
      ["Cyber Response", "5", "61", "1", "9", "High", "Active"],
      ["Vendor Onboarding", "2", "97", "28", "6", "Medium", "External review"],
    ],
    metrics: [
      { label: "Teams", value: "2,842", detail: "2,144 active this month" },
      { label: "Active users", value: "10,846", detail: "87% adoption" },
      { label: "Ownerless teams", value: "86", detail: "24 business critical" },
      {
        label: "External access",
        value: "438",
        detail: "Teams with guests/sharing",
      },
    ],
  },
  "SharePoint Online": {
    columns: [
      "Site",
      "Owner",
      "Sensitivity",
      "Storage",
      "Growth",
      "External sharing",
      "Anyone links",
    ],
    rows: [
      [
        "Project Falcon",
        "Nadia Almasi",
        "Confidential",
        "2.8 TB",
        "+18%",
        "New/existing guests",
        "3",
      ],
      [
        "Board Portal",
        "Corporate Secretariat",
        "Highly confidential",
        "486 GB",
        "+2%",
        "Disabled",
        "0",
      ],
      [
        "Treasury Operations",
        "Li Chen",
        "Confidential",
        "1.2 TB",
        "+11%",
        "Existing guests",
        "0",
      ],
      [
        "Public Marketing",
        "Elena Rossi",
        "Public",
        "714 GB",
        "+6%",
        "Anyone",
        "9",
      ],
      [
        "Regulatory Evidence",
        "Amira Malik",
        "Regulatory",
        "3.6 TB",
        "+4%",
        "Disabled",
        "0",
      ],
      [
        "Vendor Exchange",
        "Procurement",
        "Internal",
        "392 GB",
        "+21%",
        "New/existing guests",
        "7",
      ],
      [
        "Legacy Finance",
        "Unassigned",
        "Internal",
        "884 GB",
        "0%",
        "Existing guests",
        "1",
      ],
      [
        "Cyber Investigations",
        "Sara Ibrahim",
        "Highly confidential",
        "628 GB",
        "+9%",
        "Disabled",
        "0",
      ],
    ],
    metrics: [
      { label: "Sites", value: "4,316", detail: "3,948 actively governed" },
      { label: "Storage", value: "286 TB", detail: "+7.8% annualized growth" },
      { label: "Anyone links", value: "127", detail: "Across 12 sites" },
      { label: "Owner gaps", value: "68", detail: "17 high-sensitivity sites" },
    ],
  },
  OneDrive: {
    columns: [
      "Owner",
      "Department",
      "Storage",
      "Last activity",
      "External users",
      "Anonymous links",
      "Lifecycle",
    ],
    rows: [
      [
        "Nadia Almasi",
        "Private Banking",
        "418 GB",
        "15 Jul",
        "12",
        "0",
        "Active",
      ],
      [
        "James Wilson",
        "External Audit",
        "86 GB",
        "12 Jul",
        "4",
        "1",
        "Guest review",
      ],
      [
        "Elena Rossi",
        "Finance",
        "624 GB",
        "28 Jun",
        "19",
        "3",
        "Departure hold",
      ],
      ["Li Chen", "Treasury", "288 GB", "15 Jul", "6", "0", "Active"],
      [
        "Robert Santos",
        "Infrastructure",
        "174 GB",
        "15 Jul",
        "2",
        "0",
        "Active",
      ],
      ["Amira Malik", "Compliance", "362 GB", "14 Jul", "1", "0", "Retention"],
      [
        "Former User 1088",
        "Operations",
        "491 GB",
        "04 Apr",
        "8",
        "2",
        "Transfer owner",
      ],
      ["Sara Ibrahim", "Security", "215 GB", "15 Jul", "0", "0", "Active"],
    ],
    metrics: [
      { label: "Drives", value: "11,938", detail: "10,302 active this month" },
      { label: "Storage", value: "192 TB", detail: "+5.1% over 90 days" },
      {
        label: "External shares",
        value: "2,716",
        detail: "184 expire this week",
      },
      {
        label: "Former employees",
        value: "81",
        detail: "19 owner transfers due",
      },
    ],
  },
  "Microsoft Intune": {
    columns: [
      "Device",
      "OS",
      "Primary user",
      "Ownership",
      "Compliance",
      "Risk",
      "Last check-in",
    ],
    rows: [
      [
        "DXB-LT-10428",
        "Windows 11",
        "Nadia Almasi",
        "Corporate",
        "Compliant",
        "Low",
        "8m",
      ],
      [
        "LON-LT-08314",
        "Windows 10",
        "James Wilson",
        "Corporate",
        "Noncompliant",
        "High",
        "18d",
      ],
      [
        "DXB-MOB-6621",
        "iOS 18",
        "Li Chen",
        "Personal",
        "Compliant",
        "Medium",
        "21m",
      ],
      [
        "AUH-LT-11982",
        "Windows 11",
        "Amira Malik",
        "Corporate",
        "Compliant",
        "Low",
        "12m",
      ],
      [
        "SG-LT-04218",
        "Windows 10",
        "Elena Rossi",
        "Corporate",
        "Noncompliant",
        "High",
        "42d",
      ],
      [
        "DXB-VDI-1822",
        "Windows 11",
        "Robert Santos",
        "Corporate",
        "Compliant",
        "Medium",
        "4m",
      ],
      [
        "DXB-MOB-7814",
        "Android 15",
        "Sara Ibrahim",
        "Corporate",
        "Compliant",
        "Low",
        "16m",
      ],
      [
        "LON-LT-02991",
        "macOS 15",
        "External Audit",
        "Personal",
        "Noncompliant",
        "Medium",
        "9d",
      ],
    ],
    metrics: [
      {
        label: "Managed devices",
        value: "18,921",
        detail: "17,434 active in 30 days",
      },
      { label: "Compliance", value: "91.4%", detail: "1,487 noncompliant" },
      {
        label: "Stale check-in",
        value: "692",
        detail: "Beyond policy threshold",
      },
      {
        label: "Deployment failures",
        value: "319",
        detail: "Across 24 applications",
      },
    ],
  },
  "Defender XDR": {
    columns: [
      "Incident",
      "Severity",
      "Status",
      "Entities",
      "Owner",
      "SLA",
      "Updated",
    ],
    rows: [
      [
        "INC-4428 Suspicious forwarding",
        "Critical",
        "Investigating",
        "4",
        "Sara Ibrahim",
        "42m",
        "2m",
      ],
      [
        "INC-4422 Token replay",
        "High",
        "Contained",
        "7",
        "SOC Tier 2",
        "1h 18m",
        "9m",
      ],
      [
        "INC-4419 Malware outbreak",
        "High",
        "Remediating",
        "18",
        "Endpoint SOC",
        "2h 05m",
        "14m",
      ],
      [
        "INC-4414 Impossible travel",
        "Medium",
        "Investigating",
        "2",
        "Identity SOC",
        "3h 41m",
        "22m",
      ],
      [
        "INC-4408 Anonymous site access",
        "High",
        "Awaiting owner",
        "5",
        "Data SOC",
        "5h 12m",
        "31m",
      ],
      [
        "INC-4401 Privileged role change",
        "Medium",
        "Resolved",
        "3",
        "IAM",
        "Closed",
        "1h",
      ],
      [
        "INC-4398 C2 beacon",
        "Critical",
        "Contained",
        "9",
        "SOC Tier 3",
        "28m",
        "1h",
      ],
      [
        "INC-4392 DLP exfiltration",
        "High",
        "Investigating",
        "6",
        "Compliance SOC",
        "4h 22m",
        "2h",
      ],
    ],
    metrics: [
      { label: "Active incidents", value: "24", detail: "3 critical / 9 high" },
      { label: "Exposure score", value: "42", detail: "Improved 6 points" },
      {
        label: "Vulnerable devices",
        value: "1,108",
        detail: "84 exploitable critical CVEs",
      },
      {
        label: "Mean contain time",
        value: "38m",
        detail: "Target below 45 minutes",
      },
    ],
  },
  "Microsoft Purview": {
    columns: [
      "Control/event",
      "Solution",
      "Location",
      "Sensitive type",
      "Items",
      "Disposition",
      "Owner",
    ],
    rows: [
      [
        "Customer PII upload",
        "DLP",
        "OneDrive",
        "UAE ID",
        "14",
        "Blocked",
        "Compliance SOC",
      ],
      [
        "Retention exception",
        "Data lifecycle",
        "Exchange",
        "Regulatory mail",
        "328",
        "Review",
        "Records team",
      ],
      [
        "External sharing",
        "Information protection",
        "SharePoint",
        "Financial data",
        "42",
        "Restricted",
        "Data owner",
      ],
      [
        "Insider risk case 118",
        "Insider risk",
        "Multi-workload",
        "Behavior",
        "18",
        "Investigating",
        "IR team",
      ],
      [
        "Label downgrade",
        "Audit",
        "SharePoint",
        "Confidential",
        "7",
        "Blocked",
        "Security",
      ],
      [
        "Legal hold gap",
        "eDiscovery",
        "Exchange",
        "Case custodian",
        "3",
        "Escalated",
        "Legal",
      ],
      [
        "PCI content found",
        "DLP",
        "Teams",
        "Payment card",
        "29",
        "Blocked",
        "Compliance SOC",
      ],
      [
        "Unlabeled content",
        "Information protection",
        "OneDrive",
        "Customer data",
        "1,482",
        "Campaign",
        "Data governance",
      ],
    ],
    metrics: [
      {
        label: "DLP matches",
        value: "3,421",
        detail: "312 blocked automatically",
      },
      { label: "Label coverage", value: "87%", detail: "+4.1% this quarter" },
      {
        label: "Retention exceptions",
        value: "64",
        detail: "12 overdue decisions",
      },
      {
        label: "Evidence freshness",
        value: "98.6%",
        detail: "Within compliance SLA",
      },
    ],
  },
  "Licensing & Cost": {
    columns: [
      "Product",
      "Purchased",
      "Assigned",
      "Active",
      "Available",
      "Monthly cost",
      "Saving opportunity",
    ],
    rows: [
      [
        "Microsoft 365 E5",
        "8,500",
        "8,412",
        "7,986",
        "88",
        "$478,329",
        "$18,411",
      ],
      [
        "Microsoft 365 E3",
        "4,200",
        "3,918",
        "3,744",
        "282",
        "$141,048",
        "$7,308",
      ],
      ["Power BI Pro", "2,500", "2,438", "2,014", "62", "$34,132", "$5,936"],
      ["Teams Phone", "1,800", "1,716", "1,402", "84", "$13,728", "$2,512"],
      ["Visio Plan 2", "620", "588", "381", "32", "$8,820", "$3,105"],
      ["Project Plan 3", "410", "394", "241", "16", "$11,820", "$4,590"],
      [
        "Defender for Endpoint P2",
        "19,500",
        "18,921",
        "17,434",
        "579",
        "$97,320",
        "$7,435",
      ],
      ["Copilot for M365", "850", "842", "714", "8", "$25,260", "$3,840"],
    ],
    metrics: [
      {
        label: "Monthly spend",
        value: "$739K",
        detail: "31 subscription SKUs",
      },
      {
        label: "Assigned seats",
        value: "37,229",
        detail: "Across all products",
      },
      {
        label: "Inactive licenses",
        value: "1,463",
        detail: "Beyond policy threshold",
      },
      {
        label: "Annual opportunity",
        value: "$501K",
        detail: "Validated reclaim candidates",
      },
    ],
  },
  "Hybrid Active Directory": {
    columns: [
      "Object/connector",
      "Domain",
      "Type",
      "State",
      "Errors",
      "Last sync",
      "Owner",
    ],
    rows: [
      [
        "AEG-AADCONNECT-01",
        "northstar.example",
        "Entra Connect",
        "Healthy",
        "0",
        "3m",
        "IAM Platform",
      ],
      [
        "AEG-AADCONNECT-02",
        "northstar.example",
        "Staging",
        "Ready",
        "0",
        "8m",
        "IAM Platform",
      ],
      [
        "CN=Legacy Traders",
        "emea.northstar.example",
        "OU",
        "Attention",
        "18",
        "13m",
        "Regional IT",
      ],
      [
        "DXB-DC-01",
        "northstar.example",
        "Domain controller",
        "Healthy",
        "0",
        "1m",
        "Core Infrastructure",
      ],
      [
        "LON-DC-03",
        "emea.northstar.example",
        "Domain controller",
        "Warning",
        "4",
        "6m",
        "EMEA Infrastructure",
      ],
      [
        "Sync rule 118",
        "northstar.example",
        "Inbound rule",
        "Error",
        "23",
        "13m",
        "IAM Engineering",
      ],
      [
        "Privileged Accounts",
        "northstar.example",
        "Group",
        "Review",
        "18",
        "15m",
        "Security",
      ],
      [
        "Password hash sync",
        "All forests",
        "Feature",
        "Healthy",
        "0",
        "3m",
        "IAM Platform",
      ],
    ],
    metrics: [
      { label: "Forests", value: "3", detail: "8 domains / 42 controllers" },
      { label: "Sync success", value: "99.1%", detail: "73 object errors" },
      { label: "Replication", value: "96%", detail: "4 links require review" },
      {
        label: "Privileged stale",
        value: "18",
        detail: "Inactive admin accounts",
      },
    ],
  },
};

const fallback = templates["Microsoft Entra ID"];

export function generateCatalogueReport(
  report: CatalogueReport,
): GeneratedReport {
  const template = templates[report.workload] ?? fallback;
  return {
    id: `${report.id}-${Date.now()}`,
    name: report.name,
    workload: report.workload,
    description: report.description,
    generatedAt: new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date()),
    sourceFreshness: `${report.updated} old`,
    totalRows: report.rows,
    columns: template.columns,
    rows: template.rows,
    metrics: template.metrics,
  };
}

export function generateCustomReport(
  name: string,
  workload: string,
  columns: string[],
  rows: string[][],
): GeneratedReport {
  const template = templates[workload] ?? fallback;
  return {
    id: `CUSTOM-${Date.now()}`,
    name,
    workload,
    description: "Generated from the governed custom-report semantic model.",
    generatedAt: new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date()),
    sourceFreshness: "2 minutes old",
    totalRows: String(rows.length),
    columns,
    rows,
    metrics: template.metrics,
  };
}

function safeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "report"
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportReportExcel(report: GeneratedReport) {
  const rows = [
    [report.name],
    [`Tenant: Northstar Example Group (synthetic)`],
    [`Generated: ${report.generatedAt}`],
    [],
    ["Metric", "Value", "Detail"],
    ...report.metrics.map((metric) => [
      metric.label,
      metric.value,
      metric.detail,
    ]),
    [],
    report.columns,
    ...report.rows,
  ];
  const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#172033"/><Interior ss:Color="#E7EFFF" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="Report"><Table>${rows
    .map(
      (row, rowIndex) =>
        `<Row>${row.map((cell) => `<Cell${rowIndex === 4 || rowIndex === 10 ? ' ss:StyleID="Header"' : ""}><Data ss:Type="String">${xml(String(cell))}</Data></Cell>`).join("")}</Row>`,
    )
    .join("")}</Table></Worksheet></Workbook>`;
  download(
    new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }),
    `${safeFileName(report.name)}.xls`,
  );
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function exportReportCsv(report: GeneratedReport) {
  const content = [report.columns, ...report.rows]
    .map((row) => row.map((cell) => csvCell(String(cell))).join(","))
    .join("\r\n");
  download(new Blob([content], { type: "text/csv;charset=utf-8" }), `${safeFileName(report.name)}.csv`);
}

export function exportReportHtml(report: GeneratedReport) {
  const table = `<table><thead><tr>${report.columns.map((column) => `<th>${xml(column)}</th>`).join("")}</tr></thead><tbody>${report.rows.map((row) => `<tr>${row.map((cell) => `<td>${xml(String(cell))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const content = `<!doctype html><html><head><meta charset="utf-8"><title>${xml(report.name)}</title><style>body{font:14px Segoe UI,Arial;color:#172033;padding:32px}h1{color:#0b1730}table{border-collapse:collapse;width:100%;margin-top:24px}th{background:#e7efff;text-align:left}th,td{border:1px solid #d5dfeb;padding:8px}small{color:#53637a}</style></head><body><h1>${xml(report.name)}</h1><small>Generated locally · ${xml(report.generatedAt)} · ${xml(report.workload)}</small>${table}</body></html>`;
  download(new Blob([content], { type: "text/html;charset=utf-8" }), `${safeFileName(report.name)}.html`);
}

export function exportReportRaw(report: GeneratedReport) {
  const payload = {
    schema: "aegis.report.raw.v1",
    generatedLocally: true,
    report,
  };
  download(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }), `${safeFileName(report.name)}.raw.json`);
}

function ascii(value: string) {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
}

export async function exportReportPdf(report: GeneratedReport) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 36;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const drawHeader = () => {
    page.drawRectangle({
      x: 0,
      y: pageHeight - 72,
      width: pageWidth,
      height: 72,
      color: rgb(0.043, 0.09, 0.188),
    });
    page.drawText(ascii(report.name).slice(0, 95), {
      x: margin,
      y: pageHeight - 36,
      size: 17,
      font: bold,
      color: rgb(1, 1, 1),
    });
    page.drawText(
      `Northstar Example Group (synthetic) | ${ascii(report.workload)} | ${ascii(report.generatedAt)}`,
      {
        x: margin,
        y: pageHeight - 55,
        size: 8,
        font: regular,
        color: rgb(0.725, 0.847, 1),
      },
    );
    y = pageHeight - 94;
  };
  drawHeader();
  const metricWidth = (pageWidth - margin * 2 - 18) / 4;
  report.metrics.slice(0, 4).forEach((metric, index) => {
    const x = margin + index * (metricWidth + 6);
    page.drawRectangle({
      x,
      y: y - 50,
      width: metricWidth,
      height: 50,
      color: rgb(0.953, 0.965, 0.984),
      borderColor: rgb(0.835, 0.875, 0.922),
      borderWidth: 0.5,
    });
    page.drawText(ascii(metric.label).slice(0, 24), {
      x: x + 8,
      y: y - 14,
      size: 7,
      font: bold,
      color: rgb(0.325, 0.388, 0.478),
    });
    page.drawText(ascii(metric.value), {
      x: x + 8,
      y: y - 31,
      size: 14,
      font: bold,
      color: rgb(0.145, 0.388, 0.922),
    });
    page.drawText(ascii(metric.detail).slice(0, 31), {
      x: x + 8,
      y: y - 43,
      size: 6,
      font: regular,
      color: rgb(0.439, 0.506, 0.596),
    });
  });
  y -= 72;
  const colWidth = (pageWidth - margin * 2) / report.columns.length;
  const drawTableHeader = () => {
    page.drawRectangle({
      x: margin,
      y: y - 22,
      width: pageWidth - margin * 2,
      height: 22,
      color: rgb(0.114, 0.306, 0.847),
    });
    report.columns.forEach((column, index) =>
      page.drawText(ascii(column).slice(0, 18), {
        x: margin + index * colWidth + 4,
        y: y - 14,
        size: 6.5,
        font: bold,
        color: rgb(1, 1, 1),
      }),
    );
    y -= 22;
  };
  drawTableHeader();
  report.rows.forEach((row, rowIndex) => {
    if (y < 48) {
      page = pdf.addPage([pageWidth, pageHeight]);
      drawHeader();
      drawTableHeader();
    }
    page.drawRectangle({
      x: margin,
      y: y - 21,
      width: pageWidth - margin * 2,
      height: 21,
      color: rowIndex % 2 ? rgb(0.969, 0.976, 0.988) : rgb(1, 1, 1),
      borderColor: rgb(0.882, 0.91, 0.941),
      borderWidth: 0.3,
    });
    row.forEach((cell, index) =>
      page.drawText(ascii(String(cell)).slice(0, 21), {
        x: margin + index * colWidth + 4,
        y: y - 14,
        size: 6.4,
        font: regular,
        color: rgb(0.09, 0.125, 0.2),
      }),
    );
    y -= 21;
  });
  page.drawText(
    "Synthetic demonstration data | Confidential | Generated locally",
    { x: margin, y: 20, size: 7, font: regular, color: rgb(0.4, 0.463, 0.518) },
  );
  const bytes = await pdf.save();
  download(
    new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    `${safeFileName(report.name)}.pdf`,
  );
}

export function dashboardFor(workload: string) {
  return templates[workload] ?? fallback;
}
