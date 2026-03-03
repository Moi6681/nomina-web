import { useMemo, useState } from "react";
import ImportQuadrante from "./components/ImportQuadrante";
import EmployeeProfileEditor from "./components/EmployeeProfileEditor";
import type { EmployeeMiniProfile } from "./components/EmployeeProfileEditor";

import { buildPayrollSlip } from "./core/payroll";
import type { CalendarConfig } from "./core/calendar";
import type { EmployeeProfile, Shift } from "./core/types";
import { salaryTable } from "./core/salaryTable";

// ===== Empresa =====
const EMPRESA = {
  nombre: "Institución Ferial de Madrid (IFEMA)",
  cif: "Q2873018B",
  domicilio: "PATENON, Num: 5",
  cp: "28042",
  ciudad: "Madrid",
};

// ===== Calendario (demo) =====
const calendar: CalendarConfig = {
  intensivaRanges: [{ start: "2026-06-15", end: "2026-08-31" }],
  intensivaDays: ["2026-01-05"],
  special815Days: [],
  festivos: [
    "2026-01-01",
    "2026-01-06",
    "2026-04-02",
    "2026-04-03",
    "2026-05-01",
    "2026-05-02",
    "2026-05-15",
    "2026-08-15",
    "2026-10-12",
    "2026-11-01",
    "2026-11-09",
    "2026-12-06",
    "2026-12-08",
    "2026-12-25",
    "2026-12-31",
  ],
};

// ===== Rates variables =====
const DEFAULT_RATES = {
  plusSabDomFestivo: 6.79,
  plusNocturnidad: 6.79,
  complementoFestivo: 77.38,
  complementoNocturno: 30.23,
  horaComplLaboral: 47.51,
  horaComplFestiva: 54.3,
  dietaComida: 11.0,
};

