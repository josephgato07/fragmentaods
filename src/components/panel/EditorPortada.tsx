"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { guardarPortada } from "@/app/panel/_acciones/administracion";
import type { DatosPortada, OpcionPortada } from "@/lib/panel/datos";
import { formatearFechaHora, formatearHora } from "@/lib/panel/fechas";
import { useAvisoSalida } from "./useAvisoSalida";
import styles from "./panel.module.css";

const esFutura = (iso: string | null) => Boolean(iso && new Date(iso) > new Date());

function etiquetaOpcion(o: OpcionPortada) {
  const titulo = o.titulo.length > 90 ? `${o.titulo.slice(0, 90)}…` : o.titulo;
  const cuando = esFutura(o.publicadoEn) ? ` · programada ${formatearFechaHora(o.publicadoEn)}` : "";
  return `${o.detalle ? `${o.detalle}: ` : ""}${titulo}${cuando}`;
}

function Lista({
  titulo,
  ayuda,
  max,
  valores,
  opciones,
  bloqueados,
  onCambio,
  nombre,
}: {
  titulo: string;
  ayuda: string;
  max: number;
  valores: string[];
  opciones: OpcionPortada[];
  bloqueados: Set<string>;
  onCambio: (v: string[]) => void;
  nombre: string;
}) {
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= valores.length) return;
    const copia = [...valores];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onCambio(copia);
  };
  return (
    <section className={styles.zona} aria-labelledby={`zona-${nombre}`}>
      <h2 id={`zona-${nombre}`} className={styles.zonaTitulo}>
        {titulo} <small>{ayuda}</small>
      </h2>
      {valores.map((v, i) => (
        <div key={`${nombre}-${i}`} className={styles.slot}>
          <span className={styles.slotNumero} aria-hidden="true">
            {i + 1}
          </span>
          <div className={styles.campo}>
            <label className="solo-lectores" htmlFor={`${nombre}-${i}`}>
              {titulo}, posición {i + 1}
            </label>
            <select id={`${nombre}-${i}`} className={styles.select} value={v} onChange={(e) => onCambio(valores.map((x, k) => (k === i ? e.target.value : x)))}>
              <option value="">Elegí…</option>
              {opciones.map((o) => (
                <option key={o.id} value={o.id} disabled={bloqueados.has(o.id) && o.id !== v}>
                  {etiquetaOpcion(o)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.slotBotones}>
            <button type="button" className={styles.botonIcono} onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir posición ${i + 1}`}>
              ↑
            </button>
            <button
              type="button"
              className={styles.botonIcono}
              onClick={() => mover(i, 1)}
              disabled={i === valores.length - 1}
              aria-label={`Bajar posición ${i + 1}`}
            >
              ↓
            </button>
            <button type="button" className={styles.botonIcono} onClick={() => onCambio(valores.filter((_, k) => k !== i))} aria-label={`Quitar posición ${i + 1}`}>
              ✕
            </button>
          </div>
        </div>
      ))}
      {valores.length < max ? (
        <button type="button" className={`${styles.botonSecundario} ${styles.botonChico}`} onClick={() => onCambio([...valores, ""])}>
          + Agregar posición
        </button>
      ) : null}
    </section>
  );
}

export function EditorPortada({ datos }: { datos: DatosPortada }) {
  const inicial = { apertura: datos.apertura ?? "", secundarias: datos.secundarias, destacados: datos.destacados };
  const [estado, setEstado] = useState(inicial);
  const [base, setBase] = useState(JSON.stringify(inicial));
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, iniciar] = useTransition();
  const hayCambios = JSON.stringify(estado) !== base;
  useAvisoSalida(hayCambios);

  const notasUsadas = useMemo(() => new Set([estado.apertura, ...estado.secundarias].filter(Boolean)), [estado]);
  const destacadosUsados = useMemo(() => new Set(estado.destacados.filter(Boolean)), [estado]);

  const guardar = () => {
    setMensaje(null);
    iniciar(async () => {
      try {
        const r = await guardarPortada({
          apertura: estado.apertura || null,
          secundarias: estado.secundarias.filter(Boolean),
          destacados: estado.destacados.filter(Boolean),
        });
        if (r.ok) {
          const limpio = { ...estado, secundarias: estado.secundarias.filter(Boolean), destacados: estado.destacados.filter(Boolean) };
          setEstado(limpio);
          setBase(JSON.stringify(limpio));
          setMensaje({ ok: true, texto: `${r.mensaje} · ${formatearHora(new Date())}` });
        } else {
          setMensaje({ ok: false, texto: r.mensaje });
        }
      } catch {
        setMensaje({ ok: false, texto: "No hubo respuesta del servidor. Revisá la conexión e intentá de nuevo." });
      }
    });
  };

  return (
    <div className={styles.portada}>
      <p className={styles.ayuda}>
        Solo se pueden elegir notas y destacados publicados o programados. Una nota programada aparece en su lugar cuando llega su hora.
        Si dejás lugares vacíos, el portal los completa con las notas más recientes.
      </p>

      <section className={styles.zona} aria-labelledby="zona-apertura">
        <h2 id="zona-apertura" className={styles.zonaTitulo}>
          Apertura <small>La noticia principal</small>
        </h2>
        <div className={styles.slot}>
          <span className={styles.slotNumero} aria-hidden="true">
            1
          </span>
          <div className={styles.campo}>
            <label className="solo-lectores" htmlFor="apertura">
              Noticia de apertura
            </label>
            <select id="apertura" className={styles.select} value={estado.apertura} onChange={(e) => setEstado({ ...estado, apertura: e.target.value })}>
              <option value="">Elegí la noticia principal…</option>
              {datos.notas.map((o) => (
                <option key={o.id} value={o.id} disabled={notasUsadas.has(o.id) && o.id !== estado.apertura}>
                  {etiquetaOpcion(o)}
                </option>
              ))}
            </select>
          </div>
          <span />
        </div>
      </section>

      <Lista
        titulo="Secundarias"
        ayuda="Hasta 3, en este orden"
        max={3}
        nombre="secundaria"
        valores={estado.secundarias}
        opciones={datos.notas}
        bloqueados={notasUsadas}
        onCambio={(v) => setEstado({ ...estado, secundarias: v })}
      />

      <p><Link className="enlace" href="/panel/destacados" onClick={e => { if (hayCambios && !window.confirm("Hay cambios de portada sin guardar. ¿Salir igualmente?")) e.preventDefault(); }}>Crear o editar destacados →</Link></p>

      <Lista
        titulo="Destacados"
        ayuda="Cifra, cita o fotografía · hasta 6"
        max={6}
        nombre="destacado"
        valores={estado.destacados}
        opciones={datos.opcionesDestacados}
        bloqueados={destacadosUsados}
        onCambio={(v) => setEstado({ ...estado, destacados: v })}
      />

      <div className={styles.barraAccionesSimple}>
        {mensaje ? (
          <p className={mensaje.ok ? styles.avisoOk : styles.avisoError} role={mensaje.ok ? "status" : "alert"}>
            {mensaje.texto}
          </p>
        ) : hayCambios ? (
          <p className={`${styles.estadoGuardado} ${styles.sinGuardar}`}>Hay cambios sin guardar</p>
        ) : null}
        <div className={styles.accesos}>
          <button type="button" className={styles.botonMenta} onClick={guardar} disabled={guardando || !hayCambios}>
            {guardando ? "Guardando…" : "Guardar portada"}
          </button>
          <a href="/" target="_blank" rel="noopener" className="enlace">
            Ver la portada
          </a>
        </div>
      </div>
    </div>
  );
}
