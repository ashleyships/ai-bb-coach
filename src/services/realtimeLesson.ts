import { requestRealtimeSession } from "../api/realtimeSession";
import type { RealtimeLesson, RealtimeView, RealtimeStatus } from "../types/RealtimeLesson";
import { finishTranscript, updateTranscript, type RealtimeEvent } from "../utils/realtimeTranscript";

// One controller owns one connection attempt. A retry creates a fresh controller.
export function createRealtimeLesson(
  initial: RealtimeLesson,
  onView: (view: RealtimeView) => void,
  onLesson: (lesson: RealtimeLesson) => void,
  initiallyMuted = false,
) {
  let lesson = initial;
  let view: RealtimeView = {
    status: "connecting", teacherMuted: initiallyMuted, microphoneSuppressed: false,
    microphoneUnavailable: false, error: "",
  };
  let closed = false;
  let started = false;
  let stream: MediaStream | null = null;
  let peer: RTCPeerConnection | null = null;
  let channel: RTCDataChannel | null = null;
  let player: HTMLAudioElement | null = null;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const request = new AbortController();
  const seenEvents = new Set<string>();
  const restoredItems = new Set<string>();

  function publish() {
    stream?.getAudioTracks().forEach(track => {
      track.enabled = !closed && view.status === "listening" && !view.teacherMuted &&
        !view.microphoneSuppressed && !view.microphoneUnavailable;
    });
    onView({ ...view });
  }
  function save() {
    lesson = { ...lesson, session: { ...lesson.session, messages: lesson.transcript.map(({ id, role, content, timestamp }) => ({ id, role, content, timestamp })) } };
    onLesson(lesson);
  }
  function send(event: object) {
    if (!closed && channel?.readyState === "open") channel.send(JSON.stringify(event));
  }
  function release() {
    closed = true;
    clearTimeout(deadline);
    request.abort();
    if (channel) {
      channel.onmessage = channel.onopen = channel.onclose = channel.onerror = null;
      channel.close();
    }
    if (peer) {
      peer.ontrack = peer.onconnectionstatechange = null;
      peer.close();
    }
    stream?.getTracks().forEach(track => { track.onended = track.onmute = null; track.stop(); });
    if (player) {
      player.onerror = null;
      player.pause();
      player.srcObject = null;
    }
  }
  function markPlayback(playback: "playing" | "finished" | "interrupted") {
    const lastStudent = lesson.transcript.findLast(entry => entry.role === "student");
    if (!lastStudent) return;
    lesson = { ...lesson, transcript: lesson.transcript.map(entry => entry.id === lastStudent.id ? { ...entry, playback } : entry) };
  }
  function fail(message: string, microphoneUnavailable = false) {
    if (closed) return;
    if (view.status === "speaking") markPlayback("interrupted");
    release();
    view = { ...view, status: "error", microphoneSuppressed: false, microphoneUnavailable, error: message };
    lesson = { ...lesson, transcript: finishTranscript(lesson.transcript) };
    save();
    publish();
  }
  function armDeadline(ms: number, message: string) {
    clearTimeout(deadline);
    deadline = setTimeout(() => fail(message), ms);
  }
  function transition(status: RealtimeStatus) {
    view = { ...view, status, microphoneSuppressed: status === "thinking" || status === "speaking" };
    publish();
    clearTimeout(deadline);
    if (status === "thinking" || status === "speaking") armDeadline(120_000, "The student stopped responding. Please reconnect.");
  }
  function handleEvent(data: string) {
    if (closed) return;
    let event: RealtimeEvent & { event_id?: string };
    try { event = JSON.parse(data); } catch { fail("The connection returned unreadable events. Please reconnect."); return; }
    if (!event || typeof event.type !== "string") return;
    if (event.event_id && seenEvents.has(event.event_id)) return;
    if (event.event_id) seenEvents.add(event.event_id);
    if (!restoredItems.has(event.item_id ?? event.item?.id ?? "")) {
      const transcript = updateTranscript(lesson.transcript, event);
      if (transcript !== lesson.transcript) { lesson = { ...lesson, transcript }; save(); }
    }
    switch (event.type) {
      case "input_audio_buffer.speech_stopped":
      case "response.created":
        transition("thinking");
        break;
      case "output_audio_buffer.started":
        markPlayback("playing");
        save();
        transition("speaking");
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        markPlayback(event.type === "output_audio_buffer.stopped" ? "finished" : "interrupted");
        save();
        send({ type: "input_audio_buffer.clear" });
        transition("listening");
        break;
      case "response.done":
        if (event.response?.status !== "completed") fail("The student response was interrupted. Please reconnect.");
        // Generation can finish before the speakers finish. Wait for output buffer stopped.
        break;
      case "error":
        fail("The realtime session reported an error. Please reconnect.");
        break;
    }
  }
  async function start() {
    if (started || closed) return;
    started = true;
    publish();
    armDeadline(45_000, "Connection or microphone permission timed out. Please retry.");
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
        fail("Realtime audio needs a supported browser on HTTPS or localhost.", true); return;
      }
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (closed) { microphone.getTracks().forEach(track => track.stop()); return; }
      stream = microphone;
      const track = stream.getAudioTracks()[0];
      if (!track) { fail("No microphone is available.", true); return; }
      track.enabled = false;
      track.onended = () => fail("The microphone disconnected. Check it and reconnect.", true);
      track.onmute = () => fail("The microphone became unavailable. Check it and reconnect.", true);
      peer = new RTCPeerConnection();
      player = new Audio();
      player.autoplay = true;
      player.onerror = () => fail("Student audio could not play. Please reconnect and allow audio playback.");
      peer.ontrack = event => {
        if (closed || !player) return;
        player.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        void player.play().catch(() => fail("Audio playback was blocked. Click Reconnect to try again."));
      };
      peer.onconnectionstatechange = () => {
        if (!closed && peer && ["failed", "disconnected", "closed"].includes(peer.connectionState)) {
          fail("The realtime connection was lost. Please reconnect.");
        }
      };
      peer.addTrack(track, stream);
      channel = peer.createDataChannel("oai-events");
      channel.onmessage = event => handleEvent(event.data);
      channel.onerror = () => fail("The realtime event connection failed. Please reconnect.");
      channel.onclose = () => fail("The realtime session closed. Please reconnect.");
      channel.onopen = () => {
        if (closed) return;
        // Restore completed spoken turns on retry without replaying them aloud.
        for (const entry of lesson.transcript.filter(entry => entry.status === "complete" && entry.content.trim())) {
          const id = `history_${entry.id}`;
          restoredItems.add(id);
          send({ type: "conversation.item.create", item: { id, type: "message", role: entry.role === "teacher" ? "user" : "assistant",
            content: [{ type: entry.role === "teacher" ? "input_text" : "text", text: entry.content }] } });
        }
        lesson = { ...lesson, startedAt: lesson.startedAt ?? Date.now(), endedAt: null };
        save();
        transition("listening");
      };
      const offer = await peer.createOffer();
      if (closed) return;
      await peer.setLocalDescription(offer);
      if (closed) return;
      const sdp = await requestRealtimeSession(offer.sdp ?? "", lesson.session, request.signal);
      if (closed) return;
      await peer.setRemoteDescription({ type: "answer", sdp });
    } catch (cause) {
      if (closed) return;
      const name = cause instanceof DOMException ? cause.name : "";
      const micError = ["NotAllowedError", "NotFoundError", "NotReadableError", "SecurityError"].includes(name);
      fail(micError ? "Microphone access failed. Allow access and check your microphone, then retry."
        : "Unable to start the realtime lesson. Check your connection and server configuration, then retry.", micError);
    }
  }
  function toggleMute() {
    if (closed) return;
    view = { ...view, teacherMuted: !view.teacherMuted };
    publish();
    if (view.teacherMuted) send({ type: "input_audio_buffer.clear" });
  }
  function end() {
    if (view.status === "ended") return;
    if (view.status === "speaking") markPlayback("interrupted");
    send({ type: "response.cancel" });
    send({ type: "output_audio_buffer.clear" });
    release();
    lesson = { ...lesson, endedAt: Date.now(), transcript: finishTranscript(lesson.transcript) };
    save();
    view = { ...view, status: "ended", microphoneSuppressed: false };
    publish();
  }
  return { start, toggleMute, end };
}
