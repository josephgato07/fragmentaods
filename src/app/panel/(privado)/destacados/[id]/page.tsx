import type { Metadata } from "next";
import { PaginaEditorDestacado } from "@/components/panel/PaginaEditorDestacado";
export const metadata: Metadata = { title: "Editar destacado" };
export default async function EditarDestacado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaginaEditorDestacado id={id} />;
}
