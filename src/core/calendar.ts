export type CalendarConfig = {
  intensivaRanges: Array<{ start: string; end: string }>;
  intensivaDays: string[];
  special815Days: string[];
  festivos: string[]; // festivos “oficiales” (sin sáb/dom; sáb/dom los añadimos por lógica)
};

export function isInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function isIntensiva(date: string, cfg: CalendarConfig): boolean {
  if (cfg.intensivaDays.includes(date)) return true;
  for (const r of cfg.intensivaRanges) {
    if (isInRange(date, r.start, r.end)) return true;
  }
  return false;
}

export function isSabDom(date: string): boolean {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = d.getUTCDay(); // 0 domingo, 6 sábado
  return dow === 0 || dow === 6;
}

export function isFestivo(date: string, cfg: CalendarConfig): boolean {
  return cfg.festivos.includes(date);
}

/** En tu empresa: festivo = festivo calendario + sábados + domingos */
export function isFestivoLike(date: string, cfg: CalendarConfig): boolean {
  return isFestivo(date, cfg) || isSabDom(date);
}