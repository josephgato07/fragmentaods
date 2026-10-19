/** URL pública de una imagen del bucket, utilizable en el navegador. */
export const BUCKET = "imagenes-editoriales";

export function urlImagen(ruta: string): string {
  if (ruta.startsWith("/")) return ruta;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${ruta.split("/").map(encodeURIComponent).join("/")}`;
}
