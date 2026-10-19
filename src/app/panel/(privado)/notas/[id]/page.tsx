import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorNota } from "@/components/panel/EditorNota";
import styles from "@/components/panel/panel.module.css";
import { listarCategorias, obtenerNotaParaEditar } from "@/lib/panel/datos";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Editar noticia" };

export default async function EditarNota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = (await perfilDelPanel())!;
  // RLS: si el rol no puede ver esta nota (p. ej. un borrador ajeno), no existe para él.
  const [datos, categorias] = await Promise.all([obtenerNotaParaEditar(id), listarCategorias()]);
  if (!datos) notFound();

  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>Noticias{datos.meta.esDemo ? " · contenido de muestra" : ""}</p>
          <h1 className={styles.titulo}>Editar noticia</h1>
        </div>
      </div>
      <EditorNota
        inicial={datos.form}
        situacion={{ estado: datos.meta.estado, publicadoEn: datos.meta.publicadoEn, autorId: datos.meta.autorId }}
        rol={perfil.rol}
        usuarioId={perfil.id}
        categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
        autorNombre={datos.meta.autorNombre}
      />
    </>
  );
}
