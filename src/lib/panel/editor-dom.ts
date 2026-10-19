/**
 * Conversión entre el editor visual (contentEditable) y el JSON de la base.
 * Del DOM solo se toman tres cosas: texto, subrayado (énfasis) y enlaces.
 * Cualquier otra etiqueta se ignora y su texto queda como texto plano,
 * así que nunca se guarda HTML.
 */
import type { Inline } from "@/lib/content/types";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapar = (texto: string) => texto.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** JSON → HTML seguro para cargar en el editor (todo escapado). */
export function inlinesAHtml(content: Inline[]): string {
  return content
    .map((parte) => {
      if (typeof parte === "string") return escapar(parte);
      if (parte.type === "enfasis") return `<u>${escapar(parte.text)}</u>`;
      return `<a href="${escapar(parte.href)}">${escapar(parte.text)}</a>`;
    })
    .join("");
}

function esSubrayado(el: HTMLElement): boolean {
  if (el.tagName === "U") return true;
  const deco = `${el.style.textDecoration} ${el.style.textDecorationLine}`;
  return deco.includes("underline");
}

/** DOM del editor → JSON (sin recortar espacios: eso se hace al guardar). */
export function domAInlines(raiz: Node): Inline[] {
  const piezas: Inline[] = [];

  const agregar = (texto: string, enfasis: boolean, href: string | null) => {
    if (!texto) return;
    let nueva: Inline;
    if (href !== null) nueva = { type: "enlace", text: texto, href };
    else if (enfasis) nueva = { type: "enfasis", text: texto };
    else nueva = texto;

    const ultima = piezas[piezas.length - 1];
    if (typeof nueva === "string" && typeof ultima === "string") {
      piezas[piezas.length - 1] = ultima + nueva;
    } else if (
      typeof nueva !== "string" &&
      ultima &&
      typeof ultima !== "string" &&
      ultima.type === nueva.type &&
      (nueva.type === "enfasis" || (ultima.type === "enlace" && ultima.href === nueva.href))
    ) {
      piezas[piezas.length - 1] = { ...ultima, text: ultima.text + nueva.text } as Inline;
    } else {
      piezas.push(nueva);
    }
  };

  const recorrer = (nodo: Node, enfasis: boolean, href: string | null) => {
    if (nodo.nodeType === Node.TEXT_NODE) {
      const texto = (nodo.textContent ?? "").replace(/ /g, " ").replace(/\s*\n\s*/g, " ");
      agregar(texto, enfasis, href);
      return;
    }
    if (nodo.nodeType !== Node.ELEMENT_NODE) return;
    const el = nodo as HTMLElement;
    if (el.tagName === "BR") {
      agregar(" ", enfasis, href);
      return;
    }
    const hrefHijo = el.tagName === "A" ? (el.getAttribute("href") ?? "") : href;
    const enfasisHijo = enfasis || esSubrayado(el);
    el.childNodes.forEach((hijo) => recorrer(hijo, enfasisHijo, hrefHijo));
  };

  raiz.childNodes.forEach((hijo) => recorrer(hijo, false, null));
  return piezas;
}

/** Texto plano con saltos de párrafo, para pegar contenido de otras fuentes. */
export function partirEnParrafos(texto: string): string[] {
  return texto
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}
