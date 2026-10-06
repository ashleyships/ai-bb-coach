import { speechApiPlugin } from './server/speechApiPlugin.ts'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { transcriptionApiPlugin } from './server/transcriptionApiPlugin.ts'
import { studentApiPlugin } from './server/studentApiPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server configuration only: never expose these values through Vite's define/envPrefix.
  const env = loadEnv(mode, process.cwd(), 'OPENAI_');
  return {
    plugins: [react(), studentApiPlugin({
      apiKey: process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? env.OPENAI_MODEL,
    }), transcriptionApiPlugin({
      apiKey: process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY,
      model: process.env.OPENAI_TRANSCRIPTION_MODEL ?? env.OPENAI_TRANSCRIPTION_MODEL,
    }), speechApiPlugin({
      apiKey: process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY,
      model: process.env.OPENAI_SPEECH_MODEL ?? env.OPENAI_SPEECH_MODEL,
    })],
  };
})
