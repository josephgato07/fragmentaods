"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LinkIcon, ShareIcon } from "./Icons";
import styles from "./ShareButtons.module.css";

const FALLBACK_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Compartir: menú nativo del dispositivo (si existe), redes con enlaces reales
 * y copia del enlace. Si el portapapeles no está disponible, se muestra el enlace
 * seleccionado para copiarlo a mano.
 */
export function ShareButtons({ path, title }: { path: string; title: string }) {
  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (status === "manual") inputRef.current?.select();
    if (status !== "copied") return;
    const t = window.setTimeout(() => setStatus("idle"), 3000);
    return () => window.clearTimeout(t);
  }, [status]);

  const url = `${origin}${path}`;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const networks = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: "X", href: `https://x.com/intent/post?text=${t}&url=${u}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
  ];

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("sin portapapeles");
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch (error) {
      // Cancelar el menú no es un error; si falló por otra razón, ofrecer copiar.
      if ((error as DOMException)?.name !== "AbortError") setStatus("manual");
    }
  };

  return (
    <div className={styles.share}>
      <p className={styles.label}>Compartir</p>
      <ul className={styles.list}>
        {canNativeShare ? (
          <li>
            <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={nativeShare}>
              <ShareIcon size={16} />
              Compartir…
            </button>
          </li>
        ) : null}
        {networks.map((n) => (
          <li key={n.label}>
            <a className={styles.btn} href={n.href} target="_blank" rel="noopener noreferrer">
              {n.label}
              <span className="solo-lectores"> (abre en una pestaña nueva)</span>
            </a>
          </li>
        ))}
        <li>
          <button type="button" className={styles.btn} onClick={copy}>
            <LinkIcon size={16} />
            {status === "copied" ? "Enlace copiado" : "Copiar enlace"}
          </button>
        </li>
      </ul>

      <p className="solo-lectores" aria-live="polite">
        {status === "copied" ? "Enlace copiado al portapapeles" : ""}
      </p>

      {status === "manual" ? (
        <div className={styles.manual}>
          <label htmlFor={inputId}>No se pudo copiar automáticamente. Copiá este enlace:</label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      ) : null}
    </div>
  );
}
