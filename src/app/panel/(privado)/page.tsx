import type { Metadata } from "next";
import Link from "next/link";
import { ListaContenidos } from "@/components/panel/ListaContenidos";
import styles from "@/components/panel/panel.module.css";
import { listarFragmentos, listarNotas, obtenerResumen, type Resumen } from "@/lib/panel/datos";
import { NOMBRE_ROL } from "@/lib/panel/reglas";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Inicio" };

function Cifra({ valor, etiqueta, nota, href }: { valor: number; etiqueta: string; nota: string; href: string }) {
  return (
    <div className={styles.cifra}>
      <Link href={href}>
        <span className={styles.cifraValor}>{valor}</span>
      </Link>
      <span className={styles.cifraEtiqueta}>{etiqueta}</span>
      <span className={styles.cifraNota}>{nota}</span>
    </div>
  );
}

const suma = (r: Resumen, e: keyof Resumen["nota"]) => r.nota[e] + r.fragmento[e];
const detalle = (r: Resumen, e: keyof Resumen["nota"]) => `${r.nota[e]} noticias · ${r.fragmento[e]} fragmentos`;

export default async function InicioPanel() {
  const perfil = (await perfilDelPanel())!;
  const esRedactor = perfil.rol === "redactor";
  const base = { q: "", categoria: "", pagina: 1 };

  const [resumen, revisionNotas, revisionFrags, misNotas, misFrags] = await Promise.all([
    obtenerResumen(),
    esRedactor ? null : listarNotas({ ...base, estado: "en_revision" }, perfil.id),
    esRedactor ? null : listarFragmentos({ ...base, estado: "en_revision" }, perfil.id),
    listarNotas({ ...base, estado: "borrador", soloMios: true }, perfil.id),
    listarFragmentos({ ...base, estado: "borrador", soloMios: true }, perfil.id),
  ]);

  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>{NOMBRE_ROL[perfil.rol]}</p>
          <h1 className={styles.titulo}>Hola, {perfil.nombreVisible || "equipo"}</h1>
          <p className={styles.subtitulo}>
            {esRedactor
              ? "Escribí tus borradores y enviálos a revisión. Un editor los publica."
              : "Revisá lo pendiente, publicá y organizá la portada."}
          </p>
        </div>
        <div className={styles.accesos}>
          <Link href="/panel/notas/nueva" className={styles.boton}>
            + Nueva noticia
          </Link>
          <Link href="/panel/fragmentos/nuevo" className={styles.botonSecundario}>
            + Nuevo fragmento
          </Link>
        </div>
      </div>

      <section aria-labelledby="resumen" className={styles.resumen}>
        <h2 id="resumen" className="solo-lectores">
          Resumen
        </h2>
        <Cifra
          valor={suma(resumen, "borrador")}
          etiqueta={esRedactor ? "Tus borradores" : "Borradores"}
          nota={detalle(resumen, "borrador")}
          href="/panel/notas?estado=borrador"
        />
        <Cifra
          valor={suma(resumen, "en_revision")}
          etiqueta={esRedactor ? "Tuyos en revisión" : "En revisión"}
          nota={detalle(resumen, "en_revision")}
          href="/panel/notas?estado=en_revision"
        />
        <Cifra valor={suma(resumen, "programado")} etiqueta="Programados" nota={detalle(resumen, "programado")} href="/panel/notas?estado=programado" />
        <Cifra valor={suma(resumen, "publicado")} etiqueta="Publicados" nota={detalle(resumen, "publicado")} href="/panel/notas?estado=publicado" />
      </section>

      {!esRedactor ? (
        <section className={styles.bloque} aria-labelledby="pendientes">
          <h2 id="pendientes" className={styles.bloqueTitulo}>
            Pendientes de revisión
          </h2>
          <ListaContenidos
            tipo="nota"
            filas={[...(revisionNotas?.filas ?? [])]}
            vacio="No hay noticias esperando revisión."
            rol={perfil.rol}
            usuarioId={perfil.id}
          />
          <ListaContenidos
            tipo="fragmento"
            filas={[...(revisionFrags?.filas ?? [])]}
            vacio="No hay fragmentos esperando revisión."
            rol={perfil.rol}
            usuarioId={perfil.id}
          />
        </section>
      ) : null}

      <section className={styles.bloque} aria-labelledby="mios">
        <h2 id="mios" className={styles.bloqueTitulo}>
          Tus borradores
        </h2>
        <ListaContenidos tipo="nota" filas={misNotas.filas.slice(0, 5)} vacio="No tenés noticias en borrador." rol={perfil.rol} usuarioId={perfil.id} />
        <ListaContenidos tipo="fragmento" filas={misFrags.filas.slice(0, 5)} vacio="No tenés fragmentos en borrador." rol={perfil.rol} usuarioId={perfil.id} />
      </section>
    </>
  );
}
