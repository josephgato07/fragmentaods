import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorFragmento } from "@/components/panel/EditorFragmento";
import styles from "@/components/panel/panel.module.css";
import { listarCategorias, obtenerFragmentoParaEditar, opcionesDeNotas } from "@/lib/panel/datos";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Editar fragmento" };

export default async function EditarFragmento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = (await perfilDelPanel())!;
  const [datos, categorias, notas] = await Promise.all([obtenerFragmentoParaEditar(id), listarCategorias(), opcionesDeNotas()]);
  if (!datos) notFound();
  if (datos.form.parrafos.length === 0) datos.form.parrafos.push({ id: "p-inicial", content: [] });

  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>Fragmentos{datos.meta.esDemo ? " · contenido de muestra" : ""}</p>
          <h1 className={styles.titulo}>Editar fragmento</h1>
        </div>
      </div>
      <EditorFragmento
        inicial={datos.form}
        situacion={{ estado: datos.meta.estado, publicadoEn: datos.meta.publicadoEn, autorId: datos.meta.autorId }}
        rol={perfil.rol}
        usuarioId={perfil.id}
        categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
        notas={notas}
        autorNombre={datos.meta.autorNombre}
      />
    </>
  );
}
