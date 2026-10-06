const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const ts = require('typescript');

function loader(overrides = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const localRequire = (name) => {
      if (name in overrides) return overrides[name];
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name.endsWith(".ts") ? name : `${name}.ts`));
      return require(name);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: localRequire,
      ...overrides.globals, Blob, console, crypto: globalThis.crypto, AbortController, setTimeout, clearTimeout,
      fetch: (...args) => (overrides.fetch ?? globalThis.fetch)(...args),
    }, { filename });
    cache.set(filename, module.exports);
    return module.exports;
  }
  return load;
}

const { generateSpeech, speechApiPlugin } = loader()('server/speechApiPlugin.ts');
const client = create => ({ audio: { speech: { create } } });

test('speech uses exact student text, MP3 and configured server model', async () => {
  let sent;
  const result = await generateSpeech({ text: 'Hello teacher.' }, { apiKey: 'test' }, undefined,
    client(async input => { sent = input; return { arrayBuffer: async () => new Uint8Array([1, 2]).buffer }; }));
  assert.equal(result.status, 200);
  assert.equal(sent.input, 'Hello teacher.');
  assert.equal(sent.model, 'gpt-4o-mini-tts');
  assert.equal(sent.voice, 'marin');
  assert.equal(sent.response_format, 'mp3');
  assert.ok(Buffer.isBuffer(result.body));
});

test('speech validates text and masks provider errors', async () => {
  for (const text of ['', '   ', 'x'.repeat(4097), 23]) {
    assert.equal((await generateSpeech({ text }, {})).status, 400);
  }
  assert.equal((await generateSpeech({ text: 'Hello' }, {})).status, 503);
  const result = await generateSpeech({ text: 'Hello' }, { apiKey: 'test' }, undefined,
    client(async () => { throw new Error('secret'); }));
  assert.equal(result.status, 502);
  assert.equal(result.body.code, 'SPEECH_FAILED');
});

test('speech middleware rejects invalid requests before calling provider', async () => {
  let handler;
  speechApiPlugin({}).configureServer({ middlewares: { use: h => { handler = h; } } });
  for (const [method, type, body, expected] of [
    ['GET', 'application/json', '{}', 405], ['POST', 'text/plain', '{}', 415],
    ['POST', 'application/json', '{', 400], ['POST', 'application/json', 'x'.repeat(32769), 413],
  ]) {
    const req = Readable.from([Buffer.from(body)]);
    Object.assign(req, { url: '/api/speech', method, headers: { 'content-type': type } });
    let status;
    await handler(req, { setHeader() {}, writeHead(s) { status = s; }, end() {} }, () => assert.fail());
    assert.equal(status, expected);
  }
});

const tick = () => new Promise(resolve => setImmediate(resolve));
const student = (id, content = 'Student words') => ({ id, content, role: 'student', timestamp: 1 });
function harness({ blocked = false } = {}) {
  const states = [], refs = [], effects = [], callbacks = [];
  let si = 0, ri = 0, ei = 0, ci = 0;
  const pending = [], players = [], revoked = [], urls = [];
  const { useStudentSpeech } = loader({
    react: {
      useState(initial) { const i = si++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
      useRef(initial) { const i = ri++; return refs[i] ??= { current: initial }; },
      useCallback(fn) { const i = ci++; return callbacks[i] ??= fn; },
      useEffect(fn, deps) {
        const i = ei++, previous = effects[i];
        if (!previous || deps.some((dep, j) => dep !== previous.deps[j])) {
          previous?.cleanup?.(); effects[i] = { fn, deps, pending: true };
        }
      },
    },
    '../api/studentSpeech': { requestStudentSpeech(text, signal) {
      return new Promise((resolve, reject) => pending.push({ text, signal, resolve, reject }));
    } },
    globals: {
      URL: { createObjectURL() { const url = `blob:${urls.length}`; urls.push(url); return url; }, revokeObjectURL(url) { revoked.push(url); } },
      Audio: class {
        constructor(url) { this.url = url; this.paused = false; players.push(this); }
        play() { return blocked ? Promise.reject(new Error('blocked')) : Promise.resolve(); }
        pause() { this.paused = true; }
        removeAttribute() {} load() {}
      },
    },
  })('src/hooks/useStudentSpeech.ts');
  return {
    render(message) {
      si = ri = ei = ci = 0;
      const ui = useStudentSpeech(message);
      for (const effect of effects) if (effect.pending) { effect.pending = false; effect.cleanup = effect.fn(); }
      return ui;
    },
    unmount() { effects.forEach(effect => effect.cleanup?.()); },
    pending, players, revoked, urls,
  };
}

test('only new student replies autoplay; stop cancels late responses', async () => {
  const h = harness();
  h.render(student('initial')); assert.equal(h.pending.length, 0);
  h.render({ ...student('teacher'), role: 'teacher' }); assert.equal(h.pending.length, 0);
  const ui = h.render(student('new')); await tick(); assert.equal(h.pending.length, 1);
  assert.equal(h.pending[0].text, 'Student words');
  ui.stop(); assert.equal(h.pending[0].signal.aborted, true);
  h.pending[0].resolve(new Blob(['mp3'])); await tick();
  assert.equal(h.players.length, 0); h.unmount();
});

test('new replies and repeated replay invalidate old work; unmount releases playback', async () => {
  const h = harness(); h.render(student('initial'));
  const ui = h.render(student('new')); await tick();
  ui.replay(); ui.replay();
  assert.equal(h.pending[0].signal.aborted, true);
  assert.equal(h.pending[1].signal.aborted, true);
  h.pending[0].resolve(new Blob(['old'])); h.pending[1].resolve(new Blob(['old']));
  h.pending[2].resolve(new Blob(['new'])); await tick();
  assert.equal(h.players.length, 1);
  h.unmount(); assert.equal(h.players[0].paused, true);
  assert.deepEqual(h.revoked, h.urls);
});

test('unmount cancels generation and late audio never plays', async () => {
  const h = harness(); h.render(student('initial')); h.render(student('new')); await tick();
  h.unmount(); assert.equal(h.pending[0].signal.aborted, true);
  h.pending[0].resolve(new Blob(['late'])); await tick(); assert.equal(h.players.length, 0);
});

test('audio failure is nonblocking and replay can recover', async () => {
  const h = harness(); h.render(student('initial')); let ui = h.render(student('new')); await tick();
  h.pending[0].reject(new Error('provider failed')); await tick();
  ui = h.render(student('new')); assert.equal(ui.status, 'error'); assert.ok(ui.error);
  ui.replay(); h.pending[1].resolve(new Blob(['mp3'])); await tick();
  h.players[0].onerror(); assert.equal(h.players[0].paused, true);
  assert.deepEqual(h.revoked, h.urls); h.unmount();
});

test('frontend sends text and abort signal; rejects non-audio and empty responses', async () => {
  const signal = new AbortController().signal;
  let sent;
  const api = loader({ fetch: async (url, options) => {
    sent = { url, ...options };
    return { ok: true, headers: new Headers({ 'content-type': 'audio/mpeg' }), blob: async () => new Blob(['mp3']) };
  } })('src/api/studentSpeech.ts');
  assert.equal((await api.requestStudentSpeech('Student words', signal)).size, 3);
  assert.equal(sent.url, '/api/speech'); assert.equal(sent.signal, signal);
  assert.deepEqual(JSON.parse(sent.body), { text: 'Student words' });
  for (const response of [
    { ok: true, headers: new Headers({ 'content-type': 'text/html' }) },
    { ok: true, headers: new Headers({ 'content-type': 'audio/mpeg' }), blob: async () => new Blob([]) },
    { ok: false, json: async () => ({ code: 'secret' }) },
  ]) {
    const failing = loader({ fetch: async () => response })('src/api/studentSpeech.ts');
    await assert.rejects(failing.requestStudentSpeech('Words', signal), e => !e.message.includes('secret'));
  }
});


test('a newer reply stops active audio and stale completion cannot change it', async () => {
  const h = harness(); h.render(student('initial')); h.render(student('first')); await tick();
  h.pending[0].resolve(new Blob(['first'])); await tick();
  const oldEnded = h.players[0].onended;
  h.render(student('second', 'New response')); await tick();
  assert.equal(h.players[0].paused, true); assert.equal(h.revoked.length, 1);
  oldEnded();
  h.pending[1].resolve(new Blob(['second'])); await tick();
  assert.equal(h.players.length, 2); assert.equal(h.players[1].paused, false);
  h.players[1].onended(); assert.deepEqual(h.revoked, h.urls); h.unmount();
});

test('rejected browser play promise releases audio and shows a replay error', async () => {
  const h = harness({ blocked: true }); h.render(student('initial')); h.render(student('new')); await tick();
  h.pending[0].resolve(new Blob(['audio'])); await tick();
  const ui = h.render(student('new'));
  assert.equal(ui.status, 'error'); assert.match(ui.error, /Replay/);
  assert.equal(h.players[0].paused, true); assert.deepEqual(h.revoked, h.urls); h.unmount();
});
