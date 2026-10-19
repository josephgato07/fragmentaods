"use client";

import { useState, useTransition } from "react";
import { actualizarMiembro } from "@/app/panel/_acciones/administracion";
import type { Miembro } from "@/lib/panel/datos";
import { formatearFechaHora } from "@/lib/panel/fechas";
import { NOMBRE_ROL } from "@/lib/panel/reglas";
import type { Rol } from "@/lib/panel/tipos";
import styles from "./panel.module.css";

function FilaMiembro({ m, esYo, onListo }: { m: Miembro; esYo: boolean; onListo: (r: { ok: boolean; texto: string }) => void }) {
  const inicial = { nombreVisible: m.nombreVisible, rol: m.rol, activo: m.activo };
  const [fila, setFila] = useState(inicial);
  const [base, setBase] = useState(JSON.stringify(inicial));
  const [ocupado, iniciar] = useTransition();
  const cambios = JSON.stringify(fila) !== base;

  const guardar = () => {
    if (!fila.activo && m.activo && !window.confirm(`¿Desactivar a ${m.email}? No va a poder entrar al panel.`)) return;
    iniciar(async () => {
      const r = await actualizarMiembro({ id: m.id, ...fila });
      onListo({ ok: r.ok, texto: r.mensaje });
      if (r.ok) setBase(JSON.stringify(fila));
      else setFila(JSON.parse(base));
    });
  };

  return (
    <div className={`${styles.tablaFila} ${styles.tablaFilaMiembro}`}>
      <div>
        <p className={styles.miembroCorreo}>
          {m.email}
          {esYo ? " (vos)" : ""}
        </p>
        <p className={styles.miembroDetalle}>Último ingreso: {m.ultimoIngreso ? formatearFechaHora(m.ultimoIngreso) : "nunca"}</p>
      </div>
      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={`nombre-${m.id}`}>
          Nombre visible
        </label>
        <input
          id={`nombre-${m.id}`}
          className={styles.input}
          value={fila.nombreVisible}
          maxLength={120}
          onChange={(e) => setFila({ ...fila, nombreVisible: e.target.value })}
        />
      </div>
      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={`rol-${m.id}`}>
          Rol
        </label>
        <select
          id={`rol-${m.id}`}
          className={styles.select}
          value={fila.rol}
          disabled={esYo}
          title={esYo ? "Nadie puede cambiar su propio rol" : undefined}
          onChange={(e) => setFila({ ...fila, rol: e.target.value as Rol })}
        >
          {(Object.keys(NOMBRE_ROL) as Rol[]).map((r) => (
            <option key={r} value={r}>
              {NOMBRE_ROL[r]}
            </option>
          ))}
        </select>
      </div>
      <label className={styles.check}>
        <input type="checkbox" checked={fila.activo} disabled={esYo} onChange={(e) => setFila({ ...fila, activo: e.target.checked })} />
        Activo
      </label>
      <div className={styles.filaAcciones}>
        <button type="button" className={`${styles.boton} ${styles.botonChico}`} onClick={guardar} disabled={ocupado || !cambios}>
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export function AdminEquipo({ miembros, yoId }: { miembros: Miembro[]; yoId: string }) {
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  return (
    <div className={styles.bloque} style={{ marginTop: 0 }}>
      {mensaje ? (
        <p className={mensaje.ok ? styles.avisoOk : styles.avisoError} role={mensaje.ok ? "status" : "alert"}>
          {mensaje.texto}
        </p>
      ) : null}
      <div className={styles.tablaAdmin}>
        {miembros.map((m) => (
          <FilaMiembro key={m.id} m={m} esYo={m.id === yoId} onListo={setMensaje} />
        ))}
      </div>
    </div>
  );
}
