import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FragBadge } from "@/components/Logo";
import { FormIngreso } from "@/components/panel/FormIngreso";
import styles from "@/components/panel/panel.module.css";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Ingresar" };

type Props = { searchParams: Promise<{ destino?: string; salida?: string; motivo?: string }> };

export default async function PaginaIngreso({ searchParams }: Props) {
  const { destino, salida, motivo } = await searchParams;
  const perfil = await perfilDelPanel();
  if (perfil?.activo) redirect("/panel");

  const aviso =
    salida === "1"
      ? "Cerraste la sesión."
      : motivo === "sesion"
        ? "Tu sesión venció. Volvé a ingresar."
        : null;

  return (
    <main className={styles.ingreso}>
      <div className={styles.ingresoCaja}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FragBadge size="md" />
          <span className={styles.antetitulo}>Panel editorial</span>
        </div>
        <h1 className={styles.ingresoTitulo}>Ingresar a Fragmentados</h1>
        <FormIngreso destino={typeof destino === "string" ? destino : "/panel"} aviso={aviso} />
        <a href="/" className="enlace" style={{ fontSize: "0.875rem" }}>
          Volver al portal
        </a>
      </div>
    </main>
  );
}
