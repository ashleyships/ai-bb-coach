import type { TranscriptEntry } from "../types/RealtimeLesson";

export type RealtimeEvent = {
  type: string;
  item_id?: string;
  previous_item_id?: string | null;
  transcript?: string;
  delta?: string;
  item?: { id: string; role?: string; type?: string };
  response?: { status?: string };
};

export function updateTranscript(entries: TranscriptEntry[], event: RealtimeEvent): TranscriptEntry[] {
  const id = event.item_id ?? event.item?.id;
  if (!id) return entries;
  const teacher = event.type.startsWith("conversation.item.input_audio_transcription.");
  const student = event.type.startsWith("response.output_audio_transcript.");
  const created = event.type === "conversation.item.created" || event.type === "conversation.item.added";
  const committed = event.type === "input_audio_buffer.committed";
  if (!teacher && !student && !created && !committed) return entries;
  const role = teacher || committed || event.item?.role === "user" ? "teacher" : "student";
  if (created && !["user", "assistant"].includes(event.item?.role ?? "")) return entries;
  const existing = entries.find(entry => entry.id === id);
  const entry: TranscriptEntry = { ...(existing ?? { id, role, content: "", timestamp: Date.now(), status: "pending" }) };
  if (event.previous_item_id !== undefined) entry.previousId = event.previous_item_id;
  if (event.type.endsWith(".completed") || event.type.endsWith(".done")) {
    entry.content = event.transcript ?? entry.content;
    entry.status = "complete";
  } else if (event.type.endsWith(".failed")) entry.status = "failed";
  else if (event.type.endsWith(".delta") && entry.status === "pending") entry.content += event.delta ?? "";
  const result = existing ? entries.map(value => value.id === id ? entry : value) : [...entries, entry];
  // Topologically place known predecessors first, even if transcription finishes out of order.
  const ordered: TranscriptEntry[] = [];
  const visiting = new Set<string>();
  const placed = new Set<string>();
  function place(value: TranscriptEntry) {
    if (placed.has(value.id) || visiting.has(value.id)) return;
    visiting.add(value.id);
    const previous = result.find(candidate => candidate.id === value.previousId);
    if (previous) place(previous);
    visiting.delete(value.id);
    placed.add(value.id);
    ordered.push(value);
  }
  result.forEach(place);
  return ordered;
}

export function finishTranscript(entries: TranscriptEntry[]): TranscriptEntry[] {
  return entries.map(entry => entry.status === "pending" ? { ...entry, status: "incomplete" } : entry);
}
