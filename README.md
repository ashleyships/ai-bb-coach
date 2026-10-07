# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Local student conversation

The simulator supports typed teacher messages through a small server-only Vite
middleware endpoint, `POST /api/student-response`. The official OpenAI SDK uses
Responses API text generation. Teacher speech-to-text is available as described
below; student voice output is described in Phase 2B. Evaluation and persistence
are not implemented.

1. Run `npm install`.
2. Copy `.env.example` to `.env` in the project root.
3. Set `OPENAI_API_KEY` in `.env` to your API key. Do not use a `VITE_` prefix.
4. Optionally set `OPENAI_MODEL` to a model available to your OpenAI project.
   When blank, the server uses `gpt-6-astra`.
5. Run `npm run dev`. Restart it after changing environment variables.
6. Open `/dashboard`, configure a practice session, and choose **Begin Lesson**.
   Enter sends a message; Shift+Enter inserts a newline.

The server receives the complete selected student profile and text transcript on
each turn. Teacher messages map to `user` and student messages to `assistant`.
The profile is context, not an instruction source, and missing MBTI is not inferred.
Responses use `store: false`. Only the server imports the OpenAI SDK; the key is
never included in browser code. `.env` and environment-specific files are ignored
by Git; `.env.example` contains empty variable names only.

While waiting for a reply, sends are disabled. If a request fails, **Retry student
response** reuses the pending transcript without adding a second teacher message.
End Lesson returns to the preserved Setup screen. Conversation changes are local
to the simulator and are not persisted across page reloads.

Run `npm run build`, `npm run lint`, and `npm test` for checks. Tests use offline
provider/fetch doubles and make no paid API calls. Manually check both preset and
custom profiles, full/section practice, Enter/Shift+Enter, loading, errors/retry,
and End Lesson in the browser with your key configured.

This endpoint is a **local development/preview foundation**, not a deployed
production backend. `npm run build` produces static frontend files only. For local
preview, run `npm run build` followed by `npm run preview`; the same middleware is
available. Static hosting alone will not provide the API endpoint. Keep the Vite
server local; authentication and deployment hardening are outside this phase.


## Teacher speech-to-text (Phase 2A)

Click **Record speech**, allow microphone access, speak, then click **Stop
recording**. MediaRecorder sends the recording to the server-only
`POST /api/transcribe` endpoint. The existing OpenAI SDK uses
`audio.transcriptions.create` with `gpt-transcribe`. The returned text is appended
to the current textarea draft. Review/edit it and press **Send** yourself;
transcription never sends a student-conversation request automatically.

The existing `OPENAI_API_KEY` is reused. Optionally set
`OPENAI_TRANSCRIPTION_MODEL` in your local `.env` to override the transcription
model. Restart `npm run dev` after configuration changes. No key is exposed to the
browser, and no new dependencies are needed. This endpoint also works through
`npm run preview`, with the same local-only hosting limitations as Phase 1.

Use localhost or HTTPS and a browser supporting MediaRecorder. The app negotiates
WebM/Opus, MP4, or Ogg/Opus support. Recordings stop automatically after two minutes
and are limited to 10 MiB. Audio is held in memory, sent to OpenAI for transcription,
and not written to disk by this app. Microphone tracks stop on Stop, recording
errors, or page exit. Leaving the page aborts the browser transcription request.

Manual checks:
- Record/stop, confirm text appears, edit it, and Send. Confirm no student response
  is requested before Send.
- Record with an existing draft: it should be preserved and the transcription
  appended on a new line.
- Deny microphone permission; typed messages should still work.
- Double-click recording controls, stop immediately, and try silence.
- End Lesson while recording/transcribing, including while permission is pending;
  the microphone indicator should turn off and no late text should be inserted.
- Test Chrome and Safari, failed network/API requests, and normal Phase 1 typing.

`npm test` includes offline recorder/permission/transport/provider tests. Real
microphone capture and OpenAI transcription still require browser verification.

## Student text-to-speech (Phase 2B)

New student replies automatically request MP3 audio from `POST /api/speech`.
The server uses `audio.speech.create`, `gpt-4o-mini-tts`, and the `marin` voice.
Only the response text is sent; the conversation generation and teacher recording
flows remain separate. The existing server API key is reused. Optional
`OPENAI_SPEECH_MODEL` overrides the Speech API model; restart Vite after changing it.

The UI discloses that the voice is AI-generated and offers loading status, Stop
and Replay. Stop cancels loading or playback. Replay generates fresh audio and
therefore makes another API request. New replies replace older audio. Leaving the
page aborts requests, stops playback, and releases object URLs. Audio errors do
not disable the conversation. Existing messages do not autoplay on page entry.

Browser autoplay policy may require clicking Replay. Speech is limited to 4,096
characters per reply; longer replies remain readable without audio. No streaming,
voice detection, automatic microphone interruption, or audio persistence is added.
Stop student audio before recording to avoid capturing speaker output. This uses
the same local Vite dev/preview backend as the other API endpoints.

