"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { guardarDestacado } from "@/app/panel/_acciones/destacados";
import { destacadoVacio, type DestacadoForm, type NotaDestacable } from "@/lib/panel/destacados";
import { CampoImagen } from "./CampoImagen";
import { CampoFuentes } from "./CampoFuentes";
import { useAvisoSalida } from "./useAvisoSalida";
import styles from "./panel.module.css";

export function AdminDestacados({ items, notas }: { items: DestacadoForm[]; notas: NotaDestacable[] }) {
  const [lista, setLista] = useState(items);
  const [f, setF] = useState<DestacadoForm>(destacadoVacio);
  const [base, setBase] = useState(JSON.stringify(destacadoVacio()));
  const [mensaje, setMensaje] = useState<{ ok: boolean; mensaje: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [ocupado, iniciar] = useTransition();
  const cambios = JSON.stringify(f) !== base;
  useAvisoSalida(cambios);
  function abrir(siguiente: DestacadoForm) {
    if (cambios && !window.confirm("Tenés cambios sin guardar. ¿Descartarlos?")) return;
    setF(siguiente); setBase(JSON.stringify(siguiente)); setMensaje(null);
  }
  function campo(nombre: "titulo" | "texto" | "valor" | "cita" | "atribucion" | "acento", etiqueta: string, max: number, largo = false) {
    const props = { id: `destacado-${nombre}`, value: f[nombre], maxLength: max, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [nombre]: e.target.value }) };
    return <div className={styles.campo}><label className={styles.etiqueta} htmlFor={props.id}>{etiqueta}</label>{largo ? <textarea {...props} rows={3} className={styles.textarea} /> : <input {...props} className={styles.input} />}</div>;
  }
  return <div className={styles.portada}>
    <p className={styles.ayuda}>Creá o editá una fotografía, una cifra o una cita. Publicala y después elegila en Portada. Podés vincular cualquier formato a una noticia publicada.</p>
    <div className={styles.campo}>
      <label htmlFor="elegir-destacado" className={styles.etiqueta}>Editar un destacado existente</label>
      <select id="elegir-destacado" className={styles.select} value={f.id ?? ""} disabled={ocupado || subiendo} onChange={e => abrir(lista.find(x => x.id === e.target.value) ?? destacadoVacio())}>
        <option value="">+ Nuevo destacado</option>
        {lista.map(x => <option key={x.id} value={x.id!}>{x.publicado ? "Publicado" : "Borrador"} · {x.titulo || x.cita || `${x.valor} ${x.texto}`}</option>)}
      </select>
    </div>
    <form onSubmit={e => { e.preventDefault(); if (subiendo) return; setMensaje(null); iniciar(async () => {
      try {
        const r = await guardarDestacado(f); setMensaje(r);
        if (r.ok && r.id) { const guardado = { ...f, id: r.id }; setF(guardado); setBase(JSON.stringify(guardado)); setLista([guardado, ...lista.filter(x => x.id !== r.id)]); }
      } catch { setMensaje({ ok: false, mensaje: "No hubo respuesta. Intentá nuevamente." }); }
    }); }}>
      <fieldset disabled={ocupado} style={{ border: 0, padding: 0, minWidth: 0, display: "grid", gap: "1.25rem" }}>
        <legend className={styles.zonaTitulo}>{f.id ? "Editar destacado" : "Nuevo destacado"}</legend>
        <div className={styles.campo}><label htmlFor="tipo-destacado" className={styles.etiqueta}>Formato</label><select id="tipo-destacado" className={styles.select} value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value as DestacadoForm["tipo"] })}><option value="foto">Fotografía / noticia</option><option value="cifra">Cifra</option><option value="cita">Cita</option></select></div>
        <div className={styles.campo}><label htmlFor="nota-destacado" className={styles.etiqueta}>Noticia vinculada (opcional)</label><select id="nota-destacado" className={styles.select} value={f.notaId} onChange={e => setF({ ...f, notaId: e.target.value })}><option value="">Sin noticia vinculada</option>{f.notaId && !notas.some(n => n.id === f.notaId) ? <option value={f.notaId}>La noticia vinculada ya no está publicada</option> : null}{notas.map(n => <option key={n.id} value={n.id}>{n.titulo}</option>)}</select></div>
        {f.notaId ? <button type="button" className={styles.botonSecundario} onClick={() => { const n = notas.find(n => n.id === f.notaId); if (n && window.confirm("¿Reemplazar el título y la foto del destacado con los de esta noticia?")) setF({ ...f, tipo: "foto", titulo: n.titulo.slice(0, 120), imagen: n.imagen }); }}>Copiar título y foto de la noticia</button> : null}
        <p className={styles.ayuda}>El título y la foto del destacado se editan por separado. El enlace solo se muestra mientras la noticia esté publicada.</p>
        {f.tipo === "foto" ? <>{campo("titulo", "Título", 120)}{campo("acento", "Frase en menta (opcional)", 120)}{campo("texto", "Descripción (opcional)", 400, true)}</> : null}
        {f.tipo === "cifra" ? <>{campo("valor", "Cifra (por ejemplo, 57%)", 16)}{campo("texto", "Explicación", 400, true)}</> : null}
        {f.tipo === "cita" ? <>{campo("cita", "Cita", 600, true)}{campo("atribucion", "Quién lo dijo", 160)}</> : null}
        {f.tipo !== "cifra" ? <CampoImagen valor={f.imagen} onCambio={imagen => setF({ ...f, imagen })} onSubiendo={setSubiendo} carpeta="destacados" etiqueta="Imagen" obligatoria={f.tipo === "foto"} deshabilitado={ocupado} /> : null}
        <CampoFuentes fuentes={f.fuentes} onCambio={fuentes => setF({ ...f, fuentes })} deshabilitado={ocupado} />
        <label className={styles.check}><input type="checkbox" checked={f.publicado} onChange={e => setF({ ...f, publicado: e.target.checked })} />Publicado y disponible para elegir en Portada</label>
        <p className={styles.ayuda}>Desmarcalo y guardá para retirarlo del portal. Si volvés a publicarlo, conservará su posición si seguía seleccionado en Portada.</p>
        <button type="submit" disabled={subiendo} className={styles.botonMenta}>{ocupado ? "Guardando…" : "Guardar destacado"}</button>
      </fieldset>
      {mensaje ? <p role={mensaje.ok ? "status" : "alert"} className={mensaje.ok ? styles.avisoOk : styles.avisoError}>{mensaje.mensaje}</p> : null}
    </form>
    <Link className="enlace" href="/panel/portada" onClick={e => { if (cambios && !window.confirm("¿Salir sin guardar los cambios?")) e.preventDefault(); }}>Ir a Portada para elegir y ordenar destacados</Link>
  </div>;
}
