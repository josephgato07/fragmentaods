"use client";

import { useState, useTransition } from "react";
import { eliminarCategoria, guardarCategoria } from "@/app/panel/_acciones/administracion";
import type { CategoriaPanel } from "@/lib/panel/datos";
import { crearSlug } from "@/lib/panel/reglas";
import styles from "./panel.module.css";

type Fila = { id: string | null; slug: string; nombre: string; orden: string; enPortada: boolean };

const aFila = (c: CategoriaPanel): Fila => ({ id: c.id, slug: c.slug, nombre: c.nombre, orden: String(c.orden), enPortada: c.enPortada });

function FilaCategoria({ inicial, onListo }: { inicial: Fila; onListo: (mensaje: { ok: boolean; texto: string }) => void }) {
  const [fila, setFila] = useState(inicial);
  const [base, setBase] = useState(JSON.stringify(inicial));
  const [ocupado, iniciar] = useTransition();
  const nueva = !fila.id;
  const cambios = JSON.stringify(fila) !== base;
  const pre = fila.id ?? "nueva";

  const guardar = () =>
    iniciar(async () => {
      const r = await guardarCategoria({ ...fila, orden: Number(fila.orden) });
      onListo({ ok: r.ok, texto: r.mensaje });
      if (r.ok) {
        if (nueva) {
          setFila({ id: null, slug: "", nombre: "", orden: "0", enPortada: true });
        } else setBase(JSON.stringify(fila));
      }
    });

  const eliminar = () => {
    if (!fila.id || !window.confirm(`¿Eliminar la categoría «${fila.nombre}»? Solo es posible si no tiene contenidos.`)) return;
    const id = fila.id;
    iniciar(async () => {
      const r = await eliminarCategoria(id);
      onListo({ ok: r.ok, texto: r.mensaje });
    });
  };

  return (
    <div className={`${styles.tablaFila} ${styles.tablaFilaCategoria}`}>
      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={`${pre}-nombre`}>
          Nombre
        </label>
        <input
          id={`${pre}-nombre`}
          className={styles.input}
          value={fila.nombre}
          maxLength={60}
          onChange={(e) =>
            setFila((f) => ({ ...f, nombre: e.target.value, slug: nueva && (f.slug === "" || f.slug === crearSlug(f.nombre)) ? crearSlug(e.target.value) : f.slug }))
          }
        />
      </div>
      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={`${pre}-slug`}>
          Dirección (/seccion/…)
        </label>
        <input id={`${pre}-slug`} className={styles.input} value={fila.slug} maxLength={60} onChange={(e) => setFila({ ...fila, slug: e.target.value.toLowerCase() })} />
      </div>
      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={`${pre}-orden`}>
          Orden
        </label>
        <input id={`${pre}-orden`} className={styles.input} type="number" inputMode="numeric" value={fila.orden} onChange={(e) => setFila({ ...fila, orden: e.target.value })} />
      </div>
      <label className={styles.check}>
        <input type="checkbox" checked={fila.enPortada} onChange={(e) => setFila({ ...fila, enPortada: e.target.checked })} />
        Módulo en portada
      </label>
      <div className={styles.filaAcciones}>
        <button type="button" className={`${styles.boton} ${styles.botonChico}`} onClick={guardar} disabled={ocupado || (!nueva && !cambios) || !fila.nombre.trim()}>
          {ocupado ? "Guardando…" : nueva ? "Crear" : "Guardar"}
        </button>
        {!nueva ? (
          <button type="button" className={`${styles.botonPeligro} ${styles.botonChico}`} onClick={eliminar} disabled={ocupado}>
            Eliminar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminCategorias({ categorias }: { categorias: CategoriaPanel[] }) {
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  return (
    <div className={styles.bloque} style={{ marginTop: 0 }}>
      {mensaje ? (
        <p className={mensaje.ok ? styles.avisoOk : styles.avisoError} role={mensaje.ok ? "status" : "alert"}>
          {mensaje.texto}
        </p>
      ) : null}
      <p className={styles.ayuda}>
        Cambiar la dirección de una categoría cambia la URL de su sección. El orden define el menú y los módulos de la portada.
      </p>
      <div className={styles.tablaAdmin}>
        {categorias.map((c) => (
          <FilaCategoria key={`${c.id}-${c.slug}-${c.nombre}-${c.orden}-${c.enPortada}`} inicial={aFila(c)} onListo={setMensaje} />
        ))}
      </div>
      <h2 className={styles.bloqueTitulo}>Nueva categoría</h2>
      <div className={styles.tablaAdmin}>
        <FilaCategoria inicial={{ id: null, slug: "", nombre: "", orden: String((categorias.at(-1)?.orden ?? 0) + 1), enPortada: true }} onListo={setMensaje} />
      </div>
    </div>
  );
}
