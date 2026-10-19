"use client";

import { useEffect } from "react";

const MENSAJE = "Tenés cambios sin guardar. ¿Querés salir igual y perderlos?";

/**
 * Avisa antes de salir con cambios sin guardar:
 * - al cerrar o recargar la pestaña (aviso nativo del navegador);
 * - al tocar un enlace del panel o el botón «Salir».
 */
export function useAvisoSalida(hayCambios: boolean) {
  useEffect(() => {
    if (!hayCambios) return;

    const antesDeDescargar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const alHacerClic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const enlace = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!enlace || enlace.target === "_blank" || enlace.hasAttribute("download")) return;
      const destino = new URL(enlace.href, window.location.href);
      if (destino.origin === window.location.origin && destino.pathname === window.location.pathname && destino.search === window.location.search)
        return;
      if (!window.confirm(MENSAJE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const alEnviar = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form?.hasAttribute("data-confirmar-salida")) return;
      if (!window.confirm(MENSAJE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", antesDeDescargar);
    document.addEventListener("click", alHacerClic, true);
    document.addEventListener("submit", alEnviar, true);
    return () => {
      window.removeEventListener("beforeunload", antesDeDescargar);
      document.removeEventListener("click", alHacerClic, true);
      document.removeEventListener("submit", alEnviar, true);
    };
  }, [hayCambios]);
}
