export type Band = "BI" | "BS";
export type Group = "II" | "III" | "IV";
export type Level = "I" | "II" | "III";

export type EmployeeProfile = {
  id: string;
  nombre: string;
  grupo: Group;
  nivel: Level;
  band: Band;
  rates: {
    plusSabDomFestivo: number;
    plusNocturnidad: number;
    complementoFestivo: number;
    complementoNocturno: number;
    horaComplLaboral: number;
    horaComplFestiva: number;
    dietaComida: number;
  };
};

export type SalaryTableRow = {
  key: `${Group}-${Level}`;
  salarioBaseMensual: { BI: number; BS: number };
  plusConvenioMensual: { BI: number; BS: number };
};

export type ShiftCode = "M" | "T" | "N" | "L" | "DC";

export type Shift =
  | {
      empleadoId: string;
      date: string;
      code: ShiftCode;
    }
  | {
      empleadoId: string;
      date: string;
      start: string;
      end: string;
      note?: string;
    };

export type PayrollConceptLine = {
  concepto: string;
  cantidad?: number;
  base?: number;
  importe: number;
};

export type PayrollSlip = {
  empleado: {
    id: string;
    nombre: string;
    grupo: Group;
    nivel: Level;
    band: Band;
  };
  mesNomina: string;
  mesDevengoVariables: string;
  devengos: PayrollConceptLine[];
  totalDevengos: number;
};