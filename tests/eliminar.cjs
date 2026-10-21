// Pruebas de las acciones con sesión/API simuladas y del mapeo público.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function cargar(nombre, mocks = {}, cache = {}) {
  const archivo = path.resolve(nombre);
  if (cache[archivo]) return cache[archivo].exports;
  const mod = { exports: {} }; cache[archivo] = mod;
  const codigo = ts.transpileModule(fs.readFileSync(archivo, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const req = id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('@/')) return cargar('src/' + id.slice(2) + '.ts', mocks, cache);
    if (id.startsWith('.')) return cargar(path.resolve(path.dirname(archivo), id) + '.ts', mocks, cache);
    return require(id);
  };
  new Function('require', 'module', 'exports', codigo)(req, mod, mod.exports);
  return mod.exports;
}

const id = '22222222-2222-4222-8222-222222222222';
function accion({ denegado = false, data = { id }, error = null, sinConexion = false, fallaCache = false } = {}) {
  const escrituras = []; const refrescos = [];
  const db = { from(tabla) {
    const q = { delete() { escrituras.push({ tabla }); return q; }, eq(campo, valor) { escrituras.at(-1).filtro = { campo, valor }; return q; }, select(columnas) { assert.equal(columnas, 'id'); return q; }, async maybeSingle() { if (sinConexion) throw new Error('offline'); return { data, error }; } };
    return q;
  }};
  const mod = cargar('src/app/panel/_acciones/eliminar.ts', {
    'next/cache': { revalidatePath: (...args) => refrescos.push(args) },
    '@/lib/panel/servidor': { exigirRol: async roles => { assert.deepEqual(roles, ['administrador']); return denegado ? { error: 'Sin permiso' } : { perfil: {} }; }, mensajeDeError: () => 'La base rechazó la operación', refrescarPortal: () => { if (fallaCache) throw new Error('cache'); refrescos.push('portal'); } },
    '@/lib/supabase/server': { createSessionClient: async () => db },
  });
  return { eliminar: mod.eliminarContenido, escrituras, refrescos };
}
test('denegación de rol impide borrar noticias, fragmentos y destacados', async () => {
  const a = accion({ denegado: true });
  for (const tipo of ['nota', 'fragmento', 'destacado']) assert.equal((await a.eliminar(tipo, id)).ok, false);
  assert.deepEqual(a.escrituras, []);
});
test('tipo o id manipulados no generan escrituras', async () => {
  const a = accion();
  for (const [tipo, identificador] of [['perfiles', id], ['nota', ''], ['nota', '*'], ['destacado', null]]) assert.equal((await a.eliminar(tipo, identificador)).ok, false);
  assert.deepEqual(a.escrituras, []);
});
test('cada tipo elimina exclusivamente el id pedido en su tabla y refresca panel y portal', async () => {
  for (const [tipo, tabla] of [['nota', 'notas'], ['fragmento', 'fragmentos'], ['destacado', 'destacados']]) {
    const a = accion(); assert.equal((await a.eliminar(tipo, id)).ok, true);
    assert.deepEqual(a.escrituras, [{ tabla, filtro: { campo: 'id', valor: id } }]);
    assert.deepEqual(a.refrescos, ['portal', ['/panel', 'layout']]);
  }
});
test('registro ausente o rechazo RLS no se presenta como eliminación exitosa', async () => {
  for (const opciones of [{ data: null }, { data: null, error: { code: '42501' } }]) {
    const a = accion(opciones); assert.equal((await a.eliminar('nota', id)).ok, false); assert.deepEqual(a.refrescos, []);
  }
});
test('pérdida de conexión pide comprobar resultado sin prometer que no se borró', async () => {
  const a = accion({ sinConexion: true }); const r = await a.eliminar('nota', id);
  assert.equal(r.ok, false); assert.match(r.mensaje, /Recargá el listado/);
});
test('fallo de caché posterior no oculta una eliminación confirmada', async () => {
  const a = accion({ fallaCache: true }); const r = await a.eliminar('destacado', id);
  assert.equal(r.ok, true); assert.match(r.mensaje, /eliminado/);
});
