"use client";

import { useMemo, useRef, useState } from "react";
import type { Inline } from "@/lib/content/types";
import { HREF_VALIDO, LIMITES } from "@/lib/panel/reglas";
import type { BloqueForm, ImagenForm } from "@/lib/panel/tipos";
import { CampoImagen } from "./CampoImagen";
import { ParrafoEditable } from "./ParrafoEditable";
import styles from "./panel.module.css";

export const nuevoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

interface Props {
  bloques: BloqueForm[];
  /** Actualización funcional: siempre parte del último estado (evita perder cambios encadenados). */
  actualizar: (cambio: (previos: BloqueForm[]) => BloqueForm[]) => void;
  /** "nota" admite imágenes en el cuerpo; "fragmento", solo párrafos. */
  modo: "nota" | "fragmento";
  deshabilitado?: boolean;
  error?: string;
}

/**
 * Editor visual del cuerpo. El resultado es siempre el JSON que usa el portal:
 * párrafos con texto, énfasis (subrayado) y enlaces, e imágenes en las notas.
 */
export function EditorBloques({ bloques, actualizar, modo, deshabilitado = false, error }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [enfocarId, setEnfocarId] = useState<string | null>(null);
  const [ayuda, setAyuda] = useState("");
  const [enlace, setEnlace] = useState<{ abierto: boolean; valor: string; rango: Range | null; error: string }>({
    abierto: false,
    valor: "https://",
    rango: null,
    error: "",
  });

  const enfasisLargo = useMemo(
    () =>
      bloques.some(
        (b) => b.type === "parrafo" && b.content.some((p) => typeof p !== "string" && p.type === "enfasis" && p.text.length > LIMITES.enfasis),
      ),
    [bloques],
  );

  /* ——— Operaciones sobre la lista ——— */
  const reemplazar = (id: string, cambio: Partial<BloqueForm>) =>
    actualizar((previos) => previos.map((b) => (b.id === id ? ({ ...b, ...cambio } as BloqueForm) : b)));

  const insertarDespues = (id: string | null, nuevos: BloqueForm[]) => {
    actualizar((previos) => {
      const i = id ? previos.findIndex((b) => b.id === id) : previos.length - 1;
      const copia = [...previos];
      copia.splice(i + 1, 0, ...nuevos);
      return copia;
    });
    if (nuevos[0]) setEnfocarId(nuevos[0].id);
  };

  const mover = (id: string, delta: -1 | 1) =>
    actualizar((previos) => {
      const i = previos.findIndex((b) => b.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= previos.length) return previos;
      const copia = [...previos];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });

  const eliminar = (id: string, confirmar: boolean) => {
    if (confirmar && !window.confirm("¿Eliminar este bloque del cuerpo?")) return;
    const i = bloques.findIndex((b) => b.id === id);
    actualizar((previos) => previos.filter((b) => b.id !== id));
    // Llevar el cursor al final del párrafo anterior
    const anterior = bloques[i - 1];
    if (anterior) {
      requestAnimationFrame(() => {
        const el = contenedor.current?.querySelector<HTMLElement>(`[data-bloque="${anterior.id}"] [data-parrafo-editable]`);
        if (!el) return;
        el.focus();
        const rango = document.createRange();
        rango.selectNodeContents(el);
        rango.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(rango);
      });
    }
  };

  const parrafo = (content: Inline[] = []): BloqueForm => ({ id: nuevoId(), type: "parrafo", content });

  /* ——— Barra de formato ——— */
  const parrafoActivo = (): HTMLElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const nodo = sel.anchorNode;
    const el = (nodo instanceof Element ? nodo : nodo?.parentElement)?.closest<HTMLElement>("[data-parrafo-editable]");
    return el && contenedor.current?.contains(el) ? el : null;
  };

  const exigirSeleccion = (): Range | null => {
    const sel = window.getSelection();
    if (!parrafoActivo() || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setAyuda("Seleccioná primero el texto dentro de un párrafo.");
      return null;
    }
    setAyuda("");
    return sel.getRangeAt(0);
  };

  const enfasis = () => {
    if (!exigirSeleccion()) return;
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand("underline");
  };

  const abrirEnlace = () => {
    const rango = exigirSeleccion();
    if (!rango) return;
    setEnlace({ abierto: true, valor: "https://", rango: rango.cloneRange(), error: "" });
  };

  const aplicarEnlace = () => {
    const href = enlace.valor.trim();
    if (!HREF_VALIDO.test(href)) {
      setEnlace((e) => ({ ...e, error: "Usá una dirección https://… o una ruta interna del portal que empiece con /" }));
      return;
    }
    const sel = window.getSelection();
    if (enlace.rango && sel) {
      const el = (enlace.rango.commonAncestorContainer instanceof Element
        ? enlace.rango.commonAncestorContainer
        : enlace.rango.commonAncestorContainer.parentElement
      )?.closest<HTMLElement>("[data-parrafo-editable]");
      el?.focus();
      sel.removeAllRanges();
      sel.addRange(enlace.rango);
      document.execCommand("createLink", false, href);
    }
    setEnlace({ abierto: false, valor: "https://", rango: null, error: "" });
  };

  const quitarEnlace = () => {
    const sel = window.getSelection();
    const activo = parrafoActivo();
    if (!activo || !sel || sel.rangeCount === 0) {
      setAyuda("Poné el cursor sobre el enlace que querés quitar.");
      return;
    }
    if (sel.isCollapsed) {
      const nodo = sel.anchorNode;
      const a = (nodo instanceof Element ? nodo : nodo?.parentElement)?.closest("a");
      if (a) {
        const rango = document.createRange();
        rango.selectNodeContents(a);
        sel.removeAllRanges();
        sel.addRange(rango);
      }
    }
    setAyuda("");
    document.execCommand("unlink");
  };

  const limpiarFormato = () => {
    if (!exigirSeleccion()) return;
    document.execCommand("removeFormat");
    document.execCommand("unlink");
  };

  const sinPerderSeleccion = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className={styles.campo} ref={contenedor}>
      <span className={styles.etiqueta} id={`cuerpo-${modo}`}>
        {modo === "nota" ? "Cuerpo de la nota" : "Texto del fragmento"}
      </span>

      {!deshabilitado ? (
        <div className={styles.barraFormato} role="toolbar" aria-label="Formato del texto">
          <button type="button" onMouseDown={sinPerderSeleccion} onClick={enfasis} title="Subrayar la frase central (Ctrl+U)">
            <u>Énfasis</u>
          </button>
          <button type="button" onMouseDown={sinPerderSeleccion} onClick={abrirEnlace}>
            Enlace
          </button>
          <button type="button" onMouseDown={sinPerderSeleccion} onClick={quitarEnlace}>
            Quitar enlace
          </button>
          <button type="button" onMouseDown={sinPerderSeleccion} onClick={limpiarFormato}>
            Quitar formato
          </button>
          <span className={styles.barraFormatoAyuda}>Enter crea un párrafo nuevo</span>
          {enlace.abierto ? (
            <div className={styles.enlaceForm}>
              <label className="solo-lectores" htmlFor={`enlace-${modo}`}>
                Dirección del enlace
              </label>
              <input
                id={`enlace-${modo}`}
                className={styles.input}
                value={enlace.valor}
                autoFocus
                inputMode="url"
                onChange={(e) => setEnlace((s) => ({ ...s, valor: e.target.value, error: "" }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    aplicarEnlace();
                  }
                  if (e.key === "Escape") setEnlace({ abierto: false, valor: "https://", rango: null, error: "" });
                }}
                aria-invalid={enlace.error ? true : undefined}
              />
              <button type="button" onClick={aplicarEnlace}>
                Aplicar
              </button>
              <button type="button" onClick={() => setEnlace({ abierto: false, valor: "https://", rango: null, error: "" })}>
                Cancelar
              </button>
              {enlace.error ? <span className={styles.errorCampo}>{enlace.error}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <p className={styles.ayuda} aria-live="polite">
        {ayuda ||
          (modo === "fragmento"
            ? "Subrayá solo la frase central de cada párrafo, como en el kit."
            : "El énfasis subraya una frase; los enlaces llevan subrayado menta.")}
      </p>
      {enfasisLargo ? (
        <p className={styles.errorCampo}>
          Hay un énfasis de más de {LIMITES.enfasis} caracteres: subrayá solo la frase central, no el párrafo entero.
        </p>
      ) : null}

      <div className={styles.bloques} aria-labelledby={`cuerpo-${modo}`}>
        {bloques.map((b, i) => (
          <div key={b.id} className={styles.bloqueItem} data-bloque={b.id}>
            <div>
              {b.type === "parrafo" ? (
                <ParrafoEditable
                  inicial={b.content}
                  enfocar={enfocarId === b.id}
                  etiqueta={`Párrafo ${i + 1}`}
                  deshabilitado={deshabilitado}
                  esFragmento={modo === "fragmento"}
                  onCambio={(content) => reemplazar(b.id, { content })}
                  onPartir={(despues) => insertarDespues(b.id, [parrafo(despues)])}
                  onBorrarVacio={() => (bloques.length > 1 ? eliminar(b.id, false) : undefined)}
                  onPegarParrafos={(textos) => insertarDespues(b.id, textos.map((t) => parrafo([t])))}
                />
              ) : b.type === "imagen" ? (
                <div className={styles.bloqueImagen}>
                  <p className={styles.bloqueEtiqueta}>Imagen dentro del cuerpo</p>
                  <CampoImagen
                    valor={b.imagen}
                    carpeta="notas"
                    conPie
                    deshabilitado={deshabilitado}
                    etiqueta={`Imagen del cuerpo ${i + 1}`}
                    onCambio={(imagen: ImagenForm | null) => reemplazar(b.id, { imagen })}
                  />
                </div>
              ) : (
                <div className={styles.bloquePendiente}>
                  <label className={styles.bloqueEtiqueta} htmlFor={`pend-${b.id}`}>
                    Aviso de texto pendiente (se muestra en el portal)
                  </label>
                  <textarea
                    id={`pend-${b.id}`}
                    className={styles.textarea}
                    value={b.note}
                    disabled={deshabilitado}
                    maxLength={600}
                    onChange={(e) => reemplazar(b.id, { note: e.target.value })}
                  />
                </div>
              )}
            </div>
            {!deshabilitado ? (
              <div className={styles.bloqueControles}>
                <button type="button" className={styles.botonIcono} onClick={() => mover(b.id, -1)} disabled={i === 0} aria-label={`Subir bloque ${i + 1}`}>
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.botonIcono}
                  onClick={() => mover(b.id, 1)}
                  disabled={i === bloques.length - 1}
                  aria-label={`Bajar bloque ${i + 1}`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.botonIcono}
                  onClick={() => eliminar(b.id, b.type !== "parrafo" || b.content.length > 0)}
                  aria-label={`Eliminar bloque ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {!deshabilitado ? (
        <div className={styles.agregarBloques}>
          <button type="button" className={`${styles.botonSecundario} ${styles.botonChico}`} onClick={() => insertarDespues(null, [parrafo()])}>
            + Párrafo
          </button>
          {modo === "nota" ? (
            <button
              type="button"
              className={`${styles.botonSecundario} ${styles.botonChico}`}
              onClick={() => insertarDespues(null, [{ id: nuevoId(), type: "imagen", imagen: null }])}
            >
              + Imagen en el cuerpo
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className={styles.errorCampo} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
