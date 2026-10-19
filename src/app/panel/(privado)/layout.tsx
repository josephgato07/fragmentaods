import Link from "next/link";
import { redirect } from "next/navigation";
import { FragBadge } from "@/components/Logo";
import { PanelNav } from "@/components/panel/PanelNav";
import styles from "@/components/panel/panel.module.css";
import { NOMBRE_ROL } from "@/lib/panel/reglas";
import { perfilDelPanel } from "@/lib/panel/sesion";
import { salir } from "../_acciones/sesion";

/**
 * Todas las rutas del panel (salvo /panel/ingresar) pasan por aquí:
 * sin sesión se redirige al ingreso; un usuario inactivo no ve nada del panel.
 * Además, cada página y cada Server Action vuelven a comprobar el rol.
 */
export default async function LayoutPrivado({ children }: { children: React.ReactNode }) {
  const perfil = await perfilDelPanel();
  if (!perfil) redirect("/panel/ingresar");

  const barra = (
    <header className={styles.topbar}>
      <div className={`contenedor ${styles.topbarInner}`}>
        <Link href="/panel" className={styles.marca}>
          <FragBadge size="sm" />
          <span>
            <span className={styles.marcaTexto}>Fragmentados</span>
            <br />
            <span className={styles.marcaSub}>Panel editorial</span>
          </span>
        </Link>
        <div className={styles.usuario}>
          <span className={styles.usuarioNombre}>{perfil.nombreVisible || perfil.email}</span>
          <span className={styles.usuarioRol}>{NOMBRE_ROL[perfil.rol]}</span>
          <form action={salir} data-confirmar-salida="">
            <button type="submit" className={styles.botonOscuro}>
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );

  if (!perfil.activo) {
    return (
      <div className={styles.shell}>
        {barra}
        <main className={`contenedor ${styles.main}`}>
          <div className={styles.sinPermiso}>
            <h1 className={styles.titulo}>Usuario inactivo</h1>
            <p className={styles.aviso}>Tu usuario todavía no fue activado o fue desactivado. Pedile a un administrador que lo active.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {barra}
      <PanelNav rol={perfil.rol} />
      <main id="contenido" className={`contenedor ${styles.main}`}>
        {children}
      </main>
    </div>
  );
}
