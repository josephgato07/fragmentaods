import type { Metadata } from "next";
import { EditorNota } from "@/components/panel/EditorNota";
import styles from "@/components/panel/panel.module.css";
import { listarCategorias } from "@/lib/panel/datos";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Nueva noticia" };

export default async function NuevaNota() {
  const perfil = (await perfilDelPanel())!;
  const categorias = await listarCategorias();
  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>Noticias</p>
          <h1 className={styles.titulo}>Nueva noticia</h1>
        </div>
      </div>
      <EditorNota
        inicial={{
          id: null,
          titulo: "",
          slug: "",
          bajada: "",
          etiqueta: "",
          lugar: "Uruguay",
          firma: "Redacción FRAGMENTADOS",
          categoriaId: "",
          fuentes: [],
          imagen: null,
          cuerpo: [{ id: "p-inicial", type: "parrafo", content: [] }],
          programarPara: "",
        }}
        situacion={null}
        rol={perfil.rol}
        usuarioId={perfil.id}
        categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
      />
    </>
  );
}
