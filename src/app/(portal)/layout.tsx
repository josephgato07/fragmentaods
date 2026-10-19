import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { content } from "@/lib/content";

// Todas las páginas públicas se refrescan como máximo cada 60 s
// (y al instante cuando el panel publica o cambia la portada).
export const revalidate = 60;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Si la base no responde, el menú queda vacío pero el portal sigue funcionando
  // y cada página muestra su propio estado de error.
  const sections = await content.getSections().catch((error: unknown) => {
    console.error("[FRAGMENTADOS] No se pudieron cargar las secciones:", error);
    return [];
  });
  return (
    <>
      <a href="#contenido" className="saltar-contenido">
        Saltar al contenido
      </a>
      <Header sections={sections} />
      <main id="contenido" tabIndex={-1}>
        {children}
      </main>
      <Footer sections={sections} />
    </>
  );
}
