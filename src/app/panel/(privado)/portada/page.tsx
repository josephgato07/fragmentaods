import type { Metadata } from "next";
import { EditorPortada } from "@/components/panel/EditorPortada";
import { SinPermiso } from "@/components/panel/SinPermiso";
import styles from "@/components/panel/panel.module.css";
import { obtenerPortada } from "@/lib/panel/datos";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Portada" };

export default async function PaginaPortada() {
  const perfil = (await perfilDelPanel())!;
  if (perfil.rol === "redactor") return <SinPermiso texto="Organizar la portada es tarea de editores y administradores." />;
  const datos = await obtenerPortada();
  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>Orden editorial</p>
          <h1 className={styles.titulo}>Portada</h1>
        </div>
      </div>
      <EditorPortada datos={datos} />
    </>
  );
}
