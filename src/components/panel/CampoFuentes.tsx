"use client";

import { LIMITES } from "@/lib/panel/reglas";
import type { FuenteForm } from "@/lib/panel/tipos";
import styles from "./panel.module.css";

export function CampoFuentes({
  fuentes,
  onCambio,
  deshabilitado = false,
  error,
}: {
  fuentes: FuenteForm[];
  onCambio: (fuentes: FuenteForm[]) => void;
  deshabilitado?: boolean;
  error?: string;
}) {
  const cambiar = (i: number, campo: keyof FuenteForm, valor: string) =>
    onCambio(fuentes.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));

  return (
    <fieldset className={styles.fuentes} style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className={styles.etiqueta}>Fuentes</legend>
      {fuentes.length === 0 ? <p className={styles.ayuda}>Sin fuentes cargadas.</p> : null}
      {fuentes.map((f, i) => (
        <div key={i} className={styles.fuenteFila}>
          <div className={styles.fuenteCampos}>
            <label className="solo-lectores" htmlFor={`fuente-nombre-${i}`}>
              Nombre de la fuente {i + 1}
            </label>
            <input
              id={`fuente-nombre-${i}`}
              className={styles.input}
              value={f.label}
              maxLength={LIMITES.fuente}
              disabled={deshabilitado}
              placeholder="Institución, documento o medio"
              onChange={(e) => cambiar(i, "label", e.target.value)}
            />
            <label className="solo-lectores" htmlFor={`fuente-url-${i}`}>
              Dirección de la fuente {i + 1} (opcional)
            </label>
            <input
              id={`fuente-url-${i}`}
              className={styles.input}
              value={f.url}
              inputMode="url"
              disabled={deshabilitado}
              placeholder="https:// (opcional)"
              onChange={(e) => cambiar(i, "url", e.target.value)}
            />
          </div>
          {!deshabilitado ? (
            <button
              type="button"
              className={styles.botonIcono}
              aria-label={`Quitar fuente ${i + 1}`}
              onClick={() => onCambio(fuentes.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          ) : null}
        </div>
      ))}
      {!deshabilitado && fuentes.length < LIMITES.fuentes ? (
        <button
          type="button"
          className={`${styles.botonSecundario} ${styles.botonChico}`}
          onClick={() => onCambio([...fuentes, { label: "", url: "" }])}
        >
          + Agregar fuente
        </button>
      ) : null}
      {error ? <p className={styles.errorCampo}>{error}</p> : null}
    </fieldset>
  );
}
