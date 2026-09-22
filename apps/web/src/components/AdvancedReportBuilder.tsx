"use client";

import { useMemo, useState } from "react";
import { ArrowDownload24Regular, DocumentBulletList24Regular, Eye24Regular, Filter24Regular, Save24Regular } from "@fluentui/react-icons";
import {
  columnCatalog,
  tables,
  type Filter,
  type FilterOp,
  type PortalTables,
  type ReportDef,
} from "@/data/portal";
import { computeRows, columnsFor, toGeneratedReport } from "@/lib/portal-engine";
import { exportReportCsv, exportReportExcel, exportReportPdf } from "@/lib/reporting";

type Source = keyof PortalTables;

const sourceLabels: Record<Source, string> = {
  users: "Entra users",
  mailboxes: "Exchange mailboxes",
  teams: "Microsoft Teams",
  sites: "SharePoint sites",
  drives: "OneDrive accounts",
  devices: "Intune managed devices",
  distributionGroups: "Exchange distribution groups",
  groupMembers: "Group members & owners",
  caPolicies: "Conditional Access policies",
  auditEvents: "Unified audit events",
  signIns: "Entra sign-ins",
};

const operators: Array<{ value: FilterOp; label: string }> = [
  { value: "equals", label: "equals" },
  { value: "not", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "gt", label: "is greater than" },
  { value: "lt", label: "is less than" },
];

function displayValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

export function AdvancedReportBuilder({ notify }: { notify: (message: string) => void }) {
  const [source, setSource] = useState<Source>("users");
  const [name, setName] = useState("Privileged access review");
  const [selected, setSelected] = useState<string[]>(["displayName", "upn", "adminRole", "mfaStatus", "lastSignIn"]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterColumn, setFilterColumn] = useState("adminRole");
  const [filterOperator, setFilterOperator] = useState<FilterOp>("not");
  const [filterValue, setFilterValue] = useState("—");
  const [saved, setSaved] = useState(false);

  const fields = columnCatalog[source];
  const definition = useMemo<ReportDef>(() => ({
    id: "advanced-builder-preview",
    name: name.trim() || "Untitled advanced report",
    service: "Reporter 360",
    plane: "reports",
    category: "Advanced report builder",
    description: `Ad hoc report built from ${sourceLabels[source]}.`,
    source,
    columns: selected,
  }), [name, selected, source]);
  const columns = useMemo(() => columnsFor(definition, selected), [definition, selected]);
  const rows = useMemo(() => computeRows(definition, filters, []), [definition, filters]);

  const changeSource = (next: Source) => {
    const nextFields = columnCatalog[next];
    const defaults = nextFields.slice(0, Math.min(6, nextFields.length)).map((field) => field.key);
    setSource(next);
    setSelected(defaults);
    setFilters([]);
    setFilterColumn(defaults[0]);
    setFilterOperator("equals");
    setFilterValue("");
    setSaved(false);
  };
  const toggleField = (field: string) => {
    setSelected((current) => current.includes(field)
      ? current.length > 1 ? current.filter((item) => item !== field) : current
      : [...current, field]);
    setSaved(false);
  };
  const addFilter = () => {
    if (!filterValue.trim()) { notify("Enter a value before adding a filter."); return; }
    setFilters((current) => [...current, { column: filterColumn, op: filterOperator, value: filterValue.trim() }]);
    setFilterValue("");
    setSaved(false);
  };
  const exportRows = async (format: "csv" | "xlsx" | "pdf") => {
    const report = toGeneratedReport(definition, columns, rows);
    if (format === "csv") exportReportCsv(report);
    if (format === "xlsx") exportReportExcel(report);
    if (format === "pdf") await exportReportPdf(report);
    notify(`${format.toUpperCase()} export generated with ${rows.length.toLocaleString()} records.`);
  };

  return (
    <section className="pr-builder" data-testid="portal-builder">
      <header className="pr-page-head">
        <div>
          <h1>Advanced report builder</h1>
          <p>Compose operational reports from Entra, Exchange, Teams, SharePoint, Intune, audit, and membership evidence. Every preview uses the same governed filter and export pipeline as the catalogue.</p>
        </div>
        <div className="pr-head-actions">
          <button className="pr-btn" onClick={() => notify("Preview refreshed. Connect a tenant to return records.")} data-testid="portal-builder-preview"><Eye24Regular /> Refresh preview</button>
          <button className="pr-btn pr-primary" onClick={() => { setSaved(true); notify(`Saved “${definition.name}” to this browser.`); }} data-testid="portal-builder-save"><Save24Regular /> {saved ? "Saved" : "Save definition"}</button>
        </div>
      </header>

      <div className="pr-builder-layout">
        <aside className="pr-builder-config">
          <label>Report name<input value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} data-testid="portal-builder-name" /></label>
          <label>Data source
            <select value={source} onChange={(event) => changeSource(event.target.value as Source)} data-testid="portal-builder-source">
              {Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <div className="pr-builder-section">
            <b><DocumentBulletList24Regular /> Fields <span>{selected.length}</span></b>
            <div className="pr-field-list">
              {fields.map((field) => <label key={field.key}><input type="checkbox" checked={selected.includes(field.key)} onChange={() => toggleField(field.key)} /> {field.label}</label>)}
            </div>
          </div>
          <div className="pr-builder-section">
            <b><Filter24Regular /> Conditions <span>{filters.length}</span></b>
            <div className="pr-builder-filter">
              <select value={filterColumn} onChange={(event) => setFilterColumn(event.target.value)} data-testid="portal-builder-filter-column">
                {fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
              </select>
              <select value={filterOperator} onChange={(event) => setFilterOperator(event.target.value as FilterOp)} data-testid="portal-builder-filter-operator">
                {operators.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}
              </select>
              <input value={filterValue} onChange={(event) => setFilterValue(event.target.value)} placeholder="Value" data-testid="portal-builder-filter-value" />
              <button className="pr-btn" type="button" onClick={addFilter} data-testid="portal-builder-filter-add">Add condition</button>
            </div>
            {filters.length > 0 && <div className="pr-builder-chips">{filters.map((filter, index) => <button key={`${filter.column}-${index}`} className="pr-chip pr-filter" onClick={() => { setFilters((current) => current.filter((_, candidate) => candidate !== index)); setSaved(false); }}>{fields.find((field) => field.key === filter.column)?.label ?? filter.column} {filter.op} {filter.value} ×</button>)}</div>}
          </div>
        </aside>

        <div className="pr-builder-preview">
          <div className="pr-builder-preview-head">
            <div><span>LIVE PREVIEW</span><h2>{definition.name}</h2><p>{rows.length.toLocaleString()} records · {columns.length} fields · {sourceLabels[source]}</p></div>
            <div className="pr-export-inline">
              <button className="pr-btn" onClick={() => void exportRows("csv")} data-testid="portal-builder-export-csv"><ArrowDownload24Regular /> CSV</button>
              <button className="pr-btn" onClick={() => void exportRows("xlsx")} data-testid="portal-builder-export-xlsx">Excel</button>
              <button className="pr-btn" onClick={() => void exportRows("pdf")} data-testid="portal-builder-export-pdf">PDF</button>
            </div>
          </div>
          <div className="pr-grid-wrap">
            <table className="pr-grid"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
              <tbody>{rows.slice(0, 12).map((row, index) => <tr key={index}>{columns.map((column) => <td key={column.key}>{displayValue(row[column.key])}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {rows.length > 12 && <p className="pr-builder-more">Showing 12 of {rows.length.toLocaleString()} results. Exports contain the full result set.</p>}
        </div>
      </div>
    </section>
  );
}
