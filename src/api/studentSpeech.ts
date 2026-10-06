const errors: Record<string, string> = {
  NOT_CONFIGURED: "Student audio is not configured. Check the server API key.",
  INVALID_TEXT: "This response cannot be spoken. Speech supports up to 4,096 characters.",
  SPEECH_FAILED: "Student audio could not be generated. You can continue reading or try Replay.",
};

export async function requestStudentSpeech(text: string, signal: AbortSignal): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch("/api/speech", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }), signal,
    });
  } catch {
    throw new Error("Unable to load student audio. Check your connection and try Replay.");
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const code = typeof data === "object" && data !== null && "code" in data && typeof data.code === "string"
      ? data.code : "SPEECH_FAILED";
    throw new Error(errors[code] ?? errors.SPEECH_FAILED);
  }
  if (response.headers.get("content-type")?.split(";")[0] !== "audio/mpeg") {
    throw new Error(errors.SPEECH_FAILED);
  }
  const audio = await response.blob();
  if (!audio.size) throw new Error(errors.SPEECH_FAILED);
  return audio;
}
