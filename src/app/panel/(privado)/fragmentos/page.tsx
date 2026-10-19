import type { Metadata } from "next";
import { PaginaListado, type ParamsListado } from "@/components/panel/PaginaListado";
import { perfilDelPanel } from "@/lib/panel/sesion";

export const metadata: Metadata = { title: "Fragmentos" };

export default async function ListadoFragmentos({ searchParams }: { searchParams: Promise<ParamsListado> }) {
  const perfil = (await perfilDelPanel())!;
  return <PaginaListado tipo="fragmento" params={await searchParams} perfil={perfil} />;
}
