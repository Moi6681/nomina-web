import { useEffect, useMemo, useState } from "react";
import type { Shift } from "../core/types";
import { importQuadranteMatrixAuto, listSheets } from "../core/importers/quadranteMatrixAuto";

type Props = {
  /** El mes de devengo (variables) que necesita el sistema, formato YYYY-MM */
  requiredDevengoYm: string | null;
  onLoaded: (data: {
    employees: string[];
    shifts: Shift[];
    detectedYm: string; // YYYY-MM detectado (sheet)
    sheetName: string;
  }) => void;
};

function monthNameEsUpper(month: number): string {
  const names = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
  ];
  return names[month - 1] ?? "";
}

function ymToSheetName(ym: string): string {
  const m = Number(ym.split("-")[1]);
  return monthNameEsUpper(m);
}

export default function ImportQuadrante({ requiredDevengoYm, onLoaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [autoSheet, setAutoSheet] = useState<string>("");

  const requiredSheet = useMemo(() => {
    if (!requiredDevengoYm) return "";
    return ymToSheetName(requiredDevengoYm);
  }, [requiredDevengoYm]);

  // Cargar lista de hojas al seleccionar archivo
  useEffect(() => {
    if (!file) {
      setSheets([]);
      setAutoSheet("");
      setStatus("");
      return;
    }
    setStatus("Leyendo archivo...");
    listSheets(file)
      .then((r) => {
        setSheets(r.sheetNames);
        setStatus("");
      })
      .catch((e) => setStatus(`Error: ${e?.message ?? String(e)}`));
  }, [file]);

  // Elegir automáticamente la hoja del mes requerido
  useEffect(() => {
    if (!file) return;
    if (!requiredSheet) return;
    if (!sheets.length) return;

    const match = sheets.find((s) => s.toUpperCase().includes(requiredSheet));
    if (!match) {
      setAutoSheet("");
      setStatus(`No encuentro la hoja "${requiredSheet}" en el Excel. Hojas: ${sheets.join(", ")}`);
      return;
    }

    setAutoSheet(match);
    setStatus("");
  }, [file, sheets, requiredSheet]);

  async function handleImport() {
    if (!file) return;
    if (!autoSheet) {
      setStatus("Selecciona un archivo que contenga la hoja del mes requerido.");
      return;
    }
    setStatus(`Importando ${autoSheet}...`);
    try {
      const res = await importQuadranteMatrixAuto(file, { sheetName: autoSheet });
      const detectedYm = `${res.detected.year}-${String(res.detected.month).padStart(2, "0")}`;
      setStatus(`OK: ${res.employees.length} empleados, ${res.shifts.length} turnos. Devengo: ${detectedYm}`);
      onLoaded({ employees: res.employees, shifts: res.shifts, detectedYm, sheetName: autoSheet });
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
        Importar cuadrante (XLS/XLSX)
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <button onClick={handleImport} disabled={!file || !autoSheet}>
          Importar
        </button>

        {file && requiredSheet && (
          <div style={{ fontSize: 12, opacity: 0.75, paddingBottom: 4 }}>
            {autoSheet ? (
              <>Hoja automática: <b>{autoSheet}</b></>
            ) : (
              <>Buscando hoja: <b>{requiredSheet}</b></>
            )}
          </div>
        )}
      </div>

      {status && <div style={{ marginTop: 10, opacity: 0.85, whiteSpace: "pre-wrap" }}>{status}</div>}
    </div>
  );
}