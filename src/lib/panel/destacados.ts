import type { ImagenForm, FuenteForm } from "./tipos";
export interface DestacadoForm {
  id: string | null;
  tipo: "foto" | "cifra" | "cita";
  titulo: string;
  texto: string;
  valor: string;
  cita: string;
  atribucion: string;
  acento: string;
  notaId: string;
  imagen: ImagenForm | null;
  fuentes: FuenteForm[];
  publicado: boolean;
}
export interface NotaDestacable { id: string; titulo: string; imagen: ImagenForm | null }
export const destacadoVacio = (): DestacadoForm => ({ id: null, tipo: "foto", titulo: "", texto: "", valor: "", cita: "", atribucion: "", acento: "", notaId: "", imagen: null, fuentes: [], publicado: false });
