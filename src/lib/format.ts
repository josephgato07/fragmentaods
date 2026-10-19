const ZONA = "America/Montevideo";

const fecha = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: ZONA,
});

const fechaCorta = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "short",
  timeZone: ZONA,
});

const hora = new Intl.DateTimeFormat("es-UY", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: ZONA,
});

/** "9 de octubre de 2026" */
export function formatDate(iso: string): string {
  return fecha.format(new Date(iso));
}

/** "9 oct." */
export function formatShortDate(iso: string): string {
  return fechaCorta.format(new Date(iso));
}

/** "14:32" */
export function formatTime(iso: string): string {
  return hora.format(new Date(iso));
}

/** Rutas públicas de cada tipo de contenido. */
export const paths = {
  home: () => "/",
  section: (slug: string) => `/seccion/${slug}`,
  article: (slug: string) => `/nota/${slug}`,
  fragment: (slug: string) => `/fragmento/${slug}`,
  fragments: () => "/fragmentos",
  search: (q?: string) => (q ? `/buscar?q=${encodeURIComponent(q)}` : "/buscar"),
};
