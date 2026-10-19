import type { Metadata } from "next";
import { AdminCategorias } from "@/components/panel/AdminCategorias";
import { SinPermiso } from "@/components/panel/SinPermiso";
import styles from "@/components/panel/panel.module.css";
import { listarCategorias } from "@/lib/panel/datos";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Categorías" };

export default async function PaginaCategorias() {
  const perfil = (await perfilDelPanel())!;
  if (perfil.rol !== "administrador") return <SinPermiso texto="Las categorías las gestiona un administrador." />;
  const categorias = await listarCategorias();
  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>Administración</p>
          <h1 className={styles.titulo}>Categorías</h1>
        </div>
      </div>
      <AdminCategorias categorias={categorias} />
    </>
  );
}
