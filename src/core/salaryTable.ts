// src/core/salaryTable.ts
import type { SalaryTableRow } from "./types";

export const salaryTable: SalaryTableRow[] = [
  // =========================
  // GRUPO PROFESIONAL II
  // =========================
  {
    key: "II-I",
    salarioBaseMensual: { BI: 1581.95, BS: 1581.95 },
    plusConvenioMensual: { BI: 2742.64, BS: 3203.42 },
  },
  {
    key: "II-II",
    salarioBaseMensual: { BI: 2497.85, BS: 2497.85 },
    plusConvenioMensual: { BI: 1279.76, BS: 1581.95 },
  },
  {
    key: "II-III",
    salarioBaseMensual: { BI: 1522.82, BS: 1522.82 },
    plusConvenioMensual: { BI: 1760.09, BS: 1968.0 },
  },

  // =========================
  // GRUPO PROFESIONAL III
  // =========================
  {
    key: "III-I",
    salarioBaseMensual: { BI: 1414.76, BS: 1522.82 },
    plusConvenioMensual: { BI: 1517.17, BS: 1618.56 },
  },
  {
    key: "III-II",
    salarioBaseMensual: { BI: 1414.76, BS: 1414.76 },
    plusConvenioMensual: { BI: 1111.67, BS: 1305.6 },
  },
  {
    key: "III-III",
    salarioBaseMensual: { BI: 1360.67, BS: 1414.76 },
    plusConvenioMensual: { BI: 906.66, BS: 1000.43 },
  },

  // =========================
  // GRUPO PROFESIONAL IV
  // =========================
  {
    key: "IV-I",
    salarioBaseMensual: { BI: 1169.09, BS: 1360.67 },
    plusConvenioMensual: { BI: 850.88, BS: 772.24 },
  },
  {
    key: "IV-II",
    salarioBaseMensual: { BI: 1169.09, BS: 1169.09 },
    plusConvenioMensual: { BI: 617.35, BS: 746.87 },
  },
  {
    key: "IV-III",
    salarioBaseMensual: { BI: 980.68, BS: 980.68 },
    plusConvenioMensual: { BI: 247.91, BS: 473.52 },
  },
];