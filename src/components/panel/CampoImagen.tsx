"use client";

import { useId, useRef, useState } from "react";
import { BUCKET, urlImagen } from "@/lib/panel/imagen-url";
import { EXTENSION_POR_TIPO, LIMITES, TIPOS_IMAGEN } from "@/lib/panel/reglas";
import type { ImagenForm } from "@/lib/panel/tipos";
import { getBrowserClient } from "@/lib/supabase/browser";
import styles from "./panel.module.css";

interface Props {
  valor: ImagenForm | null;
  onCambio: (imagen: ImagenForm | null) => void;
  carpeta: "notas" | "fragmentos" | "destacados" | "general";
  etiqueta: string;
  conPie?: boolean;
  obligatoria?: boolean;
  deshabilitado?: boolean;
  error?: string;
  onSubiendo?: (subiendo: boolean) => void;
}

function medidas(archivo: File): Promise<{ ancho: number; alto: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      resolve({ ancho: img.naturalWidth, alto: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen. Probá con otro archivo."));
    };
    img.src = url;
  });
}

function mensajeSubida(error: { message?: string; statusCode?: string | number }): string {
  const texto = (error.message ?? "").toLowerCase();
  const codigo = String(error.statusCode ?? "");
  if (codigo === "413" || texto.includes("maximum allowed size") || texto.includes("too large"))
    return "La imagen supera los 10 MB permitidos. Reducila o exportala con más compresión.";
  if (codigo === "415" || texto.includes("mime type")) return "Formato no permitido. Usá JPEG, PNG, WebP o AVIF.";
  if (codigo === "403" || texto.includes("row-level security") || texto.includes("unauthorized"))
    return "No tenés permiso para subir imágenes. Verificá que tu usuario esté activo.";
  if (codigo === "409" || texto.includes("already exists")) return "Ya existe una imagen con ese nombre. Intentá de nuevo.";
  return "No se pudo subir la imagen. Revisá la conexión e intentá de nuevo.";
}

/**
 * Subida al bucket "imagenes-editoriales" directamente desde el navegador con la
 * sesión del usuario: Supabase aplica los límites del bucket (10 MB, formatos) y
 * las políticas de Storage (solo equipo activo, carpetas permitidas).
 */
