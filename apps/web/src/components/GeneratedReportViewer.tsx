"use client";

import { useState } from "react";
import {
  ArrowDownload24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  DocumentPdf24Regular,
  Table24Regular,
} from "@fluentui/react-icons";
import {
  exportReportExcel,
  exportReportPdf,
  type GeneratedReport,
} from "@/lib/reporting";

export function GeneratedReportViewer({
  report,
  onClose,
  notify,
}: {
  report: GeneratedReport;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const filtered = report.rows.filter((row) =>
    row.join(" ").toLowerCase().includes(search.toLowerCase()),
  );
  const pdf = async () => {
    setExporting("pdf");
    try {
      await exportReportPdf(report);
      notify(`${report.name} downloaded as PDF.`);
    } finally {
      setExporting(null);
    }
  };
  const excel = () => {
    setExporting("excel");
    exportReportExcel(report);
    notify(`${report.name} downloaded as an Excel workbook.`);
    setExporting(null);
  };
  return (
    <div className="generated-report-backdrop" onMouseDown={onClose}>
      <section
        className="generated-report"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <small>GENERATED REPORT / {report.workload.toUpperCase()}</small>
            <h2>{report.name}</h2>
            <p>{report.description}</p>
          </div>
          <div className="generated-actions">
            <button onClick={pdf} disabled={exporting !== null}>
              <DocumentPdf24Regular />
              {exporting === "pdf" ? "Preparing PDF..." : "Download PDF"}
            </button>
            <button onClick={excel} disabled={exporting !== null}>
              <Table24Regular />
              {exporting === "excel" ? "Preparing Excel..." : "Download Excel"}
            </button>
            <button
              className="close-generated"
              onClick={onClose}
              aria-label="Close generated report"
            >
              <Dismiss24Regular />
            </button>
          </div>
        </header>
        <div className="generated-meta">
          <span>
            <CheckmarkCircle24Regular />
            <b>Completed</b>
            <small>{report.generatedAt}</small>
          </span>
          <span>
            <b>{report.totalRows}</b>
            <small>Total matching rows</small>
          </span>
          <span>
            <b>{report.sourceFreshness}</b>
            <small>Source freshness</small>
          </span>
          <span>
            <b>{report.id}</b>
            <small>Audited execution ID</small>
          </span>
        </div>
        <div className="generated-metrics">
          {report.metrics.map((metric) => (
            <article key={metric.label}>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
              <span>{metric.detail}</span>
            </article>
          ))}
        </div>
        <div className="generated-toolbar">
          <label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter generated rows..."
            />
          </label>
          <span>
            {filtered.length} preview rows of {report.totalRows}
          </span>
          <button onClick={excel}>
            <ArrowDownload24Regular />
            Export current result
          </button>
        </div>
        <div className="generated-table-wrap">
          <table>
            <thead>
              <tr>
                {report.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={`${row[0]}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer>
          <span>Classification: Confidential · Synthetic demo data</span>
          <span>
            Tenant boundary and export policy applied · Execution audited
          </span>
        </footer>
      </section>
    </div>
  );
}
