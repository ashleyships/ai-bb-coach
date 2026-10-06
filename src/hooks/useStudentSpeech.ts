import { useCallback, useEffect, useRef, useState } from "react";
import { requestStudentSpeech } from "../api/studentSpeech";
import type { LessonMessage } from "../types/LessonSession";

type SpeechStatus = "idle" | "loading" | "playing" | "error";

export function useStudentSpeech(message: LessonMessage | undefined) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [error, setError] = useState("");
  const generation = useRef(0);
  const request = useRef<AbortController | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Existing transcript messages are available for replay but never autoplay on entry.
  const lastMessageId = useRef(message?.id);

  const release = useCallback(() => {
    generation.current++;
    request.current?.abort();
    request.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (audio.current) {
      audio.current.onended = null;
      audio.current.onerror = null;
      audio.current.pause();
      audio.current.removeAttribute("src");
      audio.current.load();
      audio.current = null;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }, []);

  useEffect(() => release, [release]);

  const speak = useCallback(async (studentMessage: LessonMessage) => {
    if (studentMessage.role !== "student" || !studentMessage.content.trim()) return;
    release();
    const operation = generation.current;
    const isCurrent = () => generation.current === operation;
    const controller = new AbortController();
    request.current = controller;
    setError("");
    setStatus("loading");
    timer.current = setTimeout(() => {
      if (!isCurrent()) return;
      release();
      setStatus("error");
      setError("Student audio timed out. Try Replay or continue the conversation.");
    }, 60_000);
    try {
      const blob = await requestStudentSpeech(studentMessage.content, controller.signal);
      if (!isCurrent()) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      request.current = null;
      const url = URL.createObjectURL(blob);
      objectUrl.current = url;
      const player = new Audio(url);
      audio.current = player;
      player.onended = () => {
        if (!isCurrent()) return;
        release();
        setStatus("idle");
      };
      player.onerror = () => {
        if (!isCurrent()) return;
        release();
        setStatus("error");
        setError("Student audio could not play. Try Replay or continue reading.");
      };
      await player.play();
      if (isCurrent()) setStatus("playing");
    } catch {
      if (!isCurrent()) return;
      release();
      setStatus("error");
      setError("Student audio is unavailable or playback was blocked. Try Replay. You can continue the conversation.");
    }
  }, [release]);

  useEffect(() => {
    if (message?.id === lastMessageId.current) return;
    lastMessageId.current = message?.id;
    release();
    const operation = generation.current;
    // Schedule playback after React commits; Stop/unmount can cancel it even here.
    void Promise.resolve().then(() => {
      if (generation.current === operation && message?.role === "student") void speak(message);
    });
  }, [message, speak, release]);

  function stop() {
    release();
    setStatus("idle");
    setError("");
  }

  function replay() {
    if (message?.role === "student") void speak(message);
  }

  return { status, error, stop, replay, canReplay: message?.role === "student" && !!message.content.trim() };
}
