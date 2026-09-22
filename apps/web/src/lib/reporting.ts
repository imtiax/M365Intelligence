export type ReportMetric = { label: string; value: string; detail: string };
export type GeneratedReport = {
  id: string; name: string; workload: string; description: string; generatedAt: string;
  sourceFreshness: string; totalRows: string; columns: string[]; rows: string[][]; metrics: ReportMetric[];
};

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "report";
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function csvCell(value: string) { return `"${value.replaceAll('"', '""')}"`; }

export function generateCustomReport(name: string, workload: string, columns: string[], rows: string[][]): GeneratedReport {
  return {
    id: `CUSTOM-${Date.now()}`, name, workload,
    description: "Generated from the governed custom-report semantic model.",
    generatedAt: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(new Date()),
    sourceFreshness: "No tenant connector configured", totalRows: String(rows.length), columns, rows, metrics: [],
  };
}

export function exportReportExcel(report: GeneratedReport) {
  const rows = [[report.name], ["Tenant: Not connected"], [`Generated: ${report.generatedAt}`], [], report.columns, ...report.rows];
  const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Report" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Table>${rows.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${xml(String(cell))}</Data></Cell>`).join("")}</Row>`).join("")}</Table></Worksheet></Workbook>`;
  download(new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }), `${safeFileName(report.name)}.xls`);
}
export function exportReportCsv(report: GeneratedReport) {
  const content = [report.columns, ...report.rows].map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\r\n");
  download(new Blob([content], { type: "text/csv;charset=utf-8" }), `${safeFileName(report.name)}.csv`);
}
export function exportReportHtml(report: GeneratedReport) {
  const table = `<table><thead><tr>${report.columns.map((column) => `<th>${xml(column)}</th>`).join("")}</tr></thead><tbody>${report.rows.map((row) => `<tr>${row.map((cell) => `<td>${xml(String(cell))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const content = `<!doctype html><html><head><meta charset="utf-8"><title>${xml(report.name)}</title><style>body{font:14px Segoe UI,Arial;color:#172033;padding:32px}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border:1px solid #d5dfeb;padding:8px;text-align:left}</style></head><body><h1>${xml(report.name)}</h1><p>Tenant: Not connected · Generated locally</p>${table}</body></html>`;
  download(new Blob([content], { type: "text/html;charset=utf-8" }), `${safeFileName(report.name)}.html`);
}
export function exportReportRaw(report: GeneratedReport) {
  download(new Blob([JSON.stringify({ schema: "m365intelligence.report.raw.v1", generatedLocally: true, report }, null, 2)], { type: "application/json;charset=utf-8" }), `${safeFileName(report.name)}.raw.json`);
}
export async function exportReportPdf(report: GeneratedReport) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText(report.name.slice(0, 95), { x: 36, y: 548, size: 18, font: bold, color: rgb(0.04, 0.09, 0.19) });
  page.drawText(`Tenant: Not connected | ${report.workload} | ${report.generatedAt}`.slice(0, 150), { x: 36, y: 528, size: 9, font, color: rgb(0.3, 0.38, 0.49) });
  if (!report.rows.length) page.drawText("No records are available until a tenant connector is configured.", { x: 36, y: 486, size: 12, font });
  const bytes = await pdf.save();
  download(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), `${safeFileName(report.name)}.pdf`);
}
export function dashboardFor(workload: string) {
  void workload;
  return { columns: [], rows: [], metrics: [] as ReportMetric[] };
}