export function CampoImagen({ valor, onCambio, carpeta, etiqueta, conPie = false, obligatoria = false, deshabilitado = false, error, onSubiendo }: Props) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState("");
  const [arrastrando, setArrastrando] = useState(false);

  const subir = async (archivo: File) => {
    setErrorSubida("");
    if (!(TIPOS_IMAGEN as readonly string[]).includes(archivo.type)) {
      setErrorSubida("Formato no permitido. Usá JPEG, PNG, WebP o AVIF.");
      return;
    }
    if (archivo.size > LIMITES.imagenBytes) {
      setErrorSubida(`La imagen pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB y el máximo es 10 MB.`);
      return;
    }
    setSubiendo(true);
    onSubiendo?.(true);
    try {
      const { ancho, alto } = await medidas(archivo);
      const hoy = new Date();
      const nombre = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
      const ruta = `${carpeta}/${hoy.getFullYear()}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${nombre}.${EXTENSION_POR_TIPO[archivo.type]}`;
      const { error: errorStorage } = await getBrowserClient()
        .storage.from(BUCKET)
        .upload(ruta, archivo, { contentType: archivo.type, cacheControl: "31536000", upsert: false });
      if (errorStorage) {
        setErrorSubida(mensajeSubida(errorStorage as { message?: string; statusCode?: string }));
        return;
      }
      onCambio({
        ruta,
        ancho,
        alto,
        alt: valor?.alt ?? "",
        credito: valor?.credito ?? "",
        pie: valor?.pie ?? "",
        foco: "50% 50%",
        ajuste: valor?.ajuste ?? "cover",
      });
    } catch (e) {
      setErrorSubida(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
      onSubiendo?.(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const elegirFoco = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!valor || deshabilitado) return;
    const img = e.currentTarget.querySelector("img");
    if (!img) return;
    const r = img.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)));
    onCambio({ ...valor, foco: `${x}% ${y}%` });
  };

  const [fx, fy] = (valor?.foco ?? "50% 50%").split(" ").map((v) => parseFloat(v));
  const mensajeError = errorSubida || error;

  return (
    <div className={styles.imagenCampo}>
      <span className={styles.etiqueta} id={`${id}-titulo`}>
        {etiqueta}
        {obligatoria ? " (obligatoria para publicar)" : ""}
      </span>

      <input
        ref={entrada}
        id={`${id}-archivo`}
        type="file"
        accept={TIPOS_IMAGEN.join(",")}
        hidden
        tabIndex={-1}
        aria-hidden="true"
        disabled={deshabilitado || subiendo}
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) void subir(archivo);
        }}
      />

      {valor ? (
        <>
          <div className={styles.vistaImagen} onClick={elegirFoco} title="Tocá la imagen para marcar el punto de interés del recorte">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlImagen(valor.ruta)} alt={valor.alt || "Vista previa de la imagen"} />
            {valor.ajuste === "cover" ? <span className={styles.foco} style={{ left: `${fx}%`, top: `${fy}%` }} aria-hidden="true" /> : null}
          </div>
          <p className={styles.ayuda}>
            {valor.ancho} × {valor.alto} px.{" "}
            {valor.ajuste === "cover" ? "Tocá la imagen para elegir qué parte se conserva al recortar." : "Se muestra completa, sin recorte."}
          </p>
          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor={`${id}-alt`}>
              Texto alternativo (obligatorio)
            </label>
            <textarea
              id={`${id}-alt`}
              className={styles.textarea}
              rows={2}
              value={valor.alt}
              maxLength={LIMITES.alt}
              disabled={deshabilitado}
              placeholder="Qué se ve en la foto, para quien no puede verla"
              aria-invalid={mensajeError?.includes("alternativo") ? true : undefined}
              onChange={(e) => onCambio({ ...valor, alt: e.target.value })}
            />
          </div>
          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor={`${id}-credito`}>
              Crédito
            </label>
            <input
              id={`${id}-credito`}
              className={styles.input}
              value={valor.credito}
              maxLength={LIMITES.credito}
              disabled={deshabilitado}
              placeholder="Nombre de quien tomó la foto / agencia"
              onChange={(e) => onCambio({ ...valor, credito: e.target.value })}
            />
          </div>
          {conPie ? (
            <div className={styles.campo}>
              <label className={styles.etiqueta} htmlFor={`${id}-pie`}>
                Pie de foto
              </label>
              <input
                id={`${id}-pie`}
                className={styles.input}
                value={valor.pie}
                maxLength={LIMITES.pie}
                disabled={deshabilitado}
                onChange={(e) => onCambio({ ...valor, pie: e.target.value })}
              />
            </div>
          ) : null}
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={valor.ajuste === "contain"}
              disabled={deshabilitado}
              onChange={(e) => onCambio({ ...valor, ajuste: e.target.checked ? "contain" : "cover" })}
            />
            Mostrar completa, sin recortar (gráficos, infografías)
          </label>
          {!deshabilitado ? (
            <div className={styles.imagenAcciones}>
              <button
                type="button"
                className={`${styles.botonSecundario} ${styles.botonChico}`}
                disabled={subiendo}
                onClick={() => entrada.current?.click()}
              >
                {subiendo ? "Subiendo…" : "Reemplazar"}
              </button>
              <button
                type="button"
                className={`${styles.botonPeligro} ${styles.botonChico}`}
                onClick={() => {
                  if (window.confirm("¿Quitar la imagen? El archivo queda guardado en Storage.")) onCambio(null);
                }}
              >
                Quitar imagen
              </button>
            </div>
          ) : null}
        </>
      ) : deshabilitado ? (
        <p className={styles.ayuda}>Sin imagen.</p>
      ) : (
        <button
          type="button"
          disabled={subiendo}
          aria-describedby={`${id}-titulo`}
          onClick={() => entrada.current?.click()}
          className={`${styles.zonaSubida} ${arrastrando ? styles.zonaSubidaActiva : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            const archivo = e.dataTransfer.files?.[0];
            if (archivo) void subir(archivo);
          }}
        >
          <span>{subiendo ? "Subiendo imagen…" : "Elegí una imagen o arrastrala acá"}</span>
          <small>JPEG, PNG, WebP o AVIF · hasta 10 MB</small>
        </button>
      )}

      <p aria-live="polite" className={mensajeError ? styles.errorCampo : "solo-lectores"}>
        {mensajeError || (subiendo ? "Subiendo imagen" : "")}
      </p>
    </div>
  );
}
