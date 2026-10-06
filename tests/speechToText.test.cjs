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

const load = loader();
const { transcribeAudio, transcriptionApiPlugin } = load('server/transcriptionApiPlugin.ts');
const audio = Buffer.from('test recording bytes');
const client = (create) => ({ audio: { transcriptions: { create } } });

test('audio reaches transcription with correct filename, MIME type and model', async () => {
  let request;
  const result = await transcribeAudio(audio, 'audio/webm', { apiKey: 'test' }, client(async (input) => {
    request = input; return { text: '  Hello student.  ' };
  }));
  assert.equal(result.status, 200);
  assert.equal(result.body.text, 'Hello student.');
  assert.equal(request.model, 'gpt-transcribe');
  assert.equal(request.file.name, 'recording.webm');
  assert.equal(request.file.type, 'audio/webm');
  assert.equal(request.file.size, audio.length);
});

test('invalid audio, missing configuration, empty speech and API errors are safe', async () => {
  assert.equal((await transcribeAudio(Buffer.alloc(0), 'audio/webm', {})).status, 400);
  assert.equal((await transcribeAudio(audio, 'text/plain', {})).status, 415);
  assert.equal((await transcribeAudio(Buffer.alloc(10 * 1024 * 1024 + 1), 'audio/webm', {})).status, 413);
  assert.equal((await transcribeAudio(audio, 'audio/mp4', {})).body.code, 'NOT_CONFIGURED');
  assert.equal((await transcribeAudio(audio, 'audio/mp4', { apiKey: 'test' }, client(async () => ({ text: '' })))).body.code, 'NO_SPEECH');
  const failed = await transcribeAudio(audio, 'audio/ogg', { apiKey: 'test' }, client(async () => { throw Error('secret'); }));
  assert.equal(failed.body.code, 'TRANSCRIPTION_FAILED');
  assert.ok(!JSON.stringify(failed).includes('secret'));
});

test('transcription middleware validates transport and normalises codec MIME types', async () => {
  let handler;
  transcriptionApiPlugin({}).configureServer({ middlewares: { use(fn) { handler = fn; } } });
  async function request(body, mime = 'audio/webm;codecs=opus', method = 'POST') {
    const req = Readable.from([body]); req.url = '/api/transcribe'; req.method = method;
    req.headers = { 'content-type': mime };
    let status, payload;
    await handler(req, { setHeader() {}, writeHead(value) { status = value; }, end(value) { payload = JSON.parse(value); } }, () => {});
    return { status, payload };
  }
  assert.equal((await request(audio)).payload.code, 'NOT_CONFIGURED');
  assert.equal((await request(audio, 'application/json')).status, 415);
  assert.equal((await request(audio, 'audio/webm', 'GET')).status, 405);
  assert.equal((await request(Buffer.alloc(10 * 1024 * 1024 + 1))).status, 413);
});

const tick = () => new Promise(resolve => setImmediate(resolve));
function recordingHarness({ deny = false, delayedPermission = false, empty = false, failedUpload = false, format = 'audio/webm' } = {}) {
  const states = [], refs = [], instances = [];
  let si = 0, ri = 0, cleanup, permissions = 0, stops = 0, uploads = 0, resolvePermission;
  const texts = [];
  const stream = { getTracks: () => [{ stop() { stops++; } }] };
  class Recorder {
    static isTypeSupported(type) { return type.startsWith(format); }
    constructor(_stream, options) { this.mimeType = options.mimeType; this.state = 'inactive'; instances.push(this); }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      queueMicrotask(() => {
        this.ondataavailable?.({ data: new Blob(empty ? [] : ['audio'], { type: this.mimeType }) });
        this.onstop?.();
      });
    }
  }
  const react = {
    useState(value) { const i = si++; if (!(i in states)) states[i] = value; return [states[i], next => { states[i] = next; }]; },
    useRef(value) { const i = ri++; if (!(i in refs)) refs[i] = { current: value }; return refs[i]; },
    useEffect(fn) { if (!cleanup) cleanup = fn(); },
  };
  const { useSpeechToText } = loader({
    react,
    globals: { MediaRecorder: Recorder, navigator: { mediaDevices: { getUserMedia: async () => {
      permissions++;
      if (deny) throw { name: 'NotAllowedError' };
      if (delayedPermission) return new Promise(resolve => { resolvePermission = resolve; });
      return stream;
    } } } },
    '../api/transcription': { requestTranscription: async () => {
      uploads++; if (failedUpload) throw Error('Transcription failed'); return 'Hello student.';
    } },
  })('src/hooks/useSpeechToText.ts');
  return {
    render() { si = 0; ri = 0; return useSpeechToText(text => texts.push(text)); },
    unmount() { cleanup(); }, resolvePermission() { resolvePermission(stream); },
    get permissions() { return permissions; }, get stops() { return stops; },
    get uploads() { return uploads; }, texts, instances,
  };
}

test('record/stop transcribes once, blocks repeated starts, releases mic and only returns text', async () => {
  const harness = recordingHarness();
  let ui = harness.render(); await Promise.all([ui.startRecording(), ui.startRecording()]);
  assert.equal(harness.permissions, 1);
  ui = harness.render(); assert.equal(ui.status, 'recording');
  ui.stopRecording(); ui.stopRecording();
  assert.ok(harness.stops > 0);
  assert.equal(harness.render().status, 'transcribing');
  await tick();
  assert.equal(harness.uploads, 1);
  assert.deepEqual(harness.texts, ['Hello student.']);
  assert.equal(harness.render().status, 'idle');
  harness.unmount();
});

test('permission denial leaves typed input available', async () => {
  const harness = recordingHarness({ deny: true });
  await harness.render().startRecording();
  const ui = harness.render();
  assert.equal(ui.status, 'error'); assert.match(ui.error, /permission was denied/);
  assert.equal(ui.isBusy, false); assert.equal(harness.uploads, 0);
  harness.unmount();
});

test('unmount during recording or pending permission releases tracks without uploading', async () => {
  const running = recordingHarness(); await running.render().startRecording(); running.unmount(); await tick();
  assert.ok(running.stops > 0); assert.equal(running.uploads, 0);
  const pending = recordingHarness({ delayedPermission: true });
  const start = pending.render().startRecording(); pending.unmount(); pending.resolvePermission(); await start;
  assert.ok(pending.stops > 0); assert.equal(pending.instances.length, 0); assert.equal(pending.uploads, 0);
});

test('empty recording and failed transcription recover with an error', async () => {
  for (const options of [{ empty: true }, { failedUpload: true }]) {
    const harness = recordingHarness(options); await harness.render().startRecording(); harness.render().stopRecording(); await tick();
    assert.equal(harness.render().status, 'error'); assert.equal(harness.render().isBusy, false);
    assert.equal(harness.texts.length, 0); assert.ok(harness.stops > 0); harness.unmount();
  }
});

test('MP4 fallback is supported', async () => {
  const harness = recordingHarness({ format: 'audio/mp4' }); await harness.render().startRecording();
  assert.equal(harness.instances[0].mimeType, 'audio/mp4'); harness.render().stopRecording(); await tick();
  assert.equal(harness.uploads, 1); harness.unmount();
});

test('frontend posts raw audio only to transcription and rejects malformed output', async () => {
  let url, sent;
  const audio = new Blob(['audio'], { type: 'audio/webm' });
  const { requestTranscription } = loader({ fetch: async (target, options) => {
    url = target; sent = options; return { ok: true, json: async () => ({ text: ' Spoken words ' }) };
  } })('src/api/transcription.ts');
  assert.equal(await requestTranscription(audio, new AbortController().signal), 'Spoken words');
  assert.equal(url, '/api/transcribe'); assert.equal(sent.body, audio);
  for (const response of [{ ok: true, json: async () => ({ text: '' }) }, { ok: false, json: async () => ({ code: 'secret details' }) }]) {
    const api = loader({ fetch: async () => response })('src/api/transcription.ts');
    await assert.rejects(api.requestTranscription(audio, new AbortController().signal), error => !error.message.includes('secret'));
  }
});

test('page appends transcription to draft without sending; Send remains explicit', () => {
  let draft = 'Existing words', sends = 0, transcribe;
  const jsx = (type, props) => typeof type === 'function' ? type(props) : { type, props };
  const { presetStudents } = load('src/data/presetStudents.ts');
  const session = { id: 's1', lessonId: 'tree-by-streams', student: presetStudents[0], difficulty: 'beginner', practiceScope: 'full', messages: [] };
  const page = loader({
    'react-router-dom': { Link: 'a', useLocation: () => ({ key: 'test', state: session }) },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    '../assets/emblem.jpg': {}, './LessonSimulatorPage.css': {},
    '../hooks/useLessonConversation': { useLessonConversation: () => ({
      session, draft, setDraft: value => { draft = typeof value === 'function' ? value(draft) : value; },
      isSending: false, error: '', canRetry: false, sendMessage: () => { sends++; }, retryResponse() {},
    }) },
    '../hooks/useStudentSpeech': { useStudentSpeech: () => ({ status: 'idle', error: '', canReplay: false, stop() {}, replay() {} }) },
    '../hooks/useSpeechToText': { useSpeechToText: callback => {
      transcribe = callback; return { status: 'idle', isBusy: false, error: '', startRecording() {}, stopRecording() {} };
    } },
  })('src/pages/LessonSimulatorPage.tsx').default;
  let tree = page(); transcribe('Spoken words');
  assert.equal(draft, 'Existing words\nSpoken words'); assert.equal(sends, 0);
  tree = page();
  function nodes(n) { if (!n || typeof n !== 'object') return []; if (Array.isArray(n)) return n.flatMap(nodes); return [n, ...nodes(n.props?.children)]; }
  const form = nodes(tree).find(n => n.type === 'form');
  form.props.onSubmit({ preventDefault() {} }); assert.equal(sends, 1);
});
