"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./estados.module.css";

/**
 * Error al cargar contenidos (por ejemplo, Supabase no responde).
 * "Reintentar" vuelve a pedir la página: es una operación real, no simulada.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={`contenedor ${styles.error}`} role="alert">
      <p className={styles.eyebrow}>Error de carga</p>
      <h1 className={styles.title}>No pudimos cargar los contenidos</h1>
      <p className={styles.text}>
        Puede ser un problema momentáneo de conexión con la base de datos. Probá de nuevo en unos segundos.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={reset}>
          Reintentar
        </button>
        <Link href="/" className="enlace">
          Ir a la portada
        </Link>
      </div>
      {error.digest ? <p className={styles.code}>Código de referencia: {error.digest}</p> : null}
    </div>
  );
}
