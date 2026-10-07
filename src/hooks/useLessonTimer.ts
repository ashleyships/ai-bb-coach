import { useEffect, useState } from "react";

export function useLessonTimer(startedAt: number | null, endedAt: number | null) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!startedAt || endedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt, endedAt]);
  const seconds = startedAt ? Math.max(0, Math.floor(((endedAt ?? now) - startedAt) / 1000)) : 0;
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
