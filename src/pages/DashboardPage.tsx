import emblem from "../assets/emblem.jpg";
import "./DashboardPage.css";

// Example content from the approved design; no live training data is loaded.
const recentTraining = [
  { student: "David", difficulty: "Intermediate", score: "7.4", date: "Today" },
  { student: "Sarah", difficulty: "Beginner", score: "6.8", date: "Yesterday" },
  { student: "David", difficulty: "Advanced", score: "7.1", date: "3 days ago" },
];

function DashboardPage() {
  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar" aria-label="Practice space sidebar">
        <div className="dashboard-brand">
          <span className="dashboard-logo-frame">
            <img className="dashboard-logo" src={emblem} alt="SCJ emblem" />
          </span>
          <span>BB<span className="dashboard-brand-description">Speech Training</span></span>
        </div>

        <nav className="dashboard-navigation" aria-label="Main navigation">
          <p className="dashboard-navigation-heading">YOUR SPACE</p>
          <span className="dashboard-navigation-current" aria-current="page">
            <span className="dashboard-navigation-icon" aria-hidden="true">⌂</span>
            <span>Home</span>
          </span>
          <button className="dashboard-navigation-button" type="button" disabled>
            <span className="dashboard-navigation-icon" aria-hidden="true">≋</span>
            <span>Practice</span>
          </button>
          <button className="dashboard-navigation-button" type="button" disabled>
            <span className="dashboard-navigation-icon" aria-hidden="true">◷</span>
            <span>History</span>
          </button>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <p className="dashboard-sidebar-message">A space to practise.<br />Room to grow.</p>
          <div className="dashboard-profile">
            <span className="dashboard-profile-avatar" aria-hidden="true">A</span>
            <div>Ashley<span className="dashboard-profile-role">Teacher</span></div>
            <span className="dashboard-profile-dot" aria-hidden="true" />
          </div>
        </div>
        <button className="dashboard-logout-button" type="button" disabled>
          <span className="dashboard-navigation-icon" aria-hidden="true">⇥</span>
          <span>Log out</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <span>Your practice space</span>
          <span className="dashboard-training-label">BB SPEECH TRAINING</span>
        </header>

        <section className="dashboard-welcome" aria-labelledby="dashboard-heading">
          <p className="dashboard-section-caption">WELCOME BACK</p>
          <h1 className="dashboard-heading" id="dashboard-heading">
            Good evening, Ashley<span className="dashboard-heading-period">.</span>
          </h1>
          <p className="dashboard-welcome-question">What would you like to practise?</p>
        </section>

        <section className="dashboard-start-practice-card" aria-labelledby="dashboard-practice-heading">
          <div className="dashboard-practice-description">
            <p className="dashboard-section-caption">MAKE SPACE FOR PRACTICE</p>
            <h2 id="dashboard-practice-heading">Grow in confidence.<br />One conversation at a time.</h2>
            <p className="dashboard-practice-message">
              A calm space to practise your lesson,<br className="dashboard-desktop-break" /> understand your student, and find your voice.
            </p>
            <button className="dashboard-start-practice-button" type="button" disabled>
              Start new simulation <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="dashboard-practice-illustration">
            <div className="dashboard-blue-sphere" aria-hidden="true" />
            <span>Practise. Reflect. Improve.</span>
          </div>
        </section>

        <section className="dashboard-recent-training" aria-labelledby="dashboard-recent-heading">
          <div className="dashboard-section-header">
            <h2 id="dashboard-recent-heading">Recent training</h2>
            <button className="dashboard-history-button" type="button" disabled>
              View history <span aria-hidden="true">↗</span>
            </button>
          </div>
          <ul className="dashboard-training-list">
            {recentTraining.map((training) => (
              <li className="dashboard-training-row" key={training.date}>
                <div className="dashboard-training-lesson">
                  <span className="dashboard-lesson-icon" aria-hidden="true">↗</span>
                  <div>
                    Introduction to Bible
                    <span className="dashboard-training-details">
                      {training.student} · {training.difficulty}
                    </span>
                  </div>
                </div>
                <span className="dashboard-training-score">{training.score}<small>/10</small></span>
                <span className="dashboard-training-date">{training.date}</span>
                <span className="dashboard-training-arrow" aria-hidden="true">›</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dashboard-development" aria-labelledby="dashboard-development-heading">
          <div>
            <p className="dashboard-section-caption">A LITTLE BETTER, EVERY TIME</p>
            <h2 id="dashboard-development-heading">Your development</h2>
            <p className="dashboard-development-message">Small steps. Meaningful progress.</p>
          </div>
          <dl className="dashboard-development-skills">
            <div><dt>Consultation</dt><dd className="dashboard-skill-improving">↗ Improving</dd></div>
            <div><dt>Speech delivery</dt><dd className="dashboard-skill-improving">↗ Improving</dd></div>
            <div><dt>Application</dt><dd className="dashboard-skill-steady">— Steady</dd></div>
            <div><dt>Building trust</dt><dd className="dashboard-skill-improving">↗ Improving</dd></div>
          </dl>
        </section>

        <footer className="dashboard-footer">Progress begins with showing up.</footer>
      </main>
    </div>
  );
}

export default DashboardPage;
