import "server-only";

/**
 * Vista previa privada: lee el contenido con la sesión del usuario (RLS decide
 * si puede verlo) y lo convierte con los mismos mapeadores del portal.
 * Nada de esto pasa por las rutas públicas ni por su caché.
 */
import { FRAGMENTO_COLUMNS, NOTA_COLUMNS, toArticle, toFragment, type FragmentoRow, type NotaRow } from "@/lib/content/mappers";
import type { Article, Fragment } from "@/lib/content/types";
import { createSessionClient } from "@/lib/supabase/server";
import type { Estado } from "./tipos";

const SIN_IMAGEN = {
  imagen_ruta: "/panel/sin-imagen.png",
  imagen_alt: "Todavía no hay imagen principal",
  imagen_ancho: 1600,
  imagen_alto: 900,
  imagen_credito: null,
  imagen_foco: null,
  imagen_ajuste: "cover",
};

export interface Previa<T> {
  contenido: T;
  estado: Estado;
  publicadoEn: string | null;
  slug: string;
  notaSlug?: string | null;
}

export async function previaNota(id: string): Promise<Previa<Article> | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("notas").select(`${NOTA_COLUMNS}, estado, actualizado_en`).eq("id", id).maybeSingle();
  if (error || !data) return null;
  const fila = data as unknown as NotaRow & { estado: Estado; actualizado_en: string };
  const conImagen = fila.imagen_ruta ? fila : { ...fila, ...SIN_IMAGEN, imagen_pie: null };
  const article = toArticle({ ...conImagen, publicado_en: fila.publicado_en ?? fila.actualizado_en } as NotaRow);
  if (!article) return null;
  return { contenido: article, estado: fila.estado, publicadoEn: fila.publicado_en, slug: fila.slug };
}

export async function previaFragmento(id: string): Promise<Previa<Fragment> | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("fragmentos")
    .select(`${FRAGMENTO_COLUMNS}, estado, actualizado_en`)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const fila = data as unknown as FragmentoRow & { estado: Estado; actualizado_en: string };
  const cuerpo = Array.isArray(fila.cuerpo) && fila.cuerpo.length > 0 ? fila.cuerpo : [["(Todavía sin texto)"]];
  const fragment = toFragment({ ...fila, cuerpo, publicado_en: fila.publicado_en ?? fila.actualizado_en });
  if (!fragment) return null;
  return {
    contenido: { ...fragment, articleSlug: null },
    estado: fila.estado,
    publicadoEn: fila.publicado_en,
    slug: fila.slug,
    notaSlug: fila.nota?.slug ?? null,
  };
}
