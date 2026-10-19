"use client";

import { useState } from "react";
import { aEntradaLocal, formatearFechaHora } from "@/lib/panel/fechas";
import { estadoVisible, ETIQUETA_ACCION } from "@/lib/panel/reglas";
import type { Accion } from "@/lib/panel/tipos";
import { EstadoChip } from "./EstadoChip";
import type { Mensaje, SituacionCliente } from "./useEditorContenido";
import styles from "./panel.module.css";

interface Props {
  acciones: Accion[];
  situacion: SituacionCliente;
  ahora: Date;
  pendiente: Accion | null;
  hayCambios: boolean;
  mensaje: Mensaje | null;
  esNuevo: boolean;
  soloLectura: boolean;
  programarPara: string;
  errorProgramar?: string;
  onProgramarPara: (valor: string) => void;
  onAccion: (accion: Accion) => void;
  vistaPrevia: string | null;
  urlPublica: string | null;
}

export function BarraAcciones(p: Props) {
  // Controlado: si se abre por un error, no debe cerrarse solo cuando el error desaparece.
  const [abiertoProgramar, setAbiertoProgramar] = useState(false);
  const visible = estadoVisible(p.situacion.estado, p.situacion.publicadoEn, p.ahora);
  const tiene = (a: Accion) => p.acciones.includes(a);
  const ocupado = p.pendiente !== null;
  const textoBoton = (a: Accion) => (p.pendiente === a ? "Guardando…" : null);

  const etiquetaGuardar =
    visible === "publicado" ? "Guardar y actualizar" : visible === "programado" ? "Guardar cambios" : p.esNuevo ? "Guardar borrador" : "Guardar";

  return (
    <div className={styles.barraAcciones} role="region" aria-label="Estado y publicación">
      <div className={styles.estadoLinea}>
        <EstadoChip estado={p.situacion.estado} publicadoEn={p.situacion.publicadoEn} ahora={p.ahora} />
        {visible === "publicado" && p.situacion.publicadoEn ? <span>Publicado el {formatearFechaHora(p.situacion.publicadoEn)}</span> : null}
        {visible === "programado" && p.situacion.publicadoEn ? (
          <span>Se publica el {formatearFechaHora(p.situacion.publicadoEn)} (hora de Uruguay)</span>
        ) : null}
        {p.esNuevo ? <span>Sin guardar todavía</span> : null}
      </div>

      {p.soloLectura ? (
        <p className={styles.aviso}>
          Solo lectura: {visible === "en_revision" ? "está en revisión" : "ya fue publicado"} y solo un editor puede modificarlo.
        </p>
      ) : (
        <>
          <div className={styles.barraBotones}>
            {tiene("guardar") ? (
              <button type="button" className={styles.botonSecundario} disabled={ocupado} onClick={() => p.onAccion("guardar")}>
                {textoBoton("guardar") ?? etiquetaGuardar}
              </button>
            ) : null}
            {tiene("enviar_revision") ? (
              <button type="button" className={styles.boton} disabled={ocupado} onClick={() => p.onAccion("enviar_revision")}>
                {textoBoton("enviar_revision") ?? ETIQUETA_ACCION.enviar_revision}
              </button>
            ) : null}
            {tiene("publicar") ? (
              <button type="button" className={styles.botonMenta} disabled={ocupado} onClick={() => p.onAccion("publicar")}>
                {textoBoton("publicar") ?? ETIQUETA_ACCION.publicar}
              </button>
            ) : null}
            {tiene("devolver_borrador") ? (
              <button type="button" className={styles.botonSecundario} disabled={ocupado} onClick={() => p.onAccion("devolver_borrador")}>
                {textoBoton("devolver_borrador") ?? ETIQUETA_ACCION.devolver_borrador}
              </button>
            ) : null}
            {tiene("despublicar") ? (
              <button type="button" className={styles.botonPeligro} disabled={ocupado} onClick={() => p.onAccion("despublicar")}>
                {textoBoton("despublicar") ?? (visible === "programado" ? "Cancelar programación" : ETIQUETA_ACCION.despublicar)}
              </button>
            ) : null}
          </div>

          {tiene("programar") ? (
            <details
              className={styles.programar}
              open={abiertoProgramar || Boolean(p.errorProgramar)}
              onToggle={(e) => setAbiertoProgramar(e.currentTarget.open)}
            >
              <summary className={styles.etiqueta} style={{ cursor: "pointer" }}>
                {visible === "programado" ? "Cambiar fecha programada" : "Programar publicación"}
              </summary>
              <label className={styles.ayuda} htmlFor="programar-para">
                Fecha y hora de Uruguay
              </label>
              <div className={styles.programarFila}>
                <input
                  id="programar-para"
                  type="datetime-local"
                  className={styles.input}
                  value={p.programarPara}
                  min={aEntradaLocal(new Date(p.ahora.getTime() + 60_000).toISOString())}
                  aria-invalid={p.errorProgramar ? true : undefined}
                  onChange={(e) => p.onProgramarPara(e.target.value)}
                />
                <button type="button" className={styles.boton} disabled={ocupado} onClick={() => p.onAccion("programar")}>
                  {textoBoton("programar") ?? ETIQUETA_ACCION.programar}
                </button>
              </div>
              {p.errorProgramar ? <p className={styles.errorCampo}>{p.errorProgramar}</p> : null}
            </details>
          ) : null}
        </>
      )}

      <p className={styles.estadoGuardado} aria-live="polite">
        {p.mensaje?.tipo === "ok" ? (
          <>
            <strong>✓ {p.mensaje.texto}</strong> · {p.mensaje.hora}
          </>
        ) : p.hayCambios && !p.soloLectura ? (
          <span className={styles.sinGuardar}>Hay cambios sin guardar</span>
        ) : (
          ""
        )}
      </p>

      {p.vistaPrevia || p.urlPublica ? (
        <div className={styles.accesos}>
          {p.vistaPrevia ? (
            <a href={p.vistaPrevia} target="_blank" rel="noopener" className="enlace" style={{ fontSize: "0.875rem" }}>
              Vista previa privada{p.hayCambios ? " (de lo último guardado)" : ""}
            </a>
          ) : null}
          {p.urlPublica ? (
            <a href={p.urlPublica} target="_blank" rel="noopener" className="enlace" style={{ fontSize: "0.875rem" }}>
              Ver en el portal
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
