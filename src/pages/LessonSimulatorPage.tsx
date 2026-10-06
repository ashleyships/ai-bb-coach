import { Link, useLocation } from "react-router-dom";
import emblem from "../assets/emblem.jpg";
import {
  lessonLabels,
  difficultyLabels,
  sectionLabels,
} from "../data/practiceOptions";
import { useStudentSpeech } from "../hooks/useStudentSpeech";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { useLessonConversation } from "../hooks/useLessonConversation";
import { isLessonSession, type LessonSession } from "../types/LessonSession";
import "./LessonSimulatorPage.css";

function LessonSimulatorPage() {
  const location = useLocation();
  const sessionData: unknown = location.state;
  const initialSession = isLessonSession(sessionData) ? sessionData : null;
  return (
    <LessonSimulatorContent
      key={location.key}
      initialSession={initialSession}
    />
  );
}

function LessonSimulatorContent({
  initialSession,
}: {
  initialSession: LessonSession | null;
}) {
  const {
    session,
    draft,
    setDraft,
    isSending,
    error,
    canRetry,
    sendMessage,
    retryResponse,
  } = useLessonConversation(initialSession);
  const speech = useSpeechToText((text) => {
    setDraft((previous) => (previous.trim() ? `${previous}\n${text}` : text));
  });
  const latestStudentMessage = session?.messages.findLast(
    (message) => message.role === "student",
  );

  const studentSpeech = useStudentSpeech(latestStudentMessage);

  return (
    <div className="simulator-page">
      <aside className="simulator-sidebar" aria-label="Practice space sidebar">
        <div className="simulator-brand">
          <span className="simulator-logo-frame">
            <img src={emblem} alt="SCJ emblem" />
          </span>
          <span>
            BB<small>Speech Training</small>
          </span>
        </div>
        <p className="simulator-navigation-label">YOUR SPACE</p>
        <span className="simulator-navigation-item">⌂ Home</span>
        <span className="simulator-navigation-current" aria-current="page">
          ≋ Practice
        </span>
        <span className="simulator-navigation-item">◷ History</span>
        <p className="simulator-sidebar-note">
          A space to practise.
          <br />
          Room to grow.
        </p>
      </aside>
      <main className="simulator-main">
        {!session ? (
          <section className="simulator-empty">
            <h1>No active lesson session.</h1>
            <p>Choose your lesson and student in Practice Setup to begin.</p>
            <Link
              className="simulator-return-button"
              to="/practice-setup"
              replace
            >
              Return to Practice Setup
            </Link>
          </section>
        ) : (
          <>
            <header className="simulator-header">
              <div>
                <p className="simulator-caption">YOUR PRACTICE SESSION</p>
                <h1>{lessonLabels[session.lessonId]}</h1>
                <p className="simulator-context">
                  Student: {session.student.alias} · Difficulty:{" "}
                  {difficultyLabels[session.difficulty]}
                </p>
                <p className="simulator-context">
                  Practice:{" "}
                  {session.practiceScope === "full"
                    ? "Full lesson"
                    : `Specific section — ${sectionLabels[session.selectedSection]}`}
                </p>
              </div>
              <Link
                className="simulator-end-button"
                onClick={studentSpeech.stop}
                to="/practice-setup"
                replace
              >
                End Lesson
              </Link>
            </header>

            <section
              className="simulator-student"
              aria-labelledby="simulator-student-heading"
            >
              <p className="simulator-caption" id="simulator-student-heading">
                SIMULATED STUDENT
              </p>
              <div className="simulator-student-sphere" aria-hidden="true" />
              <h2>{session.student.alias}</h2>
              <p className="simulator-student-message">
                {latestStudentMessage?.content ??
                  "Ready for your conversation."}
              </p>
              <p className="simulator-placeholder-note">
                Practise a conversation with your simulated student. Voice is AI-generated.
              </p>
              <div className="simulator-speech-controls">
                <button type="button" onClick={studentSpeech.replay}
                  disabled={!studentSpeech.canReplay || studentSpeech.status === "loading"}>
                  Replay student response
                </button>
                <button type="button" onClick={studentSpeech.stop}
                  disabled={studentSpeech.status !== "loading" && studentSpeech.status !== "playing"}>
                  Stop audio
                </button>
                <span role="status">
                  {studentSpeech.status === "loading" ? "Loading student audio…"
                    : studentSpeech.status === "playing" ? "Student speaking…" : ""}
                </span>
              </div>
              {studentSpeech.error && (
                <p className="simulator-request-error" role="alert">{studentSpeech.error}</p>
              )}
            </section>

            <form
              className="simulator-message-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!speech.isBusy) sendMessage();
              }}
            >
              <div className="simulator-recording-controls">
                <button
                  type="button"
                  className="simulator-recording-button"
                  onClick={
                    speech.status === "recording"
                      ? speech.stopRecording
                      : () => {
                          void speech.startRecording();
                        }
                  }
                  disabled={
                    isSending ||
                    canRetry ||
                    speech.status === "requesting" ||
                    speech.status === "transcribing"
                  }
                  aria-pressed={speech.status === "recording"}
                >
                  <span aria-hidden="true">
                    {speech.status === "recording" ? "■" : "🎙"}
                  </span>{" "}
                  {speech.status === "recording"
                    ? "Stop recording"
                    : "Record speech"}
                </button>
                <p role="status">
                  {speech.status === "requesting"
                    ? "Waiting for microphone permission…"
                    : speech.status === "recording"
                      ? "Recording… Click Stop when finished."
                      : speech.status === "transcribing"
                        ? "Transcribing your recording…"
                        : "Record, review and edit your text, then press Send. Maximum 2 minutes."}
                </p>
              </div>
              {speech.error && (
                <p className="simulator-request-error" role="alert">
                  {speech.error}
                </p>
              )}
              <label htmlFor="teacher-message">Your message</label>
              <textarea
                id="teacher-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    if (!speech.isBusy) sendMessage();
                  }
                }}
                disabled={isSending || canRetry || speech.isBusy}
                aria-describedby="simulator-message-help"
                placeholder="Type what you would say to the student…"
                rows={3}
              />
              <div className="simulator-message-actions">
                <p id="simulator-message-help">
                  Enter to send · Shift+Enter for a new line
                </p>
                <button
                  type="submit"
                  disabled={
                    !draft.trim() || isSending || canRetry || speech.isBusy
                  }
                >
                  {isSending ? "Waiting for student…" : "Send"}
                </button>
              </div>
              <p role="status" className="simulator-request-status">
                {isSending ? "The student is responding…" : ""}
              </p>
              {error && (
                <div className="simulator-request-error" role="alert">
                  <p>{error}</p>
                  {canRetry && (
                    <button
                      type="button"
                      onClick={retryResponse}
                      disabled={isSending}
                    >
                      Retry student response
                    </button>
                  )}
                </div>
              )}
            </form>

            <section
              className="simulator-transcript"
              aria-labelledby="simulator-transcript-heading"
            >
              <h2 id="simulator-transcript-heading">
                Conversation / transcript
              </h2>
              {session.messages.length === 0 && <p>No messages yet.</p>}
              <ol>
                {session.messages.map((message) => (
                  <li
                    className={`simulator-message simulator-message-${message.role}`}
                    key={message.id}
                  >
                    <span className="simulator-message-role">
                      {message.role === "teacher" ? "Teacher" : "Student"}
                    </span>
                    <p>{message.content}</p>
                  </li>
                ))}
              </ol>
              <p className="simulator-transcript-note">
                Your messages and the student’s responses appear here.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default LessonSimulatorPage;
