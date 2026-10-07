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
      ...overrides.globals, Blob, console, crypto: globalThis.crypto, AbortController, setTimeout: overrides.setTimeout ?? setTimeout, clearTimeout: overrides.clearTimeout ?? clearTimeout,
      fetch: (...args) => (overrides.fetch ?? globalThis.fetch)(...args),
    }, { filename });
    cache.set(filename, module.exports);
    return module.exports;
  }
  return load;
}

const { updateTranscript, finishTranscript } = loader()('src/utils/realtimeTranscript.ts');
const { presetStudents } = loader()('src/data/presetStudents.ts');
const session = { id: 'lesson', lessonId: 'tree-by-streams', student: presetStudents[0], difficulty: 'beginner', practiceScope: 'full', messages: [] };
const initial = () => ({ session, transcript: [], startedAt: null, endedAt: null });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('transcript reorders delayed teacher text, deduplicates finals and keeps failed/partial entries', () => {
  let entries = [];
  entries = updateTranscript(entries, { type: 'conversation.item.added', item: { id: 'student', role: 'assistant' }, previous_item_id: 'teacher' });
  const final = { type: 'response.output_audio_transcript.done', item_id: 'student', transcript: 'Hello' };
  entries = updateTranscript(entries, final); entries = updateTranscript(entries, final);
  entries = updateTranscript(entries, { type: 'conversation.item.input_audio_transcription.completed', item_id: 'teacher', transcript: 'Hi' });
  assert.deepEqual(Array.from(entries, e => e.id), ['teacher', 'student']);
  assert.equal(entries[0].role, 'teacher'); assert.equal(entries[1].content, 'Hello');
  entries = updateTranscript(entries, { type: 'conversation.item.input_audio_transcription.failed', item_id: 'failed' });
  entries = updateTranscript(entries, { type: 'conversation.item.input_audio_transcription.delta', item_id: 'partial', delta: 'Still' });
  const finished = finishTranscript(entries);
  assert.equal(finished[2].status, 'failed'); assert.equal(finished[3].status, 'incomplete');
});

