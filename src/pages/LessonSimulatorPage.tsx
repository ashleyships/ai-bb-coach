import { Link, useLocation } from "react-router-dom";
import emblem from "../assets/emblem.jpg";
import { lessonLabels, difficultyLabels, sectionLabels } from "../data/practiceOptions";
import { isLessonSession } from "../types/LessonSession";
import "./LessonSimulatorPage.css";

function LessonSimulatorPage() {
  const location = useLocation();
  const sessionData: unknown = location.state;
  const session = isLessonSession(sessionData) ? sessionData : null;
  const latestStudentMessage = session?.messages.findLast((message) => message.role === "student");

  return (
    <div className="simulator-page">
      <aside className="simulator-sidebar" aria-label="Practice space sidebar">
        <div className="simulator-brand">
          <span className="simulator-logo-frame"><img src={emblem} alt="SCJ emblem" /></span>
          <span>BB<small>Speech Training</small></span>
        </div>
        <p className="simulator-navigation-label">YOUR SPACE</p>
        <span className="simulator-navigation-item">⌂ Home</span>
        <span className="simulator-navigation-current" aria-current="page">≋ Practice</span>
        <span className="simulator-navigation-item">◷ History</span>
        <p className="simulator-sidebar-note">A space to practise.<br />Room to grow.</p>
      </aside>
      <main className="simulator-main">
        {!session ? (
          <section className="simulator-empty">
            <h1>No active lesson session.</h1>
            <p>Choose your lesson and student in Practice Setup to begin.</p>
            <Link className="simulator-return-button" to="/practice-setup" replace>Return to Practice Setup</Link>
          </section>
        ) : (
          <>
            <header className="simulator-header">
              <div>
                <p className="simulator-caption">YOUR PRACTICE SESSION</p>
                <h1>{lessonLabels[session.lessonId]}</h1>
                <p className="simulator-context">
                  Student: {session.student.alias} · Difficulty: {difficultyLabels[session.difficulty]}
                </p>
                <p className="simulator-context">
                  Practice: {session.practiceScope === "full" ? "Full lesson" : `Specific section — ${sectionLabels[session.selectedSection]}`}
                </p>
              </div>
              <Link className="simulator-end-button" to="/practice-setup" replace>End Lesson</Link>
            </header>

            <section className="simulator-student" aria-labelledby="simulator-student-heading">
              <p className="simulator-caption" id="simulator-student-heading">SIMULATED STUDENT</p>
              <div className="simulator-student-sphere" aria-hidden="true" />
              <h2>{session.student.alias}</h2>
              <p className="simulator-student-message">{latestStudentMessage?.content ?? "Ready for your conversation."}</p>
              <p className="simulator-placeholder-note">Placeholder conversation · AI responses are not connected yet</p>
            </section>

            <section className="simulator-speaking-controls" aria-label="Teacher speaking control">
              <button className="simulator-microphone-button" type="button" disabled aria-label="Microphone unavailable — voice input coming next">
                <span className="simulator-microphone-icon" aria-hidden="true" />
              </button>
              <p className="simulator-speaking-label">Hold to speak</p>
              <p className="simulator-voice-status">Voice input coming next · Microphone inactive</p>
            </section>

            <section className="simulator-transcript" aria-labelledby="simulator-transcript-heading">
              <h2 id="simulator-transcript-heading">Conversation / transcript</h2>
              {session.messages.length === 0 && <p>No messages yet.</p>}
              <ol>
                {session.messages.map((message) => (
                  <li className={`simulator-message simulator-message-${message.role}`} key={message.id}>
                    <span className="simulator-message-role">{message.role === "teacher" ? "Teacher" : "Student"}</span>
                    <p>{message.content}</p>
                  </li>
                ))}
              </ol>
              <p className="simulator-transcript-note">Your spoken words will appear here when voice input is available.</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default LessonSimulatorPage;
