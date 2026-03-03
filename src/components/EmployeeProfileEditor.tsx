import type { Band, Group, Level } from "../core/types";

export type EmployeeMiniProfile = {
  grupo: Group;
  nivel: Level;
  band: Band;
};

const grupos: Group[] = ["II", "III", "IV"];
const niveles: Level[] = ["I", "II", "III"];
const bands: Band[] = ["BI", "BS"];

export default function EmployeeProfileEditor({
  value,
  onChange,
  compact = true,
}: {
  value: EmployeeMiniProfile;
  onChange: (v: EmployeeMiniProfile) => void;
  compact?: boolean;
}) {
  const selectStyle: React.CSSProperties = {
    padding: compact ? "8px 10px" : "10px 12px",
    borderRadius: 10,
    border: "1px solid #d9dde3",
    background: "#ffffff",
    color: "#0b0d12",
    fontWeight: 800,
    lineHeight: 1.2,
    height: 38,
  };

  const sepStyle: React.CSSProperties = {
    opacity: 0.7,
    fontWeight: 800,
    color: "#0b0d12",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "nowrap",          // ✅ no baja de línea
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <select
        value={value.grupo}
        onChange={(e) => onChange({ ...value, grupo: e.target.value as Group })}
        style={{ ...selectStyle, width: 88 }} // ✅ ancho fijo
        aria-label="Grupo"
      >
        {grupos.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <span style={sepStyle}>— NIVEL</span>

      <select
        value={value.nivel}
        onChange={(e) => onChange({ ...value, nivel: e.target.value as Level })}
        style={{ ...selectStyle, width: 70 }} // ✅ ancho fijo
        aria-label="Nivel"
      >
        {niveles.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <span style={sepStyle}>—</span>

      <select
        value={value.band}
        onChange={(e) => onChange({ ...value, band: e.target.value as Band })}
        style={{ ...selectStyle, width: 78 }} // ✅ ancho fijo
        aria-label="Banda"
      >
        {bands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}