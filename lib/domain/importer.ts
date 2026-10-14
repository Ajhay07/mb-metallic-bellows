// Simplified CSV import pipeline for the ERP Integration Centre demo. This is a
// real (if intentionally minimal) implementation: it parses actual CSV text,
// validates each row, and — on commit — updates the in-memory material master.
// It does not talk to any external ERP system (see README for what a real
// adapter would require).
import { store } from "@/lib/data/store";

export interface ParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
}

const REQUIRED_MATERIAL_COLUMNS = ["code", "reorderPoint", "safetyStock", "unitCost", "leadTimeDays"];
const NUMERIC_COLUMNS = ["reorderPoint", "safetyStock", "unitCost", "leadTimeDays"];

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h.trim()] = (values[i] ?? "").trim()));
    return row;
  });
  return { headers, rows };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function validateMaterialsImport(text: string): { rows: ParsedRow[]; validCount: number; errorCount: number } {
  const { rows } = parseCsv(text);
  const parsed: ParsedRow[] = rows.map((raw, i) => {
    const errors: string[] = [];
    for (const col of REQUIRED_MATERIAL_COLUMNS) {
      if (!raw[col]) errors.push(`Missing required field '${col}'`);
    }
    for (const col of NUMERIC_COLUMNS) {
      if (raw[col] && Number.isNaN(Number(raw[col]))) errors.push(`Field '${col}' must be numeric (got '${raw[col]}')`);
    }
    if (raw.code && !store.materials.find((m) => m.code === raw.code)) {
      errors.push(`Unknown material code '${raw.code}' — this demo importer only updates existing materials, it does not create new ones`);
    }
    return { rowNumber: i + 2, raw, errors };
  });
  const errorCount = parsed.filter((r) => r.errors.length > 0).length;
  return { rows: parsed, validCount: parsed.length - errorCount, errorCount };
}

export function commitMaterialsImport(text: string, importedBy: string, fileName: string) {
  const { rows, validCount, errorCount } = validateMaterialsImport(text);
  let applied = 0;
  for (const row of rows) {
    if (row.errors.length > 0) continue;
    const material = store.materials.find((m) => m.code === row.raw.code);
    if (!material) continue;
    material.reorderPoint = Number(row.raw.reorderPoint);
    material.safetyStock = Number(row.raw.safetyStock);
    material.unitCost = Number(row.raw.unitCost);
    material.leadTimeDays = Number(row.raw.leadTimeDays);
    applied++;
  }

  const batch = {
    id: `IMP-${Date.now()}`,
    fileName,
    importedAt: new Date().toISOString(),
    importedBy,
    recordType: "Materials",
    rowCount: rows.length,
    validRows: validCount,
    errorRows: errorCount,
    status: errorCount > 0 ? ("Failed Validation" as const) : ("Validated" as const),
    errors: rows.filter((r) => r.errors.length > 0).map((r) => `Row ${r.rowNumber}: ${r.errors.join("; ")}`),
  };
  store.importBatches.unshift(batch);
  return { batch, applied };
}
