import * as XLSX from "xlsx";
import type { Shift, ShiftCode } from "../types";

function norm(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

/** Meses en español (por nombre de hoja) */
const MONTHS_ES: Record<string, number> = {
  ENERO: 1,
  FEBRERO: 2,
  MARZO: 3,
  ABRIL: 4,
  MAYO: 5,
  JUNIO: 6,
  JULIO: 7,
  AGOSTO: 8,
  SEPTIEMBRE: 9,
  SETIEMBRE: 9,
  OCTUBRE: 10,
  NOVIEMBRE: 11,
  DICIEMBRE: 12,
};

function guessYearFromName(name: string): number | null {
  const m = name.match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

function guessMonthFromSheet(sheet: string): number | null {
  const up = sheet.toUpperCase();
  for (const k of Object.keys(MONTHS_ES)) {
    if (up.includes(k)) return MONTHS_ES[k];
  }
  return null;
}

function parseCode(cell: string): ShiftCode | null {
  const c = cell.toUpperCase();
  if (c === "M" || c === "T" || c === "N" || c === "L" || c === "DC") return c;
  return null;
}

/**
 * Parseo de horas MUY tolerante.
 * Acepta:
 * - "15/01" -> "15:00-01:00"
 * - "15-01"
 * - "15:00-01:00"
 * - "15.00-01.30"
 * - "1500-0130"
 * - "15:00/01:00" (se normaliza)
 */
function parseHours(cell: string): { start: string; end: string } | null {
  let s = cell.trim();
  if (!s) return null;

  // Normaliza separadores y espacios
  s = s.replace(/\s+/g, "");
  s = s.replace(/a/gi, "-");
  s = s.replace(/\//g, "-");

  // Caso "15-01" o "15:00-01:00" o "15.00-01.30"
  const m1 = s.match(/^(\d{1,2})([:.](\d{2}))?-(\d{1,2})([:.](\d{2}))?$/);
  if (m1) {
    const sh = Number(m1[1]);
    const sm = m1[3] ? Number(m1[3]) : 0;
    const eh = Number(m1[4]);
    const em = m1[6] ? Number(m1[6]) : 0;

    const start = `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`;
    const end = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    return { start, end };
  }

  // Caso "1500-0130"
  const m2 = s.match(/^(\d{2})(\d{2})-(\d{2})(\d{2})$/);
  if (m2) {
    const start = `${m2[1]}:${m2[2]}`;
    const end = `${m2[3]}:${m2[4]}`;
    return { start, end };
  }

  return null;
}

function isDayHeaderToken(s: string): boolean {
  if (/^\d{1,2}$/.test(s)) {
    const n = Number(s);
    return n >= 1 && n <= 31;
  }
  return false;
}

export async function listSheets(file: File): Promise<{ sheetNames: string[] }> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  return { sheetNames: wb.SheetNames };
}

export async function importQuadranteMatrixAuto(
  file: File,
  opts: { sheetName: string }
): Promise<{
  employees: string[];
  shifts: Shift[];
  detected: {
    headerRowIndex: number;
    employeeCol: number;
    dayStartCol: number;
    dayColsCount: number;
    year: number;
    month: number;
  };
}> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  const ws = wb.Sheets[opts.sheetName];
  if (!ws) throw new Error("Hoja no encontrada");

  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

  // 1) Detectar fila cabecera (más tokens 1..31)
  let bestRow = -1;
  let bestScore = 0;
  let bestDayStartCol = 0;

  for (let r = 0; r < Math.min(rows.length, 120); r++) {
    const row = rows[r] ?? [];
    let score = 0;
    let first = -1;

    for (let c = 0; c < row.length; c++) {
      const token = norm(row[c]);
      if (!token) continue;
      if (isDayHeaderToken(token)) {
        score++;
        if (first === -1) first = c;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
      bestDayStartCol = first === -1 ? 0 : first;
    }
  }

  if (bestRow === -1 || bestScore < 10) {
    throw new Error("No se pudo detectar la fila cabecera de días (1..31).");
  }

  const headerRowIndex = bestRow;
  const dayStartCol = bestDayStartCol;
  const header = rows[headerRowIndex] ?? [];

  // 2) Contar columnas de día (hasta que deje de haber 1..31)
  let dayColsCount = 0;
  for (let c = dayStartCol; c < header.length; c++) {
    const token = norm(header[c]);
    if (!token) break;
    if (!isDayHeaderToken(token)) break;
    dayColsCount++;
  }

  // 3) Detectar columna empleado antes de día1
  let employeeCol = 0;
  for (let c = 0; c < dayStartCol; c++) {
    let filled = 0;
    for (let r = headerRowIndex + 1; r < Math.min(rows.length, headerRowIndex + 40); r++) {
      if (norm(rows[r]?.[c])) filled++;
    }
    if (filled >= 3) {
      employeeCol = c;
      break;
    }
  }

  // 4) Año/mes deducidos
  const year = guessYearFromName(file.name) ?? 2026;
  const month = guessMonthFromSheet(opts.sheetName) ?? 1;

  // 5) Parsear turnos
  const employees: string[] = [];
  const shifts: Shift[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const employeeName = norm(row[employeeCol]);
    if (!employeeName) continue;
    if (/total/i.test(employeeName)) continue;

    employees.push(employeeName);

    for (let i = 0; i < dayColsCount; i++) {
      const c = dayStartCol + i;
      const rawCell = norm(row[c]);
      if (!rawCell) continue;

      const day = i + 1;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const code = parseCode(rawCell);
      if (code) {
        shifts.push({ empleadoId: employeeName, date, code });
        continue;
      }

      const hours = parseHours(rawCell);
      if (hours) {
        shifts.push({ empleadoId: employeeName, date, start: hours.start, end: hours.end });
        continue;
      }

      shifts.push({
        empleadoId: employeeName,
        date,
        start: "00:00",
        end: "00:00",
        note: `NO_PARSE:${rawCell}`,
      });
    }
  }

  return {
    employees: Array.from(new Set(employees)),
    shifts,
    detected: { headerRowIndex, employeeCol, dayStartCol, dayColsCount, year, month },
  };
}