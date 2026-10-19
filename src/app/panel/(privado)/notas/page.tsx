import type { Metadata } from "next";
import { PaginaListado, type ParamsListado } from "@/components/panel/PaginaListado";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Noticias" };

export default async function ListadoNotas({ searchParams }: { searchParams: Promise<ParamsListado> }) {
  const perfil = (await perfilDelPanel())!;
  return <PaginaListado tipo="nota" params={await searchParams} perfil={perfil} />;
}
