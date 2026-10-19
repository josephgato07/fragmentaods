/**
 * Genera supabase/seed/demo_kit.sql a partir de src/lib/content/demo-data.ts,
 * para cargar en Supabase exactamente los mismos contenidos de muestra del kit.
 *
 * Uso (Node 22.18 o superior):  node scripts/generar-seed-demo.mts
 */
import { writeFileSync } from "node:fs";
import { articles, fragments, highlights, homeLayout, sections } from "../src/lib/content/demo-data.ts";
import type { ImageAsset, Inline } from "../src/lib/content/types.ts";

const q = (v: string | null | undefined) => (v == null ? "null" : `'${v.replace(/'/g, "''")}'`);
const j = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;
const n = (v: number | null | undefined) => (v == null ? "null" : String(v));

const imgCols = (img: ImageAsset | null) =>
  img
    ? [q(img.src), q(img.alt), q(img.credit), n(img.width), n(img.height), q(img.focal ?? null), q(img.fit ?? "cover")]
    : ["null", "null", "null", "null", "null", "null", "'cover'"];

const imgJson = (img: ImageAsset) => {
  const out: Record<string, unknown> = { ruta: img.src, alt: img.alt, ancho: img.width, alto: img.height };
  if (img.credit) out.credito = img.credit;
  if (img.caption) out.pie = img.caption;
  if (img.focal) out.foco = img.focal;
  if (img.fit) out.ajuste = img.fit;
  return out;
};

const fuentes = (list: Array<{ label: string; url?: string }>) => j(list.map((s) => (s.url ? s : { label: s.label })));

const lines: string[] = [];
const out = (s = "") => lines.push(s);

out("-- =============================================================================");
out("-- FRAGMENTADOS · Datos de muestra del kit (OPCIONAL)");
out("-- =============================================================================");
out("-- Generado por scripts/generar-seed-demo.mts desde src/lib/content/demo-data.ts.");
out("-- Carga categorías, notas, fragmentos, destacados y portada de la demo.");
out("-- Todo queda marcado con es_demo = true para poder identificarlo después.");
out("-- No borra ni modifica nada existente: si un slug ya existe, lo deja como está.");
out("-- Ejecutar DESPUÉS de las tres migraciones.");
out("-- =============================================================================");
out();
out("begin;");
out();
out("insert into public.categorias (slug, nombre, orden, en_portada) values");
out(sections.map((s, i) => `  (${q(s.slug)}, ${q(s.name)}, ${i + 1}, true)`).join(",\n"));
out("on conflict (slug) do nothing;");
out();

for (const a of articles) {
  const sectionName = sections.find((s) => s.slug === a.section)?.name;
  const cuerpo = a.body.map((b) =>
    b.type === "imagen" ? { type: "imagen", imagen: imgJson(b.image) } : b,
  );
  out("insert into public.notas (slug, titulo, bajada, etiqueta, cuerpo, lugar, categoria_id, firma, fuentes,");
  out("  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,");
  out("  estado, publicado_en, es_demo)");
  out("select " +
    [q(a.slug), q(a.title), q(a.deck), q(a.label === sectionName ? null : a.label), j(cuerpo), q(a.place),
      "c.id", q(a.author), fuentes(a.sources), ...imgCols(a.image), "'publicado'", q(a.publishedAt), "true"].join(",\n  "));
  out(`from public.categorias c where c.slug = ${q(a.section)}`);
  out("on conflict (slug) do nothing;");
  out();
}

for (const f of fragments) {
  const cuerpo: Inline[][] = f.body;
  out("insert into public.fragmentos (slug, palabra_clave, cuerpo, lugar, categoria_id, fuentes, nota_id,");
  out("  estado, publicado_en, es_demo)");
  out("select " +
    [q(f.slug), q(f.keyword), j(cuerpo), q(f.place), "c.id", fuentes(f.sources),
      f.articleSlug ? `(select n.id from public.notas n where n.slug = ${q(f.articleSlug)})` : "null",
      "'publicado'", q(f.publishedAt), "true"].join(",\n  "));
  out(`from public.categorias c where c.slug = ${q(f.section)}`);
  out("on conflict (slug) do nothing;");
  out();
}

// Los destacados no tienen slug: se identifican por un uuid fijo para que el script sea repetible.
const destacadoIds: Record<string, string> = {};
highlights.forEach((h, i) => {
  destacadoIds[h.id] = `00000000-0000-4000-8000-00000000000${i + 1}`;
});
for (const h of highlights) {
  const id = q(destacadoIds[h.id]);
  if (h.type === "cifra") {
    out("insert into public.destacados (id, tipo, valor, texto, fuentes, estado, publicado_en, es_demo)");
    out(`values (${id}, 'cifra', ${q(h.value)}, ${q(h.text)}, ${fuentes(h.source ? [h.source] : [])}, 'publicado', '2026-10-09T08:00:00-03:00', true)`);
  } else if (h.type === "cita") {
    out("insert into public.destacados (id, tipo, cita, atribucion,");
    out("  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste, estado, publicado_en, es_demo)");
    out(`values (${[id, "'cita'", q(h.quote), q(h.attribution), ...imgCols(h.image), "'publicado'", "'2026-10-09T08:00:00-03:00'", "true"].join(", ")})`);
  } else {
    out("insert into public.destacados (id, tipo, titulo, acento, texto,");
    out("  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste, estado, publicado_en, es_demo)");
    out(`values (${[id, "'foto'", q(h.title), q(h.accent), q(h.caption), ...imgCols(h.image), "'publicado'", "'2026-10-09T08:00:00-03:00'", "true"].join(", ")})`);
  }
  out("on conflict (id) do nothing;");
  out();
}

out("-- Portada: apertura, secundarias y destacados (solo si la ubicación está libre)");
out("insert into public.ubicaciones_portada (zona, posicion, nota_id)");
out(`select 'apertura', 1, n.id from public.notas n where n.slug = ${q(homeLayout.leadSlug)}`);
out("on conflict do nothing;");
homeLayout.secondarySlugs.forEach((slug, i) => {
  out("insert into public.ubicaciones_portada (zona, posicion, nota_id)");
  out(`select 'secundaria', ${i + 1}, n.id from public.notas n where n.slug = ${q(slug)}`);
  out("on conflict do nothing;");
});
highlights.forEach((h, i) => {
  out("insert into public.ubicaciones_portada (zona, posicion, destacado_id)");
  out(`values ('destacado', ${i + 1}, ${q(destacadoIds[h.id])})`);
  out("on conflict do nothing;");
});
out();
out("commit;");

writeFileSync(new URL("../supabase/seed/demo_kit.sql", import.meta.url), lines.join("\n") + "\n");
console.log("Generado supabase/seed/demo_kit.sql");
