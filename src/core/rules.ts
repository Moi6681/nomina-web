import type { Shift } from "./types";
import type { CalendarConfig } from "./calendar";
import { isFestivoLike, isIntensiva } from "./calendar";

export type RulesConfig = {
  jornadaNormalHoras: number; // 7
  jornadaIntensivaHoras: number; // 6
};

export type VariableCounters = {
  diasFestivoLikeTrabajados: number; // festivo/sáb/dom trabajados
  horasFestivoLike: number; // diasFestivoLike * 7/6
  horasComplFestivas: number; // extras fuera de marco en festivo/sáb/dom
  horasComplLaborales: number; // extras fuera de marco en laborable
  dietas: number; // T + prolonga > 22:30

  diasComplementoNocturno: number; // días con trabajo después de noctStart (22:00 normal / 20:00 JI)
  horasNocturnidad: number; // horas entre noctStart y 06:00
};

function empty(): VariableCounters {
  return {
    diasFestivoLikeTrabajados: 0,
    horasFestivoLike: 0,
    horasComplFestivas: 0,
    horasComplLaborales: 0,
    dietas: 0,
    diasComplementoNocturno: 0,
    horasNocturnidad: 0,
  };
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const s = Math.max(aStart, bStart);
  const e = Math.min(aEnd, bEnd);
  return Math.max(0, e - s);
}

function normalizeInterval(startMin: number, endMin: number): [number, number] {
  let s = startMin;
  let e = endMin;
  if (e < s) e += 1440; // cruza medianoche
  return [s, e];
}

type ShiftType = "M" | "T" | "N";

function frameFor(type: ShiftType, intensiva: boolean): { start: string; end: string } {
  if (!intensiva) {
    if (type === "M") return { start: "08:00", end: "15:00" };
    if (type === "T") return { start: "15:00", end: "22:00" };
    return { start: "22:00", end: "05:00" };
  }
  // Jornada intensiva
  if (type === "M") return { start: "08:00", end: "14:00" };
  if (type === "T") return { start: "14:00", end: "20:00" };
  return { start: "20:00", end: "02:00" };
}

/** Deducimos tipo cuando viene con horas */
function guessTypeByStart(start: string, intensiva: boolean): ShiftType {
  const s = toMin(start);
  if (!intensiva) {
    if (s < toMin("12:00")) return "M";
    if (s < toMin("19:00")) return "T";
    return "N";
  }
  if (s < toMin("12:00")) return "M";
  if (s < toMin("18:00")) return "T";
  return "N";
}

function isWorked(sh: Shift): boolean {
  return "code" in sh ? sh.code !== "L" && sh.code !== "DC" : true;
}

/**
 * ✅ Regla comida:
 * Si la jornada empieza entre 08:00 y 13:00 (incluido) y supera 8h, se descuenta 1h.
 */
function mealBreakMinutes(start: string, end: string): number {
  const startMin = toMin(start);
  const [s, e] = normalizeInterval(startMin, toMin(end));
  const dur = e - s;

  const inWindow = startMin >= toMin("08:00") && startMin <= toMin("13:00");
  const exceeds8h = dur > 8 * 60;

  return inWindow && exceeds8h ? 60 : 0;
}

/**
 * Extras fuera de marco:
 * extras = (duración efectiva) - solapeConMarco
 * donde duración efectiva = duración real - descansoComida (si aplica).
 */
function extraHoursOutsideFrame(
  start: string,
  end: string,
  frameStart: string,
  frameEnd: string,
  breakMin: number
): number {
  const [s, e] = normalizeInterval(toMin(start), toMin(end));
  const [fs, fe] = normalizeInterval(toMin(frameStart), toMin(frameEnd));

  const realDur = e - s;
  const effDur = Math.max(0, realDur - breakMin);

  // probamos solapes moviendo el marco +/- 1440 para cubrir cruces de día
  const ov1 = overlap(s, e, fs, fe);
  const ov2 = overlap(s, e, fs + 1440, fe + 1440);
  const ov3 = overlap(s, e, fs - 1440, fe - 1440);
  const ov = Math.max(ov1, ov2, ov3);

  const extraMin = Math.max(0, effDur - ov);
  return Math.round((extraMin / 60) * 100) / 100;
}

function parseHourCode(code: string): { start: string; end: string } | null {
  const m = code.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const sh = Number(m[1]);
  const eh = Number(m[2]);
  if (!Number.isFinite(sh) || !Number.isFinite(eh)) return null;
  if (sh < 0 || sh > 23 || eh < 0 || eh > 23) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { start: `${pad(sh)}:00`, end: `${pad(eh)}:00` };
}

