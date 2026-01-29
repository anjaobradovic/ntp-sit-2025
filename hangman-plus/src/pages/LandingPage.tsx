import "./css/LandingPage.css";


export default function LandingPage() {
  const handleContinue = () => {
    // placeholder (kasnije ide navigacija na /auth)
    console.log("Continue -> Auth page");
  };

  return (
    <div className="lp-root">
      <div className="lp-card">
        <div className="lp-badge">Hangman+</div>

        <h1 className="lp-title">
          Let’s pass anatomy <span className="lp-accent">with fun</span>.
        </h1>

        <p className="lp-subtitle">
          Your Hangman+ — learn bones and organs through images, guesses, and a
          little pressure.
        </p>

        <button className="lp-button" onClick={handleContinue}>
          Log in / Register
        </button>

        <p className="lp-footnote">
          Medicine-themed Hangman • Images • Stats • Admin
        </p>
      </div>
    </div>
  );
}
