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

const seo = cargar('src/lib/seo.ts');
function env(values, fn) {
  const old = { ...process.env };
  Object.assign(process.env, values);
  try { return fn(); } finally { process.env = old; }
}
test('solo producción real permite indexación; demo y previews quedan excluidos', () => {
  env({ NODE_ENV: 'production', VERCEL_ENV: 'production', CONTENT_SOURCE: 'supabase' }, () => {
    assert.equal(seo.publicRobots().index, true);
    assert.equal(seo.publicRobots(true).index, false);
  });
  for (const values of [{ NODE_ENV:'development' }, { VERCEL_ENV:'preview' }, { CONTENT_SOURCE:'demo' }]) {
    env({ NODE_ENV:'production', VERCEL_ENV:'production', CONTENT_SOURCE:'supabase', ...values }, () => assert.equal(seo.canIndex(), false));
  }
});
test('JSON-LD conserva texto y neutraliza cierre de script; canónicos usan dominio oficial', () => {
  const payload = { headline: '</script><script>alert(1)</script>' };
  const text = seo.serializeJsonLd(payload);
  assert.ok(!text.includes('<'));
  assert.deepEqual(JSON.parse(text), payload);
  assert.equal(seo.absoluteUrl('/nota/prueba'), 'https://www.fragmentados.org/nota/prueba');
});
test('NewsArticle usa autor, fechas e imagen reales y resumen del cuerpo si falta bajada', () => {
  const article = { slug:'prueba', title:'Título', deck:null, body:[{type:'parrafo',content:['Texto ',{type:'enfasis',text:'real'}]}], author:'Manuel', section:'politica', image:{src:'/foto.jpg'}, publishedAt:'2026-10-20T10:00:00Z', updatedAt:'2026-10-21T10:00:00Z' };
  const result = seo.articleJsonLd(article, 'Política');
  assert.equal(result['@type'], 'NewsArticle');
  assert.equal(result.description, 'Texto real');
  assert.equal(result.author.name, 'Manuel');
  assert.equal(result.dateModified, article.updatedAt);
  assert.deepEqual(result.image, ['https://www.fragmentados.org/foto.jpg']);
});
test('sitemap pagina más de 100 y 500 piezas y aplica filtros públicos en cada pedido', async () => {
  const calls = [];
  const all = Array.from({length: 601}, (_,i) => ({id: String(i).padStart(5,'0')}));
  const db = {from(table) {
    const filters = []; let after;
    const q = {
      select() { return q; }, eq(k,v) {filters.push([k,v]);return q;}, lte(k,v) {filters.push([k,v]);return q;},
      order(k) {assert.equal(k,'id');return q;}, limit(v) {assert.equal(v,500);return q;},
      gt(k,v) {assert.equal(k,'id');after=v;return q;},
      then(resolve) {calls.push({table,filters});return Promise.resolve({data: table === 'notas' ? all.filter(r=>!after || r.id>after).slice(0,500):[], error:null}).then(resolve);}
    };return q;
  }};
  const repo=cargar('src/lib/content/supabase-repository.ts', {
    'server-only':{}, '@/lib/supabase/public':{getPublicClient:()=>db},
    './mappers':{NOTA_COLUMNS:'id',FRAGMENTO_COLUMNS:'id',toArticle:r=>r,toFragment:r=>r,notNull:r=>r!==null}
  }).supabaseRepository;
  assert.equal((await repo.getSitemapContent()).length,601);
  assert.equal(calls.length,4);
  for(const call of calls) {
    assert.ok(call.filters.some(([k,v])=>k==='estado' && v==='publicado'));
    assert.ok(call.filters.some(([k,v])=>k==='es_demo' && v===false));
    assert.ok(call.filters.some(([k])=>k==='publicado_en'));
  }
});
test('sitemap excluye muestras y rutas privadas y mantiene fecha real', async () => {
  const sitemap=cargar('src/app/sitemap.ts', {
    '@/lib/seo':{...seo,canIndex:()=>true},
    '@/lib/content':{content:{getSections:async()=>[{slug:'politica'}],getSitemapContent:async()=>[
      {kind:'articulo',slug:'real',isDemo:false,publishedAt:'2026-10-21T10:00:00Z',image:{src:'/foto.jpg'}},
      {kind:'fragmento',slug:'muestra',isDemo:true,publishedAt:'2026-10-21T10:00:00Z'}
    ]}}
  }).default;
  const entries=await sitemap();
  assert.equal(entries.length,4);
  assert.ok(entries.every(x=>!/(muestra|panel|buscar)/.test(x.url)));
  assert.equal(entries.at(-1).lastModified,'2026-10-21T10:00:00Z');
});
