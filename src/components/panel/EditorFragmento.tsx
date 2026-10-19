"use client";

import { guardarFragmento } from "@/app/panel/_acciones/contenido";
import { NOMBRE_ESTADO, crearSlug, estadoVisible, LIMITES, validarFragmento } from "@/lib/panel/reglas";
import type { BloqueForm, Estado, FragmentoForm, Rol } from "@/lib/panel/tipos";
import { BarraAcciones } from "./BarraAcciones";
import { CampoFuentes } from "./CampoFuentes";
import { CampoImagen } from "./CampoImagen";
import { EditorBloques } from "./EditorBloques";
import { ResumenErrores } from "./ResumenErrores";
import { useEditorContenido, type SituacionCliente } from "./useEditorContenido";
import styles from "./panel.module.css";

interface Props {
  inicial: FragmentoForm;
  situacion: SituacionCliente | null;
  rol: Rol;
  usuarioId: string;
  categorias: Array<{ id: string; nombre: string }>;
  notas: Array<{ id: string; titulo: string; estado: Estado; publicadoEn: string | null }>;
  autorNombre?: string;
}

/** Los párrafos del fragmento se editan con el mismo editor de bloques (solo párrafos). */
const aBloques = (p: FragmentoForm["parrafos"]): BloqueForm[] => p.map((x) => ({ id: x.id, type: "parrafo", content: x.content }));
const deBloques = (b: BloqueForm[]): FragmentoForm["parrafos"] =>
  b.flatMap((x) => (x.type === "parrafo" ? [{ id: x.id, content: x.content }] : []));

