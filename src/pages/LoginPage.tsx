import emblem from '../assets/emblem.jpg';
import './LoginPage.css';

function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-container">
        <span className="login-logo-frame">
          <img className="login-logo" src={emblem} alt="SCJ emblem" />
        </span>
        <p className="login-encouragement">
          Lets make the final push Powerfully & Decisively
        </p>
        <h1 className="login-heading">AI BB Coach</h1>
        <p className="login-quote">
          The most blessed person in Shincheonji is the one whose gospel room
          (BB) never ceases
        </p>

        <form className="login-form">
          <label className="login-label" htmlFor="email">Email</label>
          <input
            className="login-input"
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label className="login-label" htmlFor="password">Password</label>
          <input
            className="login-input"
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <button className="login-submit-button" type="submit">
            Sign in
            <span className="login-submit-arrow" aria-hidden="true">
              →
            </span>
          </button>
        </form>
      </div>
    </main>
  );
}

export default LoginPage;
