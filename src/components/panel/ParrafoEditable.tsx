"use client";

import { useEffect, useRef } from "react";
import type { Inline } from "@/lib/content/types";
import { domAInlines, inlinesAHtml, partirEnParrafos } from "@/lib/panel/editor-dom";
import styles from "./panel.module.css";

interface Props {
  inicial: Inline[];
  onCambio: (content: Inline[]) => void;
  /** Enter: el texto que queda después del cursor pasa a un párrafo nuevo. */
  onPartir: (despues: Inline[]) => void;
  /** Borrar en un párrafo vacío lo elimina. */
  onBorrarVacio: () => void;
  /** Al pegar varios párrafos, los siguientes se agregan como bloques nuevos. */
  onPegarParrafos: (parrafos: string[]) => void;
  enfocar: boolean;
  etiqueta: string;
  deshabilitado?: boolean;
  esFragmento?: boolean;
}

/**
 * Un párrafo editable. Solo admite texto, subrayado (énfasis) y enlaces.
 * El contenido se carga una vez al montar; después el DOM es la fuente de verdad
 * y cada cambio se convierte a JSON con domAInlines.
 */
export function ParrafoEditable({
  inicial,
  onCambio,
  onPartir,
  onBorrarVacio,
  onPegarParrafos,
  enfocar,
  etiqueta,
  deshabilitado = false,
  esFragmento = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = inlinesAHtml(inicial);
    if (enfocar) {
      el.focus();
      const sel = window.getSelection();
      const rango = document.createRange();
      rango.selectNodeContents(el);
      rango.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(rango);
    }
    // Solo al montar: después el DOM manda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitir = () => {
    if (ref.current) onCambio(domAInlines(ref.current));
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === "b" || e.key === "i" || e.key === "B" || e.key === "I")) {
      // Negrita y cursiva no forman parte del formato editorial.
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const rango = sel.getRangeAt(0);
      if (!rango.collapsed) rango.deleteContents();
      const cola = document.createRange();
      cola.selectNodeContents(el);
      cola.setStart(rango.endContainer, rango.endOffset);
      const contenedor = document.createElement("div");
      contenedor.appendChild(cola.extractContents());
      onCambio(domAInlines(el));
      onPartir(domAInlines(contenedor));
      return;
    }
    if (e.key === "Backspace" && (el.textContent ?? "").length === 0) {
      e.preventDefault();
      onBorrarVacio();
    }
  };

  const alPegar = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Solo texto: nada de estilos ni HTML de otras páginas.
    e.preventDefault();
    const parrafos = partirEnParrafos(e.clipboardData.getData("text/plain"));
    if (parrafos.length === 0) return;
    document.execCommand("insertText", false, parrafos[0]);
    if (parrafos.length > 1) onPegarParrafos(parrafos.slice(1));
    emitir();
  };

  return (
    <div
      ref={ref}
      className={`${styles.parrafoEditable} ${esFragmento ? styles.parrafoEditableFragmento : ""}`}
      contentEditable={!deshabilitado}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={etiqueta}
      aria-disabled={deshabilitado || undefined}
      data-placeholder="Escribí el párrafo…"
      data-parrafo-editable=""
      spellCheck
      lang="es"
      onInput={emitir}
      onKeyDown={alTeclear}
      onPaste={alPegar}
      onDrop={(e) => e.preventDefault()}
    />
  );
}
