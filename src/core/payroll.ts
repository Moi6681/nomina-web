import type { EmployeeProfile, PayrollSlip, SalaryTableRow, Shift } from "./types";
import type { CalendarConfig } from "./calendar";
import type { RulesConfig } from "./rules";
import { computeVariablesForMonth } from "./rules";

function ymAdd(ym: string, add: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + add, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function round(n: number) {
  return Math.round(n * 100) / 100;
}

const ORDER = [
  "SALARIO BASE",
  "ANTIGÜEDAD",
  "COMPLEMENTO PERSONAL",
  "PLUS CONVENIO",
  "COMPLEMENTO FESTIVO",
  "COMPLEMENTO NOCTURNO",
  "HORAS COMPLEMENTARIAS FESTIVAS",
  "HORAS COMPLEMENTARIAS LABORALES",
  "PLUS DE PENOSIDAD Y AC.OP.UR.",
  "PLUS DE SÁBADOS, DOMINGOS Y FESTIVOS",
  "PLUS NOCTURNIDAD",
  "DIETAS DE COMIDA",
  "R.ESPECIE COMIDA NO EXENTA",
] as const;

function orderKey(concepto: string): number {
  const idx = ORDER.indexOf(concepto as any);
  return idx === -1 ? 999 : idx;
}

export function buildPayrollSlip({
  empleado,
  mesNomina,
  shifts,
  salaryTable,
  calendar,
  rules,
}: {
  empleado: EmployeeProfile;
  mesNomina: string;
  shifts: Shift[];
  salaryTable: SalaryTableRow[];
  calendar: CalendarConfig;
  rules: RulesConfig;
}): PayrollSlip {
  const mesDevengoVariables = ymAdd(mesNomina, -1);

  const key = `${empleado.grupo}-${empleado.nivel}` as const;
  const row = salaryTable.find((r) => r.key === key);

  const salarioBase = row?.salarioBaseMensual[empleado.band] ?? 0;
  const plusConvenio = row?.plusConvenioMensual[empleado.band] ?? 0;

  const devengos: any[] = [
    {
      concepto: "SALARIO BASE",
      cantidad: 30,
      base: round(salarioBase / 30),
      importe: round(salarioBase),
    },
  ];

  // ✅ ANTIGÜEDAD (70,74 por trienio, cantidad 30, base importe/30)
  const hireYear: number | undefined = (empleado as any)?.meta?.hireYear;
  if (hireYear) {
    const yearNomina = Number(mesNomina.split("-")[0]);
    const years = Math.max(0, yearNomina - hireYear);
    const trienios = Math.floor(years / 3);
    if (trienios > 0) {
      const importe = round(trienios * 70.74);
      devengos.push({
        concepto: "ANTIGÜEDAD",
        cantidad: 30,
        base: round(importe / 30),
        importe,
      });
    }
  }

  devengos.push({
    concepto: "PLUS CONVENIO",
    cantidad: 30,
    base: round(plusConvenio / 30),
    importe: round(plusConvenio),
  });

  const v = computeVariablesForMonth(shifts, empleado.id, mesDevengoVariables, calendar, rules);

  if (v.diasFestivoLikeTrabajados > 0) {
    devengos.push({
      concepto: "COMPLEMENTO FESTIVO",
      cantidad: v.diasFestivoLikeTrabajados,
      base: empleado.rates.complementoFestivo,
      importe: round(v.diasFestivoLikeTrabajados * empleado.rates.complementoFestivo),
    });
  }

  if (v.horasFestivoLike > 0) {
    devengos.push({
      concepto: "PLUS DE SÁBADOS, DOMINGOS Y FESTIVOS",
      cantidad: v.horasFestivoLike,
      base: empleado.rates.plusSabDomFestivo,
      importe: round(v.horasFestivoLike * empleado.rates.plusSabDomFestivo),
    });
  }

  if (v.diasComplementoNocturno > 0) {
    devengos.push({
      concepto: "COMPLEMENTO NOCTURNO",
      cantidad: v.diasComplementoNocturno,
      base: empleado.rates.complementoNocturno,
      importe: round(v.diasComplementoNocturno * empleado.rates.complementoNocturno),
    });
  }

  if (v.horasNocturnidad > 0) {
    devengos.push({
      concepto: "PLUS NOCTURNIDAD",
      cantidad: v.horasNocturnidad,
      base: empleado.rates.plusNocturnidad,
      importe: round(v.horasNocturnidad * empleado.rates.plusNocturnidad),
    });
  }

  if (v.horasComplFestivas > 0) {
    devengos.push({
      concepto: "HORAS COMPLEMENTARIAS FESTIVAS",
      cantidad: v.horasComplFestivas,
      base: empleado.rates.horaComplFestiva,
      importe: round(v.horasComplFestivas * empleado.rates.horaComplFestiva),
    });
  }

  if (v.horasComplLaborales > 0) {
    devengos.push({
      concepto: "HORAS COMPLEMENTARIAS LABORALES",
      cantidad: v.horasComplLaborales,
      base: empleado.rates.horaComplLaboral,
      importe: round(v.horasComplLaborales * empleado.rates.horaComplLaboral),
    });
  }

  // Dietas divididas
  if (v.dietas > 0) {
    devengos.push({
      concepto: "DIETAS DE COMIDA",
      cantidad: v.dietas,
      base: empleado.rates.dietaComida, // 11
      importe: round(v.dietas * empleado.rates.dietaComida),
    });

    const baseNoExenta = 12.47;
    devengos.push({
      concepto: "R.ESPECIE COMIDA NO EXENTA",
      cantidad: v.dietas,
      base: baseNoExenta,
      importe: round(v.dietas * baseNoExenta),
    });
  }

  devengos.sort((a, b) => orderKey(a.concepto) - orderKey(b.concepto));
  const total = round(devengos.reduce((acc, x) => acc + x.importe, 0));

  return {
    empleado: {
      id: empleado.id,
      nombre: empleado.nombre,
      grupo: empleado.grupo,
      nivel: empleado.nivel,
      band: empleado.band,
    },
    mesNomina,
    mesDevengoVariables,
    devengos,
    totalDevengos: total,
  };
}