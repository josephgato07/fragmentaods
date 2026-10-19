import "server-only";

import { createSessionClient } from "@/lib/supabase/server";

export type Rol = "administrador" | "editor" | "redactor";

export interface PerfilActual {
  id: string;
  email: string | null;
  nombreVisible: string;
  rol: Rol;
  activo: boolean;
}

/**
 * Usuario de la sesión actual con su perfil, o `null` si no hay sesión.
 * La identidad sale del JWT verificado (getClaims), no de datos del navegador.
 */
export async function getPerfilActual(): Promise<PerfilActual | null> {
  const supabase = await createSessionClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims?.sub) return null;

  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre_visible, rol, activo")
    .eq("id", claims.sub)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id as string,
    email: typeof claims.email === "string" ? claims.email : null,
    nombreVisible: data.nombre_visible as string,
    rol: data.rol as Rol,
    activo: data.activo as boolean,
  };
}

export class PermisoDenegadoError extends Error {
  constructor(message = "No tenés permisos para esta acción.") {
    super(message);
    this.name = "PermisoDenegadoError";
  }
}

/**
 * Validación del servidor para Server Actions del panel: exige sesión, perfil
 * activo y uno de los roles indicados. RLS vuelve a comprobarlo en la base.
 */
export async function requerirRol(roles: Rol[]): Promise<PerfilActual> {
  const perfil = await getPerfilActual();
  if (!perfil) throw new PermisoDenegadoError("Tenés que iniciar sesión.");
  if (!perfil.activo) throw new PermisoDenegadoError("Tu usuario todavía no fue activado por un administrador.");
  if (!roles.includes(perfil.rol)) throw new PermisoDenegadoError();
  return perfil;
}
