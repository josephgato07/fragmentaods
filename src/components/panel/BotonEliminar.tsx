"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarContenido } from "@/app/panel/_acciones/eliminar";
import styles from "./panel.module.css";

export function BotonEliminar({ tipo, id, titulo, volverA, deshabilitado = false }: {
  tipo: "nota" | "fragmento" | "destacado";
  id: string;
  titulo: string;
  volverA?: string;
  deshabilitado?: boolean;
}) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [eliminado, setEliminado] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const nombre = tipo === "nota" ? "la noticia" : tipo === "fragmento" ? "el fragmento" : "el destacado";
  return <div>
    <button type="button" className={`${styles.botonPeligro} ${styles.botonChico}`} disabled={deshabilitado || ocupado || eliminado}
      aria-label={`Eliminar ${nombre}: ${titulo}`}
      onClick={() => {
        const vinculos = tipo === "nota" ? "Los fragmentos y destacados vinculados se conservan, pero pierden el enlace a esta noticia. " : "";
        if (!window.confirm(`¿Eliminar definitivamente ${nombre} «${titulo || "sin título"}»?\n\nSe quitará del panel y del portal. ${vinculos}Las imágenes se conservan. Esta acción no se puede deshacer.`)) return;
        setMensaje(null);
        iniciar(async () => {
          try {
            const r = await eliminarContenido(tipo, id);
            setMensaje({ ok: r.ok, texto: r.mensaje });
            if (r.ok) { setEliminado(true); if (volverA) router.replace(volverA); router.refresh(); }
          } catch { setMensaje({ ok: false, texto: "No se pudo confirmar el resultado. Recargá el listado antes de intentarlo nuevamente." }); }
        });
      }}>{ocupado ? "Eliminando…" : eliminado ? "Eliminado" : "Eliminar"}</button>
    {mensaje ? <p role={mensaje.ok ? "status" : "alert"} className={mensaje.ok ? styles.avisoOk : styles.avisoError}>{mensaje.texto}</p> : null}
  </div>;
}
