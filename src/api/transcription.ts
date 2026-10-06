const errors: Record<string, string> = {
  NOT_CONFIGURED: "Transcription is not configured. Check the server API key and restart the app.",
  UNSUPPORTED_AUDIO: "This recording format is not supported. Please try another browser or type your message.",
  EMPTY_AUDIO: "No audio was recorded. Please try again.",
  AUDIO_TOO_LARGE: "The recording is too large. Please record a shorter message.",
  NO_SPEECH: "No speech was recognised. Please record again or type your message.",
  TRANSCRIPTION_FAILED: "The recording could not be transcribed. Please try again or type your message.",
};

export async function requestTranscription(audio: Blob, signal: AbortSignal): Promise<string> {
  let response: Response;
  let data: unknown;
  try {
    response = await fetch("/api/transcribe", {
      method: "POST", headers: { "Content-Type": audio.type }, body: audio, signal,
    });
    data = await response.json();
  } catch {
    throw new Error(signal.aborted
      ? "Transcription timed out. Please try again."
      : "Unable to reach transcription. Check your connection and try again.");
  }
  if (!response.ok) {
    const code = typeof data === "object" && data !== null && "code" in data && typeof data.code === "string" ? data.code : "TRANSCRIPTION_FAILED";
    throw new Error(errors[code] ?? errors.TRANSCRIPTION_FAILED);
  }
  if (typeof data !== "object" || data === null || !("text" in data) || typeof data.text !== "string" || !data.text.trim()) {
    throw new Error(errors.NO_SPEECH);
  }
  return data.text.trim();
}
