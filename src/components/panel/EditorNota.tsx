"use client";

import { guardarNota } from "@/app/panel/_acciones/contenido";
import { crearSlug, LIMITES, validarNota } from "@/lib/panel/reglas";
import type { NotaForm, Rol } from "@/lib/panel/tipos";
import { BarraAcciones } from "./BarraAcciones";
import { CampoFuentes } from "./CampoFuentes";
import { CampoImagen } from "./CampoImagen";
import { EditorBloques } from "./EditorBloques";
import { ResumenErrores } from "./ResumenErrores";
import { useEditorContenido, type SituacionCliente } from "./useEditorContenido";
import styles from "./panel.module.css";

interface Props {
  inicial: NotaForm;
  situacion: SituacionCliente | null;
  rol: Rol;
  usuarioId: string;
  categorias: Array<{ id: string; nombre: string }>;
  autorNombre?: string;
}

export function EditorNota({ inicial, situacion, rol, usuarioId, categorias, autorNombre }: Props) {
  const ed = useEditorContenido<NotaForm>({
    inicial,
    situacionInicial: situacion,
    rol,
    usuarioId,
    guardar: guardarNota,
    validar: validarNota,
    rutaEdicion: (id) => `/panel/notas/${id}`,
  });
  const { form, actualizar, errores, soloLectura } = ed;
  const slugBloqueado = ed.situacion.estado === "publicado" && !ed.esNuevo && Boolean(ed.situacion.publicadoEn);
  const autoSlug = ed.esNuevo && form.slug === crearSlug(form.titulo);
  const vivo = ed.situacion.estado === "publicado" && ed.situacion.publicadoEn && new Date(ed.situacion.publicadoEn) <= ed.ahora;

  const cambiarTitulo = (titulo: string) => {
    const seguir = ed.esNuevo && (form.slug === "" || form.slug === crearSlug(form.titulo));
    actualizar("titulo", titulo);
    if (seguir) actualizar("slug", crearSlug(titulo));
  };

  const contador = (valor: string, max: number) => (
    <span className={`${styles.contador} ${valor.length > max ? styles.contadorExcedido : ""}`}>
      {valor.length}/{max}
    </span>
  );

  return (
    <div className={styles.editor}>
      <div className={styles.editorPrincipal}>
        <ResumenErrores refFoco={ed.resumenErrores} mensaje={ed.mensaje} errores={errores} />

        <div className={styles.campo}>
          <label className={styles.etiqueta} htmlFor="titulo">
            Título
          </label>
          <textarea
            id="titulo"
            className={`${styles.textarea} ${styles.inputTitulo}`}
            rows={2}
            value={form.titulo}
            disabled={soloLectura}
            aria-invalid={errores.titulo ? true : undefined}
            onChange={(e) => cambiarTitulo(e.target.value.replace(/\n/g, " "))}
          />
          {contador(form.titulo, LIMITES.titulo)}
          {errores.titulo ? <p className={styles.errorCampo}>{errores.titulo}</p> : null}
        </div>

        <div className={styles.campo}>
          <label className={styles.etiqueta} htmlFor="bajada">
            Bajada
          </label>
          <textarea
            id="bajada"
            className={styles.textarea}
            rows={3}
            value={form.bajada}
            disabled={soloLectura}
            aria-invalid={errores.bajada ? true : undefined}
            onChange={(e) => actualizar("bajada", e.target.value)}
          />
          {contador(form.bajada, LIMITES.bajada)}
          {errores.bajada ? <p className={styles.errorCampo}>{errores.bajada}</p> : null}
        </div>

        <EditorBloques
          bloques={form.cuerpo}
          actualizar={(fn) => ed.setForm((f) => ({ ...f, cuerpo: fn(f.cuerpo) }))}
          modo="nota"
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
          vistaPrevia={form.id ? `/panel/vista-previa/nota/${form.id}` : null}
          urlPublica={vivo ? `/nota/${form.slug}` : null}
        />

        <section className={styles.panelLateral} aria-labelledby="datos-nota">
          <h2 id="datos-nota" className={styles.panelLateralTitulo}>
            Datos de la nota
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
            <label className={styles.etiqueta} htmlFor="etiqueta">
              Etiqueta verde (opcional)
            </label>
            <input
              id="etiqueta"
              className={styles.input}
              value={form.etiqueta}
              maxLength={LIMITES.etiqueta}
              disabled={soloLectura}
              placeholder="Si queda vacía, se usa la categoría"
              onChange={(e) => actualizar("etiqueta", e.target.value)}
            />
            {errores.etiqueta ? <p className={styles.errorCampo}>{errores.etiqueta}</p> : null}
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
              <span>/nota/</span>
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
              {slugBloqueado
                ? "Ya publicada: la dirección no cambia para no romper enlaces compartidos."
                : autoSlug
                  ? "Se genera a partir del título. Podés editarla."
                  : "Minúsculas, números y guiones."}
            </p>
            {errores.slug ? <p className={styles.errorCampo}>{errores.slug}</p> : null}
          </div>

          <CampoImagen
            valor={form.imagen}
            onCambio={(imagen) => actualizar("imagen", imagen)}
            carpeta="notas"
            etiqueta="Imagen principal"
            obligatoria
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
