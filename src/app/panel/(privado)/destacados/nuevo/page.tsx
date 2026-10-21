import type { Metadata } from "next";
import { PaginaEditorDestacado } from "@/components/panel/PaginaEditorDestacado";
export const metadata: Metadata = { title: "Nuevo destacado" };
export default function NuevoDestacado() { return <PaginaEditorDestacado />; }