The [Speech guide](https://developers.openai.com/api/docs/guides/text-to-speech)
still documents this non-Realtime API. The October 2026
[deprecation notice](https://developers.openai.com/api/docs/deprecations) announces
January 6, 2027 retirement of its dated TTS snapshots, recommending a Realtime
replacement. Revisit the model/API before that date; Realtime is outside Phase 2B.

Manual checks: send typed and transcribed messages; verify only student replies
speak, the transcript stays intact, Stop works during loading/playback, Replay
works after completion or autoplay blocking, newer replies replace old audio,
and End Lesson during loading/playback prevents late audio. Simulate a failed
speech request and confirm typing, microphone transcription, and Send still work.
Offline tests mock provider responses and browser audio; real playback and API
access require manual browser verification.

## Natural realtime lessons (Phase 2C — active simulator)

The main simulator now uses WebRTC speech-to-speech. Begin Lesson connects once;
allow microphone access and speak naturally. There are no manual Record/Send/Play
steps. The orb screen shows Listening, Thinking, Speaking, or a recoverable error.
Its microphone button means mute/unmute. Exit and End Lesson both stop the call
and return to the preserved Practice Setup screen.

`POST /api/realtime/session` exchanges the browser SDP offer for an OpenAI answer
through the unified `/v1/realtime/calls` interface. The permanent `OPENAI_API_KEY`
never leaves the server. Optional `OPENAI_REALTIME_MODEL` defaults to
`gpt-realtime-2.1`. Voice is `marin`; input transcription uses `gpt-transcribe`.
Restart Vite after changing server configuration. No dependencies were added.
This retains the existing local dev/preview server architecture; static hosting
alone cannot provide these endpoints.

**Teaching turn tuning:** edit `server/realtimeConfig.ts`, specifically
`teachingTurnDetection`. It starts with semantic VAD, `eagerness: "low"`,
`create_response: true`, and `interrupt_response: false`. Low eagerness allows
natural unfinished pauses while still responding to clear endings. Semantic VAD
uses meaning as well as audio; it is not a fixed silence timer. Test with real
teaching speech before changing eagerness. No turn timing is hidden in the hook.

Intentional teacher mute, automatic microphone suppression during student
thinking/speaking, and microphone hardware/permission failures are distinct.
Microphone audio is disabled until student playback finishes; generation finishing
alone does not reopen it. Muting clears uncommitted input (a partially spoken turn
may be discarded). Echo cancellation is requested. Interrupting the student is
not supported in this phase.

`useRealtimeLesson` composes the lifecycle controller in
`src/services/realtimeLesson.ts`. `useLessonTimer` owns elapsed display time.
`realtimeTranscript.ts` merges teacher and student transcript events by item ID
and conversation order. Event IDs prevent repeated deltas. Partial, failed, and
interrupted entries are retained; generated student text and interrupted playback
are distinguished. Transcription is best-effort and may differ from actual speech.
The old synthetic greeting is excluded from the realtime transcript.

The layout retains session records by lesson ID in React state when returning to
Setup. They are available through its typed Outlet context for a future evaluation
phase. They do not survive refresh or leaving the practice layout; there is no
persistence/history UI. End closes media immediately, so transcription not yet
received is marked incomplete rather than claimed as complete. Reconnect restores
completed text turns as context without replaying them, retaining the mute choice
and original timer start. Error time remains part of elapsed lesson time until End.

The Phase 1–2B hooks, API helpers and endpoints remain intact as reusable code;
they are no longer mounted by the active simulator. This is not an automatic
fallback UI. Earlier README sections describe those retained implementations.

Manual browser checks (localhost or HTTPS):
- Begin once, allow microphone access, explain something with brief and longer
  pauses. Confirm automatic response and repeated Listening → Thinking → Speaking
  → Listening cycles without buttons.
- Test loudspeaker output and headphones: student audio must not become teacher
  input. Confirm the microphone remains suppressed through the end of playback.
- Mute while listening and while the student speaks; after playback it must stay
  muted. Unmute during playback must not enable capture prematurely.
- Deny permission, unplug the microphone, block playback, disconnect the network,
  and retry. Check errors, resource release and retained transcript/context.
  Browser playback policy may require allowing site audio before reconnecting.
- Exit/End while permission is pending, connecting, thinking and speaking. Check
  the microphone indicator turns off, audio stops, and no late response occurs.
- Inspect PracticeFlowLayout state in React DevTools: teacher/student entries,
  correct order, no duplicates, incomplete/failed markers and stopped timer.
- Check mobile layout, keyboard focus, Chrome and Safari. Test the actual OpenAI
  connection with an account that has access to the configured model.

Run `npm run build`, `npm run lint`, and `npm test`. Realtime tests use offline
WebRTC/media/provider doubles, including cancellation, mute/suppression, ordering,
recovery, cleanup and endpoint validation. They do not verify live audio quality.
