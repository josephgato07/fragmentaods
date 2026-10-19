import type { Metadata } from "next";
import { EditorFragmento } from "@/components/panel/EditorFragmento";
import styles from "@/components/panel/panel.module.css";
import { listarCategorias, opcionesDeNotas } from "@/lib/panel/datos";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Nuevo fragmento" };

export default async function NuevoFragmento() {
  const perfil = (await perfilDelPanel())!;
  const [categorias, notas] = await Promise.all([listarCategorias(), opcionesDeNotas()]);
  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>Fragmentos</p>
          <h1 className={styles.titulo}>Nuevo fragmento</h1>
        </div>
      </div>
      <EditorFragmento
        inicial={{
          id: null,
          palabraClave: "",
          slug: "",
          lugar: "Uruguay",
          firma: "Redacción FRAGMENTADOS",
          categoriaId: "",
          fuentes: [],
          imagen: null,
          parrafos: [{ id: "p-inicial", content: [] }],
          notaId: "",
          programarPara: "",
        }}
        situacion={null}
        rol={perfil.rol}
        usuarioId={perfil.id}
        categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
        notas={notas}
      />
    </>
  );
}
