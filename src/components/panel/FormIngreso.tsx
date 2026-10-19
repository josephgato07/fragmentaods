"use client";

import { useActionState } from "react";
import { ingresar, type EstadoIngreso } from "@/app/panel/_acciones/sesion";
import styles from "./panel.module.css";

export function FormIngreso({ destino, aviso }: { destino: string; aviso: string | null }) {
  const [estado, accion, enviando] = useActionState<EstadoIngreso, FormData>(ingresar, { error: null, email: "" });

  return (
    <form action={accion} className={styles.ingresoCaja} noValidate>
      <input type="hidden" name="destino" value={destino} />
      {estado.error ? (
        <p className={styles.avisoError} role="alert">
          {estado.error}
        </p>
      ) : aviso ? (
        <p className={styles.aviso} role="status">
          {aviso}
        </p>
      ) : null}
      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor="email">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={styles.input}
          defaultValue={estado.email}
          autoFocus
        />
      </div>
      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor="password">
          Contraseña
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={styles.input} />
      </div>
      <button type="submit" className={styles.boton} disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
      <p className={styles.ayuda}>
        El acceso es solo para el equipo editorial. Si olvidaste la contraseña o necesitás una cuenta, pedíselo a un administrador.
      </p>
    </form>
  );
}