/**
 * Nocturnidad configurable:
 * - noctStart = 22:00 normal, 20:00 intensiva
 * - nightMin: minutos entre noctStart y 06:00
 * - afterNoctStartMin: minutos trabajados DESDE noctStart hasta 24:00 (para Complemento Nocturno por día)
 */
function nightMinutesAndAfterNoctStart(
  start: string,
  end: string,
  intensiva: boolean
): { nightMin: number; afterNoctStartMin: number } {
  const [s, e] = normalizeInterval(toMin(start), toMin(end));

  const noctStart = intensiva ? toMin("20:00") : toMin("22:00");

  // Segmento 1 (mismo día)
  const seg1Start = s;
  const seg1End = Math.min(e, 1440);

  // Segmento 2 (madrugada)
  const seg2Start = 0;
  const seg2End = e > 1440 ? e - 1440 : 0;

  const afterNoctStart = overlap(seg1Start, seg1End, noctStart, 1440);

  let night = overlap(seg1Start, seg1End, noctStart, 1440);
  if (seg2End > 0) {
    night += overlap(seg2Start, seg2End, 0, 360);
  }

  return { nightMin: night, afterNoctStartMin: afterNoctStart };
}

function isTProlongaMas2230(type: ShiftType, start: string, end: string): boolean {
  if (type !== "T") return false;
  const [, e] = normalizeInterval(toMin(start), toMin(end)); // <- aquí sí podemos ignorar s
  const limit = toMin("22:30");
  if (e > 1440) return true;
  return e > limit;
}

/** Intervalo real del turno para cálculos */
function getShiftInterval(
  sh: Shift,
  intensiva: boolean
): { start: string; end: string; type: ShiftType; fromCode: boolean } | null {
  if (!isWorked(sh)) return null;

  if ("code" in sh) {
    if (sh.code === "M" || sh.code === "T" || sh.code === "N") {
      const type = sh.code;
      const fr = frameFor(type, intensiva);
      return { start: fr.start, end: fr.end, type, fromCode: true };
    }

    if (typeof sh.code === "string") {
      const parsed = parseHourCode(sh.code);
      if (parsed) {
        const type = guessTypeByStart(parsed.start, intensiva);
        return { start: parsed.start, end: parsed.end, type, fromCode: true };
      }
    }

    return null;
  }

  const type = guessTypeByStart(sh.start, intensiva);
  return { start: sh.start, end: sh.end, type, fromCode: false };
}

export function computeVariablesForMonth(
  shifts: Shift[],
  empleadoId: string,
  ym: string,
  cal: CalendarConfig,
  rules: RulesConfig
): VariableCounters {
  const c = empty();
  const prefix = `${ym}-`;

  for (const sh of shifts) {
    if (sh.empleadoId !== empleadoId) continue;
    if (!sh.date.startsWith(prefix)) continue;
    if (!isWorked(sh)) continue;

    const intensiva = isIntensiva(sh.date, cal);
    const festivoLike = isFestivoLike(sh.date, cal);

    if (festivoLike) {
      c.diasFestivoLikeTrabajados += 1;
      c.horasFestivoLike += intensiva ? rules.jornadaIntensivaHoras : rules.jornadaNormalHoras;
    }

    const interval = getShiftInterval(sh, intensiva);
    if (!interval) continue;

    // Extras fuera de marco
    // (para M/T/N puro será 0 porque coincide con el marco)
    const fr = frameFor(interval.type, intensiva);
    const breakMin = mealBreakMinutes(interval.start, interval.end);
    const extraH = extraHoursOutsideFrame(interval.start, interval.end, fr.start, fr.end, breakMin);

    if (extraH > 0) {
      if (festivoLike) c.horasComplFestivas += extraH;
      else c.horasComplLaborales += extraH;
    }

    // Dieta
    if (isTProlongaMas2230(interval.type, interval.start, interval.end)) {
      c.dietas += 1;
    }

    // Nocturnidad / Complemento nocturno
    const { nightMin, afterNoctStartMin } = nightMinutesAndAfterNoctStart(interval.start, interval.end, intensiva);
    if (afterNoctStartMin > 0) c.diasComplementoNocturno += 1;
    if (nightMin > 0) c.horasNocturnidad += nightMin / 60;
  }

  c.horasFestivoLike = Math.round(c.horasFestivoLike * 100) / 100;
  c.horasComplFestivas = Math.round(c.horasComplFestivas * 100) / 100;
  c.horasComplLaborales = Math.round(c.horasComplLaborales * 100) / 100;
  c.horasNocturnidad = Math.round(c.horasNocturnidad * 100) / 100;

  return c;
}