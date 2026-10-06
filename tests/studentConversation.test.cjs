const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const ts = require('typescript');

// Run the actual TypeScript modules with offline boundaries; no paid API calls.
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
      console, crypto: globalThis.crypto, AbortController, setTimeout, clearTimeout,
      fetch: (...args) => (overrides.fetch ?? globalThis.fetch)(...args),
    }, { filename });
    cache.set(filename, module.exports);
    return module.exports;
  }
  return load;
}
const load = loader();
const { presetStudents } = load('src/data/presetStudents.ts');
const { generateStudentResponse } = load('server/studentResponse.ts');
const session = {
  id: 'session-1', lessonId: 'tree-by-streams', student: { ...presetStudents[0] },
  difficulty: 'intermediate', practiceScope: 'section', selectedSection: 'body',
  messages: [
    { id: 's1', role: 'student', content: "Hi, I'm ready.", timestamp: 1 },
    { id: 't1', role: 'teacher', content: 'How was your week?', timestamp: 2 },
  ],
};
const client = (create) => ({ responses: { create } });

test('server uses full profile, full history, scope, and student-only instructions', async () => {
  let request;
  const result = await generateStudentResponse(session, { apiKey: 'test-only', model: 'test-model' }, client(async (input) => {
    request = input;
    return { output_text: '  Busy with deadlines.  ' };
  }));
  assert.equal(result.status, 200);
  assert.equal(result.body.message.content, 'Busy with deadlines.');
  assert.equal(result.body.message.role, 'student');
  assert.ok(result.body.message.id);
  assert.equal(typeof result.body.message.timestamp, 'number');
  assert.equal(request.model, 'test-model');
  assert.equal(request.store, false);
  assert.equal(request.input.length, 2);
  assert.equal(request.input[0].role, 'assistant');
  assert.equal(request.input[1].role, 'user');
  assert.ok(request.instructions.includes(JSON.stringify(session.student)));
  assert.match(request.instructions, /Specific section — Body/);
  assert.match(request.instructions, /Do not coach, evaluate/);
  assert.match(request.instructions, /Never infer or assign an MBTI/);
  assert.equal(session.messages.length, 2);
});

test('invalid sessions and missing configuration do not call the provider', async () => {
  const never = client(() => { throw new Error('must not call'); });
  for (const input of [null, {}, { ...session, messages: [] }, { ...session, student: {} },
    { ...session, messages: [{ ...session.messages[1], content: ' ' }] },
    { ...session, messages: [session.messages[0]] }]) {
    assert.equal((await generateStudentResponse(input, { apiKey: 'test' }, never)).status, 400);
  }
  assert.equal((await generateStudentResponse(session, {}, never)).body.code, 'NOT_CONFIGURED');
});

test('provider failures and empty output return safe errors', async () => {
  const failed = await generateStudentResponse(session, { apiKey: 'test' }, client(async () => { throw new Error('secret provider detail'); }));
  assert.equal(failed.body.code, 'AI_UNAVAILABLE');
  assert.ok(!JSON.stringify(failed).includes('secret'));
  const empty = await generateStudentResponse(session, { apiKey: 'test' }, client(async () => ({ output_text: ' ' })));
  assert.equal(empty.body.code, 'EMPTY_RESPONSE');
});

test('HTTP middleware rejects malformed JSON and oversized requests', async () => {
  const { studentApiPlugin } = load('server/studentApiPlugin.ts');
  let handler;
  studentApiPlugin({}).configureServer({ middlewares: { use(fn) { handler = fn; } } });
  async function request(body, method = 'POST') {
    const req = Readable.from([Buffer.from(body)]);
    req.url = '/api/student-response'; req.method = method;
    req.headers = { 'content-type': 'application/json' };
    let status, payload;
    await handler(req, { setHeader() {}, writeHead(value) { status = value; }, end(value) { payload = JSON.parse(value); } }, () => {});
    return { status, payload };
  }
  assert.equal((await request('{')).status, 400);
  assert.equal((await request('x'.repeat(256 * 1024 + 1))).status, 413);
  assert.equal((await request('{}', 'GET')).status, 405);
  assert.equal((await request(JSON.stringify(session))).payload.code, 'NOT_CONFIGURED');
});

function conversation(fetch) {
  const states = [], refs = [];
  let stateIndex = 0, refIndex = 0;
  const react = {
    useState(initial) { const i = stateIndex++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useRef(initial) { const i = refIndex++; if (!(i in refs)) refs[i] = { current: initial }; return refs[i]; },
    useEffect() {},
  };
  const { useLessonConversation } = loader({ react, fetch })('src/hooks/useLessonConversation.ts');
  const initial = { ...session, messages: [session.messages[0]] };
  return { initial, render() { stateIndex = 0; refIndex = 0; return useLessonConversation(initial); } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const reply = { id: 'response-1', role: 'student', content: 'A busy week.', timestamp: 3 };

test('typed flow appends immutably, blocks empty and duplicate sends, and includes history', async () => {
  let resolve, count = 0, sent;
  const flow = conversation((_url, options) => {
    count++; sent = JSON.parse(options.body);
    return new Promise(done => { resolve = done; });
  });
  let ui = flow.render(); ui.sendMessage(); assert.equal(count, 0);
  ui.setDraft('  Hello  '); ui = flow.render(); ui.sendMessage(); ui.sendMessage();
  assert.equal(count, 1);
  ui = flow.render(); assert.equal(ui.isSending, true);
  assert.equal(ui.session.messages.at(-1).content, 'Hello');
  assert.equal(sent.messages.length, 2);
  assert.equal(flow.initial.messages.length, 1);
  resolve({ ok: true, json: async () => ({ message: reply }) }); await tick();
  ui = flow.render(); assert.equal(ui.isSending, false); assert.equal(ui.session.messages.length, 3);
  assert.equal(ui.session.messages.at(-1).role, 'student');
});

test('retry keeps one teacher message and safe error states', async () => {
  let count = 0;
  const flow = conversation(async () => {
    count++;
    return count === 1
      ? { ok: false, json: async () => ({ code: 'AI_UNAVAILABLE', error: 'secret' }) }
      : { ok: true, json: async () => ({ message: reply }) };
  });
  let ui = flow.render(); ui.setDraft('Hello'); ui = flow.render(); ui.sendMessage(); await tick();
  ui = flow.render(); assert.equal(ui.canRetry, true); assert.ok(ui.error); assert.ok(!ui.error.includes('secret'));
  ui.retryResponse(); await tick(); ui = flow.render();
  assert.equal(ui.canRetry, false); assert.equal(ui.session.messages.length, 3);
  assert.equal(ui.session.messages.filter(m => m.role === 'teacher').length, 1);
});

test('client rejects malformed success and masks unknown server error codes', async () => {
  for (const response of [{ ok: true, json: async () => ({ message: {} }) },
    { ok: false, json: async () => ({ code: 'secret diagnostic' }) }]) {
    const { requestStudentResponse } = loader({ fetch: async () => response })('src/api/studentResponse.ts');
    await assert.rejects(requestStudentResponse(session, new AbortController().signal), error => !error.message.includes('secret'));
  }
});
