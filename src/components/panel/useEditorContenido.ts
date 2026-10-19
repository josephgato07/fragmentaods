"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { formatearHora } from "@/lib/panel/fechas";
import { accionesPermitidas } from "@/lib/panel/reglas";
import type { Accion, Estado, ResultadoGuardado, Rol } from "@/lib/panel/tipos";
import { useAvisoSalida } from "./useAvisoSalida";

export interface SituacionCliente {
  estado: Estado;
  publicadoEn: string | null;
  autorId: string | null;
}

export interface Mensaje {
  tipo: "ok" | "error";
  texto: string;
  hora?: string;
}

interface Opciones<F extends { id: string | null; slug: string; programarPara: string }> {
  inicial: F;
  situacionInicial: SituacionCliente | null;
  rol: Rol;
  usuarioId: string;
  guardar: (form: F, accion: Accion) => Promise<ResultadoGuardado>;
  validar: (form: F, accion: Accion, estadoActual: Estado | null) => Record<string, string>;
  rutaEdicion: (id: string) => string;
}

export function useEditorContenido<F extends { id: string | null; slug: string; programarPara: string }>(op: Opciones<F>) {
  const [form, setForm] = useState<F>(op.inicial);
  const [base, setBase] = useState(() => JSON.stringify(op.inicial));
  const [situacion, setSituacion] = useState<SituacionCliente>(
    op.situacionInicial ?? { estado: "borrador", publicadoEn: null, autorId: op.usuarioId },
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [pendiente, setPendiente] = useState<Accion | null>(null);
  const [, iniciarTransicion] = useTransition();
  const [ahora, setAhora] = useState(() => new Date());
  const resumenErrores = useRef<HTMLDivElement>(null);

  // Recalcula cada minuto: una nota programada pasa a "publicada" sola.
  useEffect(() => {
    const t = window.setInterval(() => setAhora(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const esNuevo = !form.id;
  const acciones = useMemo(
    () =>
      accionesPermitidas(
        op.rol,
        {
          estado: situacion.estado,
          publicadoEn: situacion.publicadoEn,
          esPropio: esNuevo || situacion.autorId === op.usuarioId,
          esNuevo,
        },
        ahora,
      ),
    [op.rol, op.usuarioId, situacion, esNuevo, ahora],
  );
  const soloLectura = acciones.length === 0;
  const hayCambios = JSON.stringify(form) !== base;
  useAvisoSalida(hayCambios && !soloLectura);

  const actualizar = useCallback(<K extends keyof F>(campo: K, valor: F[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => {
      if (!e[campo as string]) return e;
      const copia = { ...e };
      delete copia[campo as string];
      return copia;
    });
  }, []);

  const ejecutar = (accion: Accion) => {
    if (pendiente) return;
    if (accion === "despublicar" && !window.confirm("¿Despublicar? Va a dejar de verse en el portal (y en la portada) de inmediato.")) return;
    if (accion === "devolver_borrador" && !window.confirm("¿Devolver a borrador? Su autor podrá volver a editarlo.")) return;

    const locales = op.validar(form, accion, esNuevo ? null : situacion.estado);
    if (Object.keys(locales).length > 0) {
      setErrores(locales);
      setMensaje({ tipo: "error", texto: "Revisá los campos marcados antes de continuar." });
      requestAnimationFrame(() => resumenErrores.current?.focus());
      return;
    }

    setPendiente(accion);
    setMensaje(null);
    iniciarTransicion(async () => {
      let r: ResultadoGuardado;
      try {
        r = await op.guardar(form, accion);
      } catch {
        r = { ok: false, mensaje: "No hubo respuesta del servidor. Revisá la conexión: tus cambios siguen en pantalla." };
      }
      setPendiente(null);

      if (!r.ok) {
        setErrores(r.errores ?? {});
        setMensaje({ tipo: "error", texto: r.mensaje });
        requestAnimationFrame(() => resumenErrores.current?.focus());
        return;
      }

      const guardado = { ...form, id: r.id ?? form.id, slug: r.slug ?? form.slug, programarPara: "" } as F;
      setForm(guardado);
      setBase(JSON.stringify(guardado));
      setErrores({});
      setSituacion((s) => ({
        estado: r.estado ?? s.estado,
        publicadoEn: r.publicadoEn ?? null,
        autorId: s.autorId ?? op.usuarioId,
      }));
      setAhora(new Date());
      setMensaje({ tipo: "ok", texto: r.mensaje, hora: formatearHora(new Date()) });
      if (esNuevo && r.id) {
        // Cambia la URL a la de edición sin recargar el editor.
        window.history.replaceState(null, "", op.rutaEdicion(r.id));
      }
    });
  };

  return {
    form,
    setForm,
    actualizar,
    situacion,
    acciones,
    soloLectura,
    hayCambios,
    errores,
    mensaje,
    pendiente,
    ejecutar,
    esNuevo,
    ahora,
    resumenErrores,
  };
}
