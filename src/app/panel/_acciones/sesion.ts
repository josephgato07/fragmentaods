"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

export interface EstadoIngreso {
  error: string | null;
  email: string;
}

/** Solo se permite volver a rutas internas del panel (evita redirecciones abiertas). */
function destinoSeguro(destino: string): string {
  return /^\/panel(\/[A-Za-z0-9/_-]*)?$/.test(destino) && !destino.startsWith("/panel/ingresar") ? destino : "/panel";
}

export async function ingresar(_previo: EstadoIngreso, formData: FormData): Promise<EstadoIngreso> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const destino = destinoSeguro(String(formData.get("destino") ?? "/panel"));

  if (!email || !password) return { error: "Escribí tu correo y tu contraseña.", email };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const mensaje =
      error?.code === "invalid_credentials"
        ? "Correo o contraseña incorrectos."
        : error?.code === "email_not_confirmed"
          ? "Tu correo todavía no está confirmado. Pedile a un administrador que lo confirme."
          : error?.status === 429
            ? "Demasiados intentos. Esperá unos minutos y volvé a probar."
            : "No se pudo iniciar sesión. Intentá de nuevo.";
    return { error: mensaje, email };
  }

  const { data: perfil } = await supabase.from("perfiles").select("activo").eq("id", data.user.id).maybeSingle();
  if (!perfil?.activo) {
    await supabase.auth.signOut();
    return { error: "Tu usuario todavía no está activo. Pedile a un administrador que lo active.", email };
  }

  redirect(destino);
}

export async function salir() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/panel/ingresar?salida=1");
}
