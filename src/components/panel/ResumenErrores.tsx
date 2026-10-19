"use client";

import type { RefObject } from "react";
import type { Mensaje } from "./useEditorContenido";
import styles from "./panel.module.css";

const NOMBRES: Record<string, string> = {
  titulo: "Título",
  palabraClave: "Palabra clave",
  slug: "Dirección",
  bajada: "Bajada",
  etiqueta: "Etiqueta",
  lugar: "Lugar",
  firma: "Firma",
  categoriaId: "Categoría",
  fuentes: "Fuentes",
  imagen: "Imagen",
  cuerpo: "Cuerpo",
  programarPara: "Programación",
};

/** Mensaje de error al principio del formulario, con la lista de campos a revisar. */
export function ResumenErrores({
  refFoco,
  mensaje,
  errores,
}: {
  refFoco: RefObject<HTMLDivElement | null>;
  mensaje: Mensaje | null;
  errores: Record<string, string>;
}) {
  const lista = Object.entries(errores);
  if (mensaje?.tipo !== "error" && lista.length === 0) return <div ref={refFoco} tabIndex={-1} />;
  return (
    <div ref={refFoco} tabIndex={-1} className={styles.avisoError} role="alert">
      {mensaje?.tipo === "error" ? mensaje.texto : "Revisá los campos marcados."}
      {lista.length > 0 ? (
        <ul>
          {lista.map(([campo, texto]) => (
            <li key={campo}>
              <strong>{NOMBRES[campo] ?? campo}:</strong> {texto}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