function harness(options = {}) {
  let view, lesson, resolvePermission, resolveRequest;
  const peers = [], players = [], saved = [], sent = [], timers = new Map();
  let requests = 0, timerId = 0;
  const track = { enabled: true, stops: 0, stop() { this.stops++; } };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  class Peer {
    constructor() { peers.push(this); this.connectionState = 'new'; }
    createDataChannel() {
      this.channel = { readyState: 'open', send: data => sent.push(JSON.parse(data)), close() { this.readyState = 'closed'; } };
      return this.channel;
    }
    addTrack() {} async createOffer() { return { sdp: 'v=0 offer', type: 'offer' }; }
    async setLocalDescription() {} async setRemoteDescription() { this.remoteSet = true; }
    close() { this.connectionState = 'closed'; }
  }
  const globals = {
    navigator: { mediaDevices: { getUserMedia: () => options.deny ? Promise.reject(new DOMException('denied', 'NotAllowedError'))
      : options.permissionPending ? new Promise(resolve => { resolvePermission = resolve; }) : Promise.resolve(stream) } },
    RTCPeerConnection: Peer, DOMException,
    Audio: class { constructor() { players.push(this); } play() { return options.blockPlayback ? Promise.reject(new Error()) : Promise.resolve(); } pause() { this.paused = true; } },
    MediaStream: class {},
  };
  const { createRealtimeLesson } = loader({ globals,
    setTimeout: (fn) => { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
    '../api/realtimeSession': { requestRealtimeSession: async (_sdp, _session, signal) => {
      requests++; globals.signal = signal;
      if (options.requestFails) throw new Error('network');
      if (options.requestPending) return new Promise(resolve => { resolveRequest = resolve; });
      return 'v=0 answer';
    } },
  })('src/services/realtimeLesson.ts');
  const controller = createRealtimeLesson(options.initial ?? initial(), value => { view = value; }, value => { lesson = value; saved.push(value); }, options.muted);
  return { controller, track, peers, players, saved, sent, timers,
    get view() { return view; }, get lesson() { return lesson; }, get requests() { return requests; },
    get signal() { return globals.signal; },
    allow() { resolvePermission(stream); }, answer() { resolveRequest('v=0 answer'); },
    open() { peers[0].channel.onopen(); },
    event(event) { peers[0].channel.onmessage({ data: JSON.stringify(event) }); },
  };
}

test('automatic turn cycle suppresses microphone through playback, not merely generation', async () => {
  const h = harness(); await h.controller.start(); await h.controller.start();
  assert.equal(h.requests, 1); assert.equal(h.track.enabled, false);
  h.open(); assert.equal(h.view.status, 'listening'); assert.equal(h.track.enabled, true);
  h.event({ type: 'input_audio_buffer.speech_stopped' });
  assert.equal(h.view.status, 'thinking'); assert.equal(h.track.enabled, false);
  assert.equal(h.view.teacherMuted, false); assert.equal(h.view.microphoneSuppressed, true);
  h.event({ type: 'output_audio_buffer.started' });
  h.event({ type: 'response.done', response: { status: 'completed' } });
  assert.equal(h.view.status, 'speaking'); assert.equal(h.track.enabled, false);
  h.event({ type: 'output_audio_buffer.stopped' });
  assert.equal(h.view.status, 'listening'); assert.equal(h.track.enabled, true);
  h.controller.end(); assert.ok(h.lesson.endedAt); assert.equal(h.track.stops, 1);
});

test('intentional mute is independent of suppression and survives student playback', async () => {
  const h = harness(); await h.controller.start(); h.open(); h.controller.toggleMute();
  assert.equal(h.view.teacherMuted, true); assert.equal(h.view.microphoneSuppressed, false);
  assert.equal(h.track.enabled, false); assert.equal(h.view.microphoneUnavailable, false);
  h.event({ type: 'output_audio_buffer.started' }); h.event({ type: 'output_audio_buffer.stopped' });
  assert.equal(h.view.teacherMuted, true); assert.equal(h.track.enabled, false);
  h.controller.toggleMute(); assert.equal(h.track.enabled, true);
  h.event({ type: 'output_audio_buffer.started' }); h.controller.toggleMute(); h.controller.toggleMute();
  assert.equal(h.view.teacherMuted, false); assert.equal(h.track.enabled, false);
  h.controller.end();
});

test('ending pending permission or SDP request prevents late connections', async () => {
  const permission = harness({ permissionPending: true }); const first = permission.controller.start();
  permission.controller.end(); permission.allow(); await first;
  assert.equal(permission.track.stops, 1); assert.equal(permission.peers.length, 0);
  const request = harness({ requestPending: true }); const second = request.controller.start(); await tick();
  request.controller.end(); assert.equal(request.signal.aborted, true); request.answer(); await second;
  assert.equal(request.peers[0].remoteSet, undefined);
});

test('permission, transport, playback and device failures leave recoverable distinct states', async () => {
  for (const options of [{ deny: true }, { requestFails: true }, { blockPlayback: true }, {}]) {
    const h = harness(options); await h.controller.start();
    if (options.blockPlayback) { h.open(); h.peers[0].ontrack({ streams: [{}] }); await tick(); }
    else if (!options.deny && !options.requestFails) { h.open(); h.track.onended(); }
    assert.equal(h.view.status, 'error'); assert.ok(h.view.error);
    assert.equal(h.view.microphoneUnavailable, !!options.deny || Object.keys(options).length === 0);
    assert.equal(h.view.teacherMuted, false); h.controller.end();
  }
});

test('end stops playback and saves partial transcript; late events are ignored', async () => {
  const h = harness(); await h.controller.start(); h.open();
  h.peers[0].ontrack({ streams: [{}] });
  h.event({ type: 'conversation.item.input_audio_transcription.delta', event_id: 'e1', item_id: 't1', delta: 'Hello' });
  h.event({ type: 'conversation.item.input_audio_transcription.delta', event_id: 'e1', item_id: 't1', delta: 'Hello' });
  const stale = h.peers[0].channel.onmessage;
  h.controller.end(); h.controller.end();
  stale({ data: JSON.stringify({ type: 'output_audio_buffer.started' }) });
  assert.equal(h.view.status, 'ended'); assert.equal(h.players[0].paused, true);
  assert.equal(h.players[0].srcObject, null); assert.equal(h.track.stops, 1);
  assert.equal(h.lesson.transcript[0].content, 'Hello'); assert.equal(h.lesson.transcript[0].status, 'incomplete');
});

test('reconnect restores completed history without requesting speech and retains intentional mute', async () => {
  const prior = initial(); prior.startedAt = 10;
  prior.transcript = [{ id: 't1', role: 'teacher', content: 'Hi', timestamp: 11, status: 'complete' }];
  const h = harness({ initial: prior, muted: true }); await h.controller.start(); h.open();
  assert.equal(h.lesson.startedAt, 10); assert.equal(h.track.enabled, false);
  assert.equal(h.sent[0].type, 'conversation.item.create'); assert.equal(h.sent[0].item.content[0].text, 'Hi');
  assert.equal(h.sent.some(e => e.type === 'response.create'), false); h.controller.end();
});

test('server uses trusted teaching VAD configuration and never returns the permanent key', async () => {
  let sent;
  const { createRealtimeSession } = loader({ globals: { FormData, AbortSignal }, fetch: async (url, options) => {
    sent = { url, ...options }; return { ok: true, text: async () => 'v=0 answer' };
  } })('server/realtimeApiPlugin.ts');
  const result = await createRealtimeSession({ sdp: 'v=0 offer', session }, { apiKey: 'secret' }, new AbortController().signal);
  assert.equal(result.status, 200); assert.equal(JSON.stringify(result).includes('secret'), false);
  const config = JSON.parse(sent.body.get('session'));
  assert.equal(config.audio.input.turn_detection.eagerness, 'low');
  assert.equal(config.audio.input.turn_detection.create_response, true);
  assert.equal(config.audio.input.turn_detection.interrupt_response, false);
  assert.match(config.instructions, /roleplaying the STUDENT/);
  assert.equal((await createRealtimeSession({}, {}, new AbortController().signal)).status, 400);
  assert.equal((await createRealtimeSession({ sdp: 'v=0', session }, {}, new AbortController().signal)).status, 503);
});

test('connection loss and response deadlines release resources and allow a new attempt', async () => {
  for (const reason of ['disconnect', 'deadline']) {
    const h = harness(); await h.controller.start(); h.open();
    if (reason === 'disconnect') {
      h.peers[0].connectionState = 'disconnected'; h.peers[0].onconnectionstatechange();
    } else {
      h.event({ type: 'response.created' }); [...h.timers.values()][0]();
    }
    assert.equal(h.view.status, 'error'); assert.equal(h.track.stops, 1);
    assert.equal(h.timers.size, 0); h.controller.end();
  }
});

test('ending student playback marks generated text as interrupted audio', async () => {
  const h = harness(); await h.controller.start(); h.open();
  h.event({ type: 'response.output_audio_transcript.done', item_id: 's1', transcript: 'A long response' });
  h.event({ type: 'output_audio_buffer.started' }); h.controller.end();
  assert.equal(h.lesson.transcript[0].status, 'complete');
  assert.equal(h.lesson.transcript[0].playback, 'interrupted');
});

test('immersive page offers mute and exit, with no manual turn controls or transcript', () => {
  const actions = [];
  const jsx = (type, props) => typeof type === 'function' ? type(props) : { type, props };
  const page = loader({
    'react-router-dom': { Link: 'a', useLocation: () => ({ key: 'test', state: session }), useOutletContext: () => ({ saveLesson() {} }), useNavigate: () => () => actions.push('navigate') },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' }, './LessonSimulatorPage.css': {},
    '../hooks/useLessonTimer': { useLessonTimer: () => '00:10' },
    '../hooks/useRealtimeLesson': { useRealtimeLesson: () => ({ view: { status: 'listening', teacherMuted: false }, lesson: initial(), end: () => actions.push('end'), toggleMute: () => actions.push('mute'), retry() {} }) },
  })('src/pages/LessonSimulatorPage.tsx').default;
  function nodes(n) { if (!n || typeof n !== 'object') return []; if (Array.isArray(n)) return n.flatMap(nodes); return [n, ...nodes(n.props?.children)]; }
  const all = nodes(page());
  assert.equal(all.some(n => ['textarea', 'form', 'ol'].includes(n.type)), false);
  all.find(n => n.props?.['aria-label'] === 'Mute microphone').props.onClick();
  all.find(n => n.props?.className === 'simulator-end-button').props.onClick();
  assert.deepEqual(actions, ['mute', 'end', 'navigate']);
});

test('realtime HTTP middleware rejects malformed, oversized and unsupported requests', async () => {
  const { realtimeApiPlugin } = loader()('server/realtimeApiPlugin.ts');
  let handler;
  realtimeApiPlugin({}).configureServer({ middlewares: { use: h => { handler = h; } } });
  for (const [method, type, body, expected] of [
    ['GET', 'application/json', '{}', 405], ['POST', 'text/plain', '{}', 415],
    ['POST', 'application/json', '{', 400], ['POST', 'application/json', 'x'.repeat(262145), 413],
  ]) {
    const req = Readable.from([Buffer.from(body)]);
    Object.assign(req, { url: '/api/realtime/session', method, headers: { 'content-type': type } });
    let status;
    await handler(req, { setHeader() {}, writeHead(s) { status = s; }, end() {} }, () => assert.fail());
    assert.equal(status, expected);
  }
});
