import { useEffect, useRef, useState } from "react";
import { requestTranscription } from "../api/transcription";

type RecordingStatus = "idle" | "requesting" | "recording" | "transcribing" | "error";
const formats = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_DURATION_MS = 120_000;

export function useSpeechToText(onTranscription: (text: string) => void) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const generation = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const request = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function releaseMicrophone() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
  }

  useEffect(() => () => {
    // Invalidate callbacks, including a permission prompt that resolves later.
    generation.current++;
    const recording = recorder.current;
    if (recording) {
      recording.ondataavailable = null;
      recording.onstop = null;
      recording.onerror = null;
      if (recording.state !== "inactive") recording.stop();
    }
    releaseMicrophone();
    request.current?.abort();
    busy.current = false;
  }, []);

  function stopRecording() {
    const recording = recorder.current;
    if (recording?.state === "recording") {
      setStatus("transcribing");
      recording.stop();
      // Stop the physical microphone immediately; onstop collects the final blob.
      releaseMicrophone();
    }
  }

  async function startRecording() {
    if (busy.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("error");
      setError("Microphone recording is unavailable. Use localhost or HTTPS in a supported browser, or type your message.");
      return;
    }
    const mimeType = formats.find((format) => MediaRecorder.isTypeSupported(format));
    if (!mimeType) {
      setStatus("error");
      setError("This browser cannot record a supported audio format. Please type your message or try another browser.");
      return;
    }
    busy.current = true;
    const operation = ++generation.current;
    const isCurrent = () => generation.current === operation;
    setError("");
    setStatus("requesting");
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isCurrent()) {
        microphone.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = microphone;
      const recording = new MediaRecorder(microphone, { mimeType });
      recorder.current = recording;
      const chunks: Blob[] = [];
      let bytes = 0;
      let recordingFailed = false;
      recording.ondataavailable = (event) => {
        if (!isCurrent() || recordingFailed || !event.data.size) return;
        bytes += event.data.size;
        if (bytes > MAX_BYTES) {
          recordingFailed = true;
          setStatus("error");
          setError("The recording is too large. Please record a shorter message.");
          if (recording.state !== "inactive") recording.stop();
          releaseMicrophone();
          busy.current = false;
          return;
        }
        chunks.push(event.data);
      };
      recording.onerror = () => {
        if (!isCurrent()) return;
        recordingFailed = true;
        if (recording.state !== "inactive") recording.stop();
        releaseMicrophone();
        busy.current = false;
        setStatus("error");
        setError("Recording failed. Please try again or type your message.");
      };
      recording.onstop = async () => {
        if (!isCurrent() || recordingFailed) return;
        releaseMicrophone();
        const audio = new Blob(chunks, { type: recording.mimeType || mimeType });
        if (!audio.size) {
          busy.current = false;
          setStatus("error");
          setError("No audio was recorded. Please try again.");
          return;
        }
        setStatus("transcribing");
        const controller = new AbortController();
        request.current = controller;
        const timeout = setTimeout(() => controller.abort(), 60_000);
        try {
          const text = await requestTranscription(audio, controller.signal);
          if (!isCurrent()) return;
          onTranscription(text);
          setStatus("idle");
        } catch (cause) {
          if (!isCurrent()) return;
          setStatus("error");
          setError(cause instanceof Error ? cause.message : "Transcription failed. Please try again.");
        } finally {
          clearTimeout(timeout);
          if (isCurrent()) {
            request.current = null;
            busy.current = false;
          }
        }
      };
      recording.start(1000);
      setStatus("recording");
      timer.current = setTimeout(stopRecording, MAX_DURATION_MS);
    } catch (cause) {
      if (!isCurrent()) return;
      releaseMicrophone();
      busy.current = false;
      setStatus("error");
      const name = typeof cause === "object" && cause !== null && "name" in cause ? cause.name : "";
      setError(name === "NotAllowedError" || name === "SecurityError"
        ? "Microphone permission was denied. Allow microphone access in your browser or type your message."
        : "The microphone could not be started. Check that it is connected and available, or type your message.");
    }
  }

  return {
    status, error, startRecording, stopRecording,
    isBusy: status === "requesting" || status === "recording" || status === "transcribing",
  };
}
