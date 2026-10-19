import Link from "next/link";
import { Logo } from "@/components/Logo";
import { paths } from "@/lib/format";

export default function NotFound() {
  return (
    <>
    <header style={{ borderBottom: "2px solid var(--color-negro)" }}>
      <div className="contenedor" style={{ paddingBlock: "var(--space-4)" }}>
        <Logo />
      </div>
    </header>
    <main className="contenedor" style={{ paddingBlock: "var(--space-9)", display: "grid", gap: "var(--space-5)" }}>
      <p
        style={{
          fontSize: "var(--text-section)",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-menta-tinta)",
        }}
      >
        Error 404
      </p>
      <h1
        style={{
          fontSize: "var(--text-display)",
          fontWeight: 900,
          textTransform: "uppercase",
          lineHeight: 0.95,
          maxWidth: "16ch",
        }}
      >
        Esta página no existe
      </h1>
      <p style={{ fontSize: "var(--text-deck)", maxWidth: "50ch" }}>
        Puede que el enlace esté mal escrito o que el contenido se haya movido.
      </p>
      <p style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
        <Link href={paths.home()} className="enlace">
          Volver a la portada
        </Link>
        <Link href={paths.search()} className="enlace">
          Buscar
        </Link>
      </p>
    </main>
    </>
  );
}
