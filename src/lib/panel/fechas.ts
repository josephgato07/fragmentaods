/**
 * Fechas del panel en horario de Uruguay (America/Montevideo).
 * En la base todo se guarda como timestamptz (ISO con zona). Los campos
 * <input type="datetime-local"> no tienen zona: se interpretan como hora de Montevideo.
 */
export const ZONA_URUGUAY = "America/Montevideo";

const partes = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_URUGUAY,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function componentes(fecha: Date) {
  const p = partes.formatToParts(fecha);
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { y: v("year"), m: v("month"), d: v("day"), h: v("hour"), mi: v("minute"), s: v("second") };
}

/** Diferencia en minutos entre Montevideo y UTC en ese instante (hoy: −180). */
function desfaseMinutos(fecha: Date): number {
  const c = componentes(fecha);
  return (Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi, c.s) - fecha.getTime()) / 60000;
}

const dos = (n: number) => String(n).padStart(2, "0");

/** ISO → "2026-10-20T08:00" (hora de Montevideo), para un datetime-local. */
export function aEntradaLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  const c = componentes(fecha);
  return `${c.y}-${dos(c.m)}-${dos(c.d)}T${dos(c.h)}:${dos(c.mi)}`;
}

/** "2026-10-20T08:00" (hora de Montevideo) → ISO en UTC, o null si no es válido. */
export function desdeEntradaLocal(local: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local ?? "");
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const supuesto = Date.UTC(y, mo - 1, d, h, mi);
  let instante = supuesto - desfaseMinutos(new Date(supuesto)) * 60000;
  // Segunda pasada por si el desfase cambia en esa fecha (cambio de hora).
  instante = supuesto - desfaseMinutos(new Date(instante)) * 60000;
  const resultado = new Date(instante);
  return aEntradaLocal(resultado.toISOString()) === local ? resultado.toISOString() : null;
}

const fechaHora = new Intl.DateTimeFormat("es-UY", {
  timeZone: ZONA_URUGUAY,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const soloHora = new Intl.DateTimeFormat("es-UY", {
  timeZone: ZONA_URUGUAY,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "20 oct 2026, 08:00" en hora de Uruguay. */
export function formatearFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fechaHora.format(new Date(iso)).replace(/\./g, "");
}

/** "16:42" en hora de Uruguay. */
export function formatearHora(iso: string | Date): string {
  return soloHora.format(typeof iso === "string" ? new Date(iso) : iso);
}
