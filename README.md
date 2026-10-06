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
below; student voice output, evaluation, and persistence are not implemented.

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