// ===== Helpers =====
function euro(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function addMonthsYm(ym: string, add: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + add, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function ymToPeriodoText(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return `01/${mm}/${y} - ${String(last).padStart(2, "0")}/${mm}/${y}`;
}

type EmployeeExtra = { hireYear?: number };
type EmployeeState = EmployeeMiniProfile & EmployeeExtra;

function loadProfiles(): Record<string, EmployeeState> {
  try {
    return JSON.parse(localStorage.getItem("nomina_profiles") || "{}");
  } catch {
    return {};
  }
}
function saveProfiles(p: Record<string, EmployeeState>) {
  localStorage.setItem("nomina_profiles", JSON.stringify(p));
}
function yearsOptions(): number[] {
  const now = new Date().getFullYear();
  const start = 2000;
  const out: number[] = [];
  for (let y = now; y >= start; y--) out.push(y);
  return out;
}

export default function App() {
  const [employeesFromFile, setEmployeesFromFile] = useState<string[]>([]);
  const [shiftsFromFile, setShiftsFromFile] = useState<Shift[]>([]);
  const [detectedDevengoYm, setDetectedDevengoYm] = useState<string>("");

  // Nómina (pago)
  const [mesNomina, setMesNomina] = useState<string>("2026-02");
  // Variables (mes vencido)
  const requiredDevengoYm = useMemo(() => addMonthsYm(mesNomina, -1), [mesNomina]);

  const hasImport = shiftsFromFile.length > 0;

  const [empleadoId, setEmpleadoId] = useState<string>("");
  const [profiles, setProfiles] = useState<Record<string, EmployeeState>>(() => loadProfiles());

  const current = profiles[empleadoId] ?? { grupo: "III", nivel: "I", band: "BI", hireYear: undefined };
  const { grupo, nivel, band, hireYear } = current;

  const yearOpts = useMemo(() => yearsOptions(), []);

  function updateEmployee(partial: Partial<EmployeeState>) {
    if (!empleadoId) return;
    setProfiles((prev) => {
      const next = { ...prev, [empleadoId]: { ...(prev[empleadoId] ?? current), ...partial } };
      saveProfiles(next);
      return next;
    });
  }

  const empleado: EmployeeProfile | null = useMemo(() => {
    if (!empleadoId) return null;
    return {
      id: empleadoId,
      nombre: empleadoId,
      grupo,
      nivel,
      band,
      rates: { ...DEFAULT_RATES },
      meta: { hireYear },
    } as any;
  }, [empleadoId, grupo, nivel, band, hireYear]);

  const devengoMismatch = !!(detectedDevengoYm && detectedDevengoYm !== requiredDevengoYm);

  const turnosMesRequerido = useMemo(() => {
    if (!empleadoId) return 0;
    const prefix = requiredDevengoYm + "-";
    return shiftsFromFile.filter((s) => s.empleadoId === empleadoId && s.date.startsWith(prefix)).length;
  }, [shiftsFromFile, empleadoId, requiredDevengoYm]);

  const { slip, error } = useMemo(() => {
    try {
      if (!hasImport || !empleado) return { slip: null as any, error: null as string | null };

      // ✅ Evita “nómina sin pluses” si importas otro mes
      if (devengoMismatch) {
        return {
          slip: null as any,
          error: `El cuadrante importado es de ${detectedDevengoYm} pero esta nómina necesita variables de ${requiredDevengoYm}. Importa la hoja correcta.`,
        };
      }

      const slip = buildPayrollSlip({
        empleado,
        mesNomina,
        shifts: shiftsFromFile,
        salaryTable,
        calendar,
        rules: { jornadaNormalHoras: 7, jornadaIntensivaHoras: 6 },
      });

      return { slip, error: null as string | null };
    } catch (e: any) {
      return { slip: null as any, error: e?.message ?? String(e) };
    }
  }, [hasImport, empleado, mesNomina, shiftsFromFile, devengoMismatch, detectedDevengoYm, requiredDevengoYm]);

  return (
    <div
      style={{
        background: "#0f1115",
        minHeight: "100vh",
        padding: 20,
        color: "#eaeef5",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.05 }}>Calcula tu nómina (local)</div>
        </div>

        {/* Mes nómina */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "end", marginBottom: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>¿Qué nómina quieres calcular?</span>
            <input
              type="month"
              value={mesNomina}
              onChange={(e) => setMesNomina(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #2a2f3a",
                background: "#0f1115",
                color: "#eaeef5",
              }}
            />
          </label>

          <div style={{ fontSize: 13, opacity: 0.85, paddingBottom: 4 }}>
            Variables a consultar: <b>{requiredDevengoYm}</b>
          </div>
        </div>

        {/* Importador */}
        <div style={{ background: "#171a20", border: "1px solid #2a2f3a", borderRadius: 14, padding: 16 }}>
          <ImportQuadrante
            requiredDevengoYm={requiredDevengoYm}
            onLoaded={({ employees, shifts, detectedYm }) => {
              setEmployeesFromFile(employees);
              setShiftsFromFile(shifts);
              setDetectedDevengoYm(detectedYm);

              setProfiles((prev) => {
                const next = { ...prev };
                for (const emp of employees) {
                  if (!next[emp]) next[emp] = { grupo: "III", nivel: "I", band: "BI", hireYear: undefined };
                }
                saveProfiles(next);
                return next;
              });

              if (!empleadoId && employees.length) setEmpleadoId(employees[0]);
            }}
          />
        </div>

        {/* Recibo estilo nómina */}
        <div
          style={{
            marginTop: 16,
            background: "#ffffff",
            color: "#0b0d12",
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid #e6e9ef",
          }}
        >
          {/* Header */}
          <div style={{ padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 160px", alignItems: "start", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    background: "#f3f5f8",
                    border: "1px solid #e6e9ef",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: 12,
                    color: "#1b2a41",
                  }}
                  title="Logo"
                >
                  IFEMA
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.2, opacity: 0.9 }}>
                  <div style={{ fontWeight: 900 }}>IFEMA MADRID</div>
                  <div style={{ opacity: 0.75 }}>Recibo de salarios</div>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.5 }}>RECIBO DE SALARIOS</div>
              </div>

              <div style={{ textAlign: "right", fontWeight: 800, opacity: 0.85 }}>{mesNomina}</div>
            </div>
          </div>

          <div style={{ height: 3, background: "#1b2a41" }} />

          {/* Datos */}
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ borderTop: "2px solid #1b2a41", paddingTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.85, marginBottom: 10 }}>DATOS DE LA EMPRESA</div>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 10, columnGap: 10, fontSize: 13 }}>
                <div style={{ opacity: 0.65 }}>EMPRESA</div><div style={{ fontWeight: 800 }}>{EMPRESA.nombre}</div>
                <div style={{ opacity: 0.65 }}>CIF</div><div style={{ fontWeight: 800 }}>{EMPRESA.cif}</div>
                <div style={{ opacity: 0.65 }}>DOMICILIO</div><div style={{ fontWeight: 800 }}>{EMPRESA.domicilio}</div>
                <div style={{ opacity: 0.65 }}>CP / CIUDAD</div><div style={{ fontWeight: 800 }}>{EMPRESA.cp}, {EMPRESA.ciudad}</div>
              </div>
            </div>

            <div style={{ borderTop: "2px solid #1b2a41", paddingTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.85, marginBottom: 10 }}>DATOS DEL TRABAJADOR</div>

              <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", rowGap: 10, columnGap: 10, fontSize: 13 }}>
                <div style={{ opacity: 0.65 }}>EMPLEADO</div>
                <div>
                  <select
                    value={empleadoId}
                    onChange={(e) => setEmpleadoId(e.target.value)}
                    disabled={!employeesFromFile.length}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #d9dde3",
                      background: "#fff",
                      color: "#0b0d12",
                      fontWeight: 900,
                    }}
                  >
                    {!employeesFromFile.length && <option value="">(Importa un cuadrante)</option>}
                    {employeesFromFile.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div style={{ opacity: 0.65 }}>CATEGORÍA PROFESIONAL</div>
                <div>
                  <EmployeeProfileEditor value={{ grupo, nivel, band }} onChange={(v) => updateEmployee(v)} compact />
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6, fontWeight: 700 }}>
                    {`G.${grupo} - NIVEL ${nivel} - ${band}`}
                  </div>
                </div>

                <div style={{ opacity: 0.65 }}>PERÍODO</div><div style={{ fontWeight: 800 }}>{ymToPeriodoText(mesNomina)}</div>

                <div style={{ opacity: 0.65 }}>AÑO CONTRATACIÓN</div>
                <div>
                  <select
                    value={hireYear ?? ""}
                    onChange={(e) => updateEmployee({ hireYear: e.target.value ? Number(e.target.value) : undefined })}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #d9dde3",
                      background: "#fff",
                      color: "#0b0d12",
                      fontWeight: 900,
                    }}
                  >
                    <option value="">(sin dato)</option>
                    {yearOpts.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div style={{ opacity: 0.65 }}>VARIABLES DEVENGADAS</div>
                <div style={{ fontWeight: 800 }}>
                  {requiredDevengoYm} (mes vencido)
                  <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                    Turnos importados de este mes: <b>{turnosMesRequerido}</b>
                    {detectedDevengoYm ? <> · Devengo importado: <b>{detectedDevengoYm}</b></> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ margin: "0 16px 16px 16px", padding: 12, borderRadius: 10, border: "1px solid #f2b1b1", background: "#fff5f5" }}>
              <b>Error:</b> {error}
            </div>
          )}

          {slip && !error && (
            <div style={{ padding: "0 16px 16px 16px" }}>
              <div style={{ borderTop: "2px solid #1b2a41" }} />
              <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cfd6df" }}>
                    <th style={{ textAlign: "right", width: 90, fontWeight: 900 }}>CUANTÍA</th>
                    <th style={{ textAlign: "right", width: 120, fontWeight: 900 }}>BASE</th>
                    <th style={{ textAlign: "left", fontWeight: 900 }}>CONCEPTO</th>
                    <th style={{ textAlign: "right", width: 130, fontWeight: 900 }}>DEVENGOS</th>
                    <th style={{ textAlign: "right", width: 130, fontWeight: 900 }}>DEDUCCIONES</th>
                  </tr>
                </thead>
                <tbody>
  {slip.devengos.map(
    (l: { concepto: string; cantidad?: number | null; base?: number | null; importe: number }, idx: number) => (
      <tr key={idx} style={{ borderBottom: "1px solid #eef1f4" }}>
        <td style={{ textAlign: "right" }}>{l.cantidad ?? ""}</td>
        <td style={{ textAlign: "right" }}>{l.base != null ? euro(l.base) : ""}</td>
        <td style={{ textAlign: "left" }}>{l.concepto}</td>
        <td style={{ textAlign: "right" }}>{euro(l.importe)}</td>
        <td style={{ textAlign: "right" }} />
      </tr>
    )
  )}
</tbody>
              </table>

              <div style={{ borderTop: "2px solid #1b2a41", marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={{ opacity: 0.7, fontWeight: 800 }}>TOTAL DEVENGADO</div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{euro(slip.totalDevengos)}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.7, fontWeight: 800 }}>TOTAL DEDUCCIONES</div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{euro(0)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ opacity: 0.7, fontWeight: 800 }}>LÍQUIDO A PERCIBIR</div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{euro(slip.totalDevengos)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}