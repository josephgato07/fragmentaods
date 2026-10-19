import "server-only";

import { cache } from "react";
import { getPerfilActual } from "@/lib/auth/perfil";

/**
 * Perfil de la sesión, una sola consulta por pedido aunque lo pidan
 * el layout y la página.
 */
export const perfilDelPanel = cache(getPerfilActual);
