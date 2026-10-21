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
const notaId = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const vacio = { id: null, tipo: 'cifra', valor: '57%', texto: 'Descripción', titulo: '', cita: '', atribucion: '', acento: '', notaId: '', imagen: null, fuentes: [], publicado: true };
function accion({ denegado = false, nota = true, actual = { estado: 'publicado', publicado_en: '2026-01-01T00:00:00Z' } } = {}) {
  const escrituras = []; let refrescos = 0;
  const db = { from(tabla) {
    let escritura = false;
    const q = { select() { return q; }, eq() { return q; }, lte() { return q; },
      insert(f) { escritura = true; escrituras.push(f); return q; }, update(f) { escritura = true; escrituras.push(f); return q; },
      async maybeSingle() { return { data: escritura ? { id } : tabla === 'notas' ? (nota ? { id: notaId } : null) : actual, error: null }; },
      async single() { return q.maybeSingle(); } };
    return q;
  }};
  const mod = cargar('src/app/panel/_acciones/destacados.ts', {
    '@/lib/panel/servidor': { exigirRol: async roles => { assert.deepEqual(roles, ['administrador','editor']); return denegado ? { error: 'Sin permiso' } : { perfil: {} }; }, mensajeDeError: () => 'Error DB', refrescarPortal: () => refrescos++ },
    '@/lib/supabase/server': { createSessionClient: async () => db },
  });
  return { guardar: mod.guardarDestacado, escrituras, refrescos: () => refrescos };
}
test('redactor/inactivo/sin sesión: la denegación evita escrituras', async () => { const a = accion({ denegado: true }); assert.equal((await a.guardar(vacio)).ok, false); assert.equal(a.escrituras.length, 0); });
test('crea cifra publicada y refresca portal', async () => { const a = accion(); assert.equal((await a.guardar(vacio)).ok, true); assert.equal(a.escrituras[0].estado, 'publicado'); assert.equal(a.refrescos(), 1); });
test('foto sin imagen se rechaza', async () => { const a = accion(); assert.equal((await a.guardar({ ...vacio, tipo: 'foto', titulo: 'Foto' })).ok, false); assert.equal(a.escrituras.length, 0); });
test('no permite enlazar una nota no pública', async () => { const a = accion({ nota: false }); assert.equal((await a.guardar({ ...vacio, notaId })).ok, false); assert.equal(a.escrituras.length, 0); });
test('fuente javascript y título excesivo se rechazan', async () => { const a = accion(); for (const f of [{ ...vacio, fuentes: [{ label: 'X', url: 'javascript:alert(1)' }] }, { ...vacio, titulo: 'x'.repeat(121) }]) assert.equal((await a.guardar(f)).ok, false); assert.equal(a.escrituras.length, 0); });
test('despublicar guarda borrador y quita fecha pública', async () => { const a = accion(); assert.equal((await a.guardar({ ...vacio, id, publicado: false })).ok, true); assert.equal(a.escrituras[0].publicado_en, null); assert.equal(a.escrituras[0].estado, 'borrador'); });
test('editar preserva fecha de publicación/programación', async () => { const fecha = '2099-01-01T00:00:00Z'; const a = accion({ actual: { estado: 'publicado', publicado_en: fecha } }); assert.equal((await a.guardar({ ...vacio, id })).ok, true); assert.equal(a.escrituras[0].publicado_en, fecha); });
test('mapeo público no enlaza borradores, futuras o notas ausentes', () => {
  const { toHighlight } = cargar('src/lib/content/mappers.ts', { '@/lib/supabase/config': { publicImageUrl: r => r } });
  const fila = { id, tipo: 'cifra', valor: '57%', texto: 'Texto', fuentes: [], imagen_ruta: null };
  for (const nota of [null, { slug: 'oculta', estado: 'borrador', publicado_en: '2020-01-01' }, { slug: 'futura', estado: 'publicado', publicado_en: '2099-01-01' }]) assert.equal(toHighlight({ ...fila, nota }).articleSlug, null);
  assert.equal(toHighlight({ ...fila, nota: { slug: 'visible', estado: 'publicado', publicado_en: '2020-01-01' } }).articleSlug, 'visible');
});
