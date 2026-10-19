import type { Metadata } from "next";
import { AdminEquipo } from "@/components/panel/AdminEquipo";
import { SinPermiso } from "@/components/panel/SinPermiso";
import styles from "@/components/panel/panel.module.css";
import { listarEquipo } from "@/lib/panel/datos";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Usuarios" };

export default async function PaginaUsuarios() {
  const perfil = (await perfilDelPanel())!;
  if (perfil.rol !== "administrador") return <SinPermiso texto="La gestión de usuarios es exclusiva de administradores." />;
  const miembros = await listarEquipo();
  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>Administración</p>
          <h1 className={styles.titulo}>Usuarios</h1>
          <p className={styles.subtitulo}>
            Nombre visible, rol y activación de los perfiles existentes. Para sumar a alguien, crealo en Supabase
            (Authentication → Users) y activalo acá. Nadie puede cambiar su propio rol y siempre queda un administrador activo.
          </p>
        </div>
      </div>
      <AdminEquipo miembros={miembros} yoId={perfil.id} />
    </>
  );
}
