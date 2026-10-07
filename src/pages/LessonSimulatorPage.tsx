import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { lessonLabels, difficultyLabels, sectionLabels } from "../data/practiceOptions";
import { useRealtimeLesson } from "../hooks/useRealtimeLesson";
import { useLessonTimer } from "../hooks/useLessonTimer";
import { isLessonSession, type LessonSession } from "../types/LessonSession";
import type { PracticeFlowContext } from "../types/RealtimeLesson";
import "./LessonSimulatorPage.css";

function LessonSimulatorPage() {
  const location = useLocation();
  const data: unknown = location.state;
  if (!isLessonSession(data)) return (
    <main className="simulator-page simulator-empty">
      <h1>No active lesson session.</h1>
      <Link to="/practice-setup" replace>Return to Practice Setup</Link>
    </main>
  );
  return <RealtimeLessonScreen key={location.key} session={data} />;
}

function RealtimeLessonScreen({ session }: { session: LessonSession }) {
  const { saveLesson } = useOutletContext<PracticeFlowContext>();
  const navigate = useNavigate();
  const { view, lesson, end, toggleMute, retry } = useRealtimeLesson(session, saveLesson);
  const duration = useLessonTimer(lesson.startedAt, lesson.endedAt);
  const statusText = view.status === "error" ? "Connection needs attention"
    : view.status === "connecting" ? "Connecting…"
    : view.status === "speaking" ? "Speaking…"
    : view.status === "thinking" ? "Thinking…"
    : view.status === "ended" ? "Lesson ended"
    : view.teacherMuted ? "Microphone muted" : "Listening…";
  function exitLesson() {
    end();
    navigate("/practice-setup", { replace: true });
  }

  return (
    <main className="simulator-page">
      <header className="simulator-header">
        <button className="simulator-exit-button" onClick={exitLesson}>
          <span aria-hidden="true">←</span> Exit
        </button>
        <div className="simulator-lesson-heading">
          <h1>{lessonLabels[session.lessonId]}</h1>
          <p>{session.student.alias} · {difficultyLabels[session.difficulty]}</p>
        </div>
        <button className="simulator-end-button" onClick={exitLesson}>End lesson</button>
      </header>

      <section className="simulator-student" aria-labelledby="simulator-student-name">
        <p className="simulator-phase">
          {session.practiceScope === "section" ? sectionLabels[session.selectedSection] : "A moment to connect"}
        </p>
        <div className={`simulator-student-orb simulator-student-orb-${view.status}`} aria-hidden="true" />
        <h2 id="simulator-student-name">{session.student.alias}</h2>
        <p className="simulator-status" role="status">
          <span className="simulator-status-indicator" aria-hidden="true"><i /><i /><i /></span>
          {statusText}
        </p>
        {view.error && (
          <div className="simulator-error" role="alert">
            <p>{view.error}</p>
            <button onClick={retry}>Reconnect</button>
          </div>
        )}
      </section>

      <footer className="simulator-controls">
        <p className="simulator-timer" aria-label={`Elapsed lesson time ${duration}`}>{duration}</p>
        <button className="simulator-microphone-button" onClick={toggleMute}
          aria-label={view.teacherMuted ? "Unmute microphone" : "Mute microphone"}
          title={view.teacherMuted ? "Unmute microphone" : "Mute microphone"}
          aria-pressed={view.teacherMuted}
          disabled={view.status === "connecting" || view.status === "error" || view.status === "ended"}
          aria-describedby="simulator-microphone-status">
          <svg className="simulator-microphone-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3" />
          </svg>
          <span className="simulator-microphone-slash" aria-hidden="true" />
        </button>
        <p id="simulator-microphone-status" className="simulator-accessible-description">
          {view.microphoneUnavailable ? "Microphone unavailable"
            : view.teacherMuted ? "Muted by you"
            : view.microphoneSuppressed ? "Microphone paused while the student responds"
            : view.status === "listening" ? "Microphone on" : "Microphone inactive"}
        </p>
      </footer>
    </main>
  );
}

export default LessonSimulatorPage;
