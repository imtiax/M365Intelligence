// Shared, pure report engine for the Reporter 360 portal. Used by the report
// viewer, scheduled deliveries, alert evaluation, and the E2E smoke suite so
// every surface computes rows through one pipeline.

import {
  columnCatalog,
  reportCatalog,
  tables,
  type Column,
  type Filter,
  type ReportDef,
  type Row,
  type SortSpec,
} from "@/data/portal";
import type { GeneratedReport } from "@/lib/reporting";

export function columnTypeFor(def: ReportDef, key: string): Column["type"] {
  return columnCatalog[def.source].find((c) => c.key === key)?.type ?? "text";
}

export function columnsFor(def: ReportDef, keys: string[]): Column[] {
  const catalog = columnCatalog[def.source];
  return keys.map((key) => catalog.find((c) => c.key === key)).filter((c): c is Column => !!c);
}

export function applyFilter(row: Row, f: Filter, type: Column["type"]): boolean {
  const raw = row[f.column];
  if (raw === undefined) return false;
  if (f.op === "gt" || f.op === "lt") {
    const a = Number(raw); const b = Number(f.value);
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    return f.op === "gt" ? a > b : a < b;
  }
  const s = String(raw).toLowerCase(); const v = f.value.toLowerCase();
  if (f.op === "contains") return s.includes(v);
  if (f.op === "not") return s !== v;
  if (type === "number") return Number(raw) === Number(f.value);
  return s === v;
}

export function sortRows(rows: Row[], sort: SortSpec[]): Row[] {
  if (!sort.length) return rows;
  return [...rows].sort((a, b) => {
    for (const s of sort) {
      const av = a[s.column]; const bv = b[s.column];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}

/** Base rows for a report (source table + the report's built-in filters). */
export function baseRows(def: ReportDef): Row[] {
  let rows = tables[def.source];
  for (const f of def.baseFilters ?? []) rows = rows.filter((row) => applyFilter(row, f, columnTypeFor(def, f.column)));
  return rows;
}

/** Full pipeline: base filters → user filters → sort. */
export function computeRows(def: ReportDef, filters: Filter[], sort: SortSpec[]): Row[] {
  let rows = baseRows(def);
  for (const f of filters) rows = rows.filter((row) => applyFilter(row, f, columnTypeFor(def, f.column)));
  return sortRows(rows, sort);
}

export function findReport(id: string): ReportDef | undefined {
  return reportCatalog.find((d) => d.id === id);
}

export function describeFilter(def: ReportDef, f: Filter): string {
  const label = columnCatalog[def.source].find((c) => c.key === f.column)?.label ?? f.column;
  const op = f.op === "equals" ? "=" : f.op === "not" ? "≠" : f.op === "gt" ? ">" : f.op === "lt" ? "<" : "contains";
  return `${label} ${op} ${f.value}`;
}

/** Adapts a portal result set to the platform's GeneratedReport contract so the
 *  existing CSV/XLSX/PDF/HTML/JSON exporters produce real files. */
export function toGeneratedReport(def: ReportDef, columns: Column[], rows: Row[], windowLabel?: string): GeneratedReport {
  return {
    id: `${def.id}-${Date.now()}`,
    name: def.name,
    workload: def.service,
    description: def.description,
    generatedAt: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(new Date()),
    sourceFreshness: "2 minutes old",
    totalRows: String(rows.length),
    columns: columns.map((c) => c.label),
    rows: rows.map((row) => columns.map((c) => String(row[c.key] ?? ""))),
    metrics: [
      { label: "Records", value: String(rows.length), detail: `of ${baseRows(def).length} in scope` },
      { label: "Service", value: def.service, detail: def.category },
      { label: "Data window", value: windowLabel ?? "Point in time", detail: "Auto-scoped by schedule" },
      { label: "Source", value: "Synthetic twin", detail: "Deterministic demo tenant" },
    ],
  };
}

/** Deterministic 30-day pseudo-history of a report metric, for alert previews
 *  and trend-comparison evaluation. */
export function metricHistory(reportId: string, current: number): number[] {
  let seed = 2166136261;
  for (let i = 0; i < reportId.length; i++) { seed ^= reportId.charCodeAt(i); seed = Math.imul(seed, 16777619); }
  seed >>>= 0;
  const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const out: number[] = [];
  for (let i = 0; i < 30; i++) {
    const wave = Math.sin((i / 30) * Math.PI * 2) * 0.12;
    const spike = i === 22 ? 0.65 : 0;
    out.push(Math.max(0, Math.round(current * (0.82 + wave + next() * 0.3 + spike))));
  }
  return out;
}

export type AlertLike = {
  mode: "Threshold" | "Trend comparison";
  operator: "above" | "below";
  threshold: number;
  trendPercent: number;
};

/** Live evaluation of an alert policy against the current metric value. */
export function evaluateAlertPolicy(policy: AlertLike, reportId: string, currentValue: number): { fired: boolean; detail: string } {
  if (policy.mode === "Threshold") {
    const fired = policy.operator === "above" ? currentValue > policy.threshold : currentValue < policy.threshold;
    return { fired, detail: `count ${currentValue} is ${fired ? "" : "not "}${policy.operator} ${policy.threshold}` };
  }
  const history = metricHistory(reportId, Math.max(currentValue, 4));
  const prior = history[history.length - 8];
  const change = prior > 0 ? ((currentValue - prior) / prior) * 100 : 100;
  const fired = change >= policy.trendPercent;
  return { fired, detail: `${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs same day last week (${prior} → ${currentValue})` };
}

export function scheduleWindowLabel(frequency: string): string {
  const day = 86_400_000;
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  if (frequency === "Daily") return `yesterday (${iso(Date.now() - day)})`;
  if (frequency === "Weekly") return `last 7 days (${iso(Date.now() - 7 * day)} → ${iso(Date.now() - day)})`;
  return "previous calendar month";
}
