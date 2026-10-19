/**
 * FRAGMENTADOS · Comprobación de conexión y permisos contra tu proyecto Supabase.
 *
 * Solo usa la clave PUBLICABLE de .env.local. No modifica datos (los intentos de
 * escritura deben ser rechazados; si alguno se acepta, el script lo informa).
 *
 * Uso:
 *   npm run verificar:supabase
 *   npm run verificar:supabase -- --usuario tu@correo.com    (además prueba tu sesión y tu rol)
 *   npm run verificar:supabase -- --probar-registro          (comprueba que el registro público esté cerrado)
 */
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline";

const BUCKET = "imagenes-editoriales";
const args = process.argv.slice(2);
const emailArg = args.includes("--usuario") ? args[args.indexOf("--usuario") + 1] : null;
const probarRegistro = args.includes("--probar-registro");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let fallas = 0;
const ok = (msg) => console.log(`  OK     ${msg}`);
const falla = (msg) => {
  fallas++;
  console.log(`  FALLA  ${msg}`);
};
const info = (msg) => console.log(`  ·      ${msg}`);
const titulo = (msg) => console.log(`\n${msg}`);

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local.");
  process.exit(1);
}
if (key.startsWith("sb_secret_")) {
  console.error("La clave configurada es SECRETA. Usá la publicable y rotá la secreta en Supabase.");
  process.exit(1);
}

const opciones = { auth: { persistSession: false, autoRefreshToken: false } };
const publico = createClient(url, key, opciones);
const ahora = new Date().toISOString();

titulo("1. Conexión");
{
  const { data, error } = await publico.from("categorias").select("slug, nombre").order("orden");
  if (error) {
    falla(`No se pudo leer categorías: ${error.message}`);
    console.log("\n  Revisá la URL y la clave, y que las migraciones estén aplicadas.");
    process.exit(1);
  }
  ok(`Conectado a ${new URL(url).host}. Categorías: ${data.map((c) => c.nombre).join(", ") || "(ninguna)"}`);
}

titulo("2. Lectura pública");
{
  const notas = await publico.from("notas").select("slug", { count: "exact", head: true });
  const frags = await publico.from("fragmentos").select("slug", { count: "exact", head: true });
  if (notas.error || frags.error) falla(`Error al contar contenidos: ${(notas.error ?? frags.error).message}`);
  else ok(`El público ve ${notas.count} notas y ${frags.count} fragmentos.`);

  const ocultas = await publico.from("notas").select("slug").neq("estado", "publicado");
  if (ocultas.error) falla(ocultas.error.message);
  else if (ocultas.data.length === 0) ok("No se ve ningún borrador ni contenido en revisión.");
  else falla(`Se ven ${ocultas.data.length} notas no publicadas: ${ocultas.data.map((n) => n.slug).join(", ")}`);

  const futuras = await publico.from("notas").select("slug").gt("publicado_en", ahora);
  if (futuras.error) falla(futuras.error.message);
  else if (futuras.data.length === 0) ok("No se ve ninguna nota programada para el futuro.");
  else falla(`Se ven notas programadas: ${futuras.data.map((n) => n.slug).join(", ")}`);

  const portada = await publico.from("ubicaciones_portada").select("zona, posicion");
  if (portada.error) falla(portada.error.message);
  else info(`Ubicaciones de portada visibles: ${portada.data.length}`);
}

titulo("3. Lo que el público NO debe poder hacer");
{
  const perfiles = await publico.from("perfiles").select("id").limit(1);
  if (perfiles.error) ok("No puede leer perfiles de usuarios.");
  else falla("Puede leer la tabla de perfiles.");

  const autor = await publico.from("notas").select("autor_id").limit(1);
  if (autor.error) ok("No puede ver quién es el autor interno de cada nota (autor_id).");
  else falla("Puede leer la columna autor_id.");

  const cat = await publico.from("categorias").select("id").limit(1).single();
  const insert = await publico.from("notas").insert({ slug: "prueba-publico", titulo: "x", categoria_id: cat.data?.id });
  if (insert.error) ok("No puede crear notas.");
  else falla("¡Pudo crear una nota! Borrala desde el Table Editor y revisá las políticas.");

  const lista = await publico.storage.from(BUCKET).list("notas");
  if (lista.error || (lista.data ?? []).length === 0) ok("No puede listar las imágenes del bucket.");
  else falla(`Puede listar imágenes (${lista.data.length}).`);

  const pixel = new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" });
  const subida = await publico.storage.from(BUCKET).upload(`notas/prueba-publico-${Date.now()}.jpg`, pixel);
  if (subida.error) ok("No puede subir imágenes.");
  else falla("¡Pudo subir una imagen! Eliminala desde Storage y revisá las políticas.");
}

if (probarRegistro) {
  titulo("4. Registro público");
  const correo = `prueba-registro-${Date.now()}@example.com`;
  const { data, error } = await publico.auth.signUp({ email: correo, password: `Prueba-${Date.now()}-x!` });
  if (error) ok(`El registro público está cerrado (${error.message}).`);
  else {
    falla(`El registro está ABIERTO: se creó ${correo}. Desactivalo en Authentication → Sign In / Providers y borrá ese usuario.`);
    info(`El usuario creado quedó inactivo y sin permisos (id ${data.user?.id ?? "?"}).`);
  }
}

if (emailArg) {
  titulo("5. Tu sesión y tu rol");
  const password = await pedirClave(`  Contraseña de ${emailArg}: `);
  const sesion = createClient(url, key, opciones);
  const { error: loginError } = await sesion.auth.signInWithPassword({ email: emailArg, password });
  if (loginError) {
    falla(`No se pudo iniciar sesión: ${loginError.message}`);
  } else {
    const { data: claims } = await sesion.auth.getClaims();
    const uid = claims?.claims?.sub;
    const { data: perfil, error } = await sesion.from("perfiles").select("rol, activo, nombre_visible").eq("id", uid).single();
    if (error) falla(`No se pudo leer tu perfil: ${error.message}`);
    else {
      ok(`Sesión iniciada. Rol: ${perfil.rol} · Activo: ${perfil.activo ? "sí" : "no"} · Nombre: ${perfil.nombre_visible}`);
      const otroRol = perfil.rol === "redactor" ? "editor" : "redactor";
      const cambio = await sesion.from("perfiles").update({ rol: otroRol }).eq("id", uid).select();
      if (cambio.error) ok(`No podés cambiar tu propio rol (${cambio.error.message}).`);
      else if ((cambio.data ?? []).length === 0) ok("No podés cambiar tu propio rol.");
      else falla("¡Pudiste cambiar tu propio rol! Revisá la migración 2.");
      const borradores = await sesion.from("notas").select("slug", { count: "exact", head: true }).neq("estado", "publicado");
      info(`Contenidos no publicados que ves con tu rol: ${borradores.count ?? 0}`);
    }
    await sesion.auth.signOut();
  }
}

console.log(fallas === 0 ? "\nTodo en orden." : `\n${fallas} comprobación(es) fallaron.`);
process.exit(fallas === 0 ? 0 : 1);

function pedirClave(pregunta) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(pregunta)) rl.output.write(pregunta);
    };
    rl.question(pregunta, (respuesta) => {
      rl.close();
      process.stdout.write("\n");
      resolve(respuesta);
    });
  });
}