export function EditorFragmento({ inicial, situacion, rol, usuarioId, categorias, notas, autorNombre }: Props) {
  const ed = useEditorContenido<FragmentoForm>({
    inicial,
    situacionInicial: situacion,
    rol,
    usuarioId,
    guardar: guardarFragmento,
    validar: validarFragmento,
    rutaEdicion: (id) => `/panel/fragmentos/${id}`,
  });
  const { form, actualizar, errores, soloLectura } = ed;
  const slugBloqueado = ed.situacion.estado === "publicado" && !ed.esNuevo && Boolean(ed.situacion.publicadoEn);
  const vivo = ed.situacion.estado === "publicado" && ed.situacion.publicadoEn && new Date(ed.situacion.publicadoEn) <= ed.ahora;

  const cambiarPalabra = (palabra: string) => {
    const seguir = ed.esNuevo && (form.slug === "" || form.slug === crearSlug(form.palabraClave));
    actualizar("palabraClave", palabra);
    if (seguir) actualizar("slug", crearSlug(palabra));
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorPrincipal}>
        <ResumenErrores refFoco={ed.resumenErrores} mensaje={ed.mensaje} errores={errores} />

        <div className={styles.campo}>
          <label className={styles.etiqueta} htmlFor="palabra">
            Palabra clave
          </label>
          <input
            id="palabra"
            className={`${styles.input} ${styles.inputPalabra}`}
            value={form.palabraClave}
            disabled={soloLectura}
            aria-invalid={errores.palabraClave ? true : undefined}
            onChange={(e) => cambiarPalabra(e.target.value)}
          />
          <span className={`${styles.contador} ${form.palabraClave.length > LIMITES.palabraClave ? styles.contadorExcedido : ""}`}>
            {form.palabraClave.length}/{LIMITES.palabraClave}
          </span>
          {errores.palabraClave ? <p className={styles.errorCampo}>{errores.palabraClave}</p> : null}
        </div>

        <EditorBloques
          bloques={aBloques(form.parrafos)}
          actualizar={(fn) => ed.setForm((f) => ({ ...f, parrafos: deBloques(fn(aBloques(f.parrafos))) }))}
          modo="fragmento"
          deshabilitado={soloLectura}
          error={errores.cuerpo}
        />
      </div>

      <div className={styles.editorLateral}>
        <BarraAcciones
          acciones={ed.acciones}
          situacion={ed.situacion}
          ahora={ed.ahora}
          pendiente={ed.pendiente}
          hayCambios={ed.hayCambios}
          mensaje={ed.mensaje}
          esNuevo={ed.esNuevo}
          soloLectura={soloLectura}
          programarPara={form.programarPara}
          errorProgramar={errores.programarPara}
          onProgramarPara={(v) => actualizar("programarPara", v)}
          onAccion={ed.ejecutar}
          vistaPrevia={form.id ? `/panel/vista-previa/fragmento/${form.id}` : null}
          urlPublica={vivo ? `/fragmento/${form.slug}` : null}
        />

        <section className={styles.panelLateral} aria-labelledby="datos-fragmento">
          <h2 id="datos-fragmento" className={styles.panelLateralTitulo}>
            Datos del fragmento
          </h2>
          {autorNombre ? <p className={styles.ayuda}>Autor en el sistema: {autorNombre}</p> : null}

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="categoria">
              Categoría
            </label>
            <select
              id="categoria"
              className={styles.select}
              value={form.categoriaId}
              disabled={soloLectura}
              aria-invalid={errores.categoriaId ? true : undefined}
              onChange={(e) => actualizar("categoriaId", e.target.value)}
            >
              <option value="">Elegí una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {errores.categoriaId ? <p className={styles.errorCampo}>{errores.categoriaId}</p> : null}
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="nota-vinculada">
              Nota completa vinculada (opcional)
            </label>
            <select
              id="nota-vinculada"
              className={styles.select}
              value={form.notaId}
              disabled={soloLectura}
              onChange={(e) => actualizar("notaId", e.target.value)}
            >
              <option value="">Sin nota vinculada</option>
              {notas.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.titulo.length > 80 ? `${n.titulo.slice(0, 80)}…` : n.titulo} · {NOMBRE_ESTADO[estadoVisible(n.estado, n.publicadoEn)]}
                </option>
              ))}
            </select>
            <p className={styles.ayuda}>El enlace «Leer la nota completa» aparece solo cuando esa nota está publicada.</p>
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="lugar">
              Lugar
            </label>
            <input
              id="lugar"
              className={styles.input}
              value={form.lugar}
              maxLength={LIMITES.lugar}
              disabled={soloLectura}
              aria-invalid={errores.lugar ? true : undefined}
              onChange={(e) => actualizar("lugar", e.target.value)}
            />
            {errores.lugar ? <p className={styles.errorCampo}>{errores.lugar}</p> : null}
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="firma">
              Firma pública
            </label>
            <input
              id="firma"
              className={styles.input}
              value={form.firma}
              maxLength={LIMITES.firma}
              disabled={soloLectura}
              aria-invalid={errores.firma ? true : undefined}
              onChange={(e) => actualizar("firma", e.target.value)}
            />
            {errores.firma ? <p className={styles.errorCampo}>{errores.firma}</p> : null}
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="slug">
              Dirección
            </label>
            <div className={styles.prefijo}>
              <span>/fragmento/</span>
              <input
                id="slug"
                className={styles.input}
                value={form.slug}
                disabled={soloLectura || slugBloqueado}
                aria-invalid={errores.slug ? true : undefined}
                onChange={(e) => actualizar("slug", e.target.value.toLowerCase())}
              />
            </div>
            <p className={styles.ayuda}>
              {slugBloqueado ? "Ya publicado: la dirección no cambia para no romper enlaces compartidos." : "Minúsculas, números y guiones."}
            </p>
            {errores.slug ? <p className={styles.errorCampo}>{errores.slug}</p> : null}
          </div>

          <CampoImagen
            valor={form.imagen}
            onCambio={(imagen) => actualizar("imagen", imagen)}
            carpeta="fragmentos"
            etiqueta="Imagen (opcional)"
            conPie
            deshabilitado={soloLectura}
            error={errores.imagen}
          />

          <CampoFuentes fuentes={form.fuentes} onCambio={(f) => actualizar("fuentes", f)} deshabilitado={soloLectura} error={errores.fuentes} />
        </section>
      </div>
    </div>
  );
}
