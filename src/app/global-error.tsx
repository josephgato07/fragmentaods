"use client";

import "@fontsource/barlow/600.css";
import "@fontsource/barlow/900.css";

/**
 * Último recurso: se usa si falla el layout principal o la generación de una
 * página. Incluye su propio <html> porque reemplaza al layout.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-UY">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#F4F1E8",
          color: "#111111",
          fontFamily: '"Barlow", "Helvetica Neue", Arial, sans-serif',
          display: "grid",
          placeItems: "center",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: 640, display: "grid", gap: 16 }}>
          <p style={{ margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#007A52" }}>
            FRAGMENTADOS
          </p>
          <h1 style={{ margin: 0, fontWeight: 900, textTransform: "uppercase", lineHeight: 1, fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>
            No pudimos cargar el portal
          </h1>
          <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
            Puede ser un problema momentáneo de conexión. Probá de nuevo en unos segundos.
          </p>
          <p style={{ margin: 0, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                font: "inherit",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "12px 22px",
                borderRadius: 999,
                border: "2px solid #111111",
                background: "#111111",
                color: "#F4F1E8",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            <a href="/" style={{ color: "#111111", fontWeight: 700, textDecorationColor: "#00E59A", textDecorationThickness: 3 }}>
              Ir a la portada
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
