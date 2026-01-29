import "../styles/LandingPage.css";


type Props = {
  onOpenAuth: () => void;
};

export default function LandingPage({ onOpenAuth }: Props) {
  return (
    <div className="lp-root">
      <div className="lp-card">
        <div className="lp-badge">Hangman+</div>

        <h1 className="lp-title">
          Let’s pass anatomy <span className="lp-accent">with fun</span>.
        </h1>

        <p className="lp-subtitle">
          Your Hangman+ — learn bones and organs through images, guesses, and a little pressure.
        </p>

        <button className="lp-button" onClick={onOpenAuth}>
          Log in / Register
        </button>

        <p className="lp-footnote">
          Medicine-themed Hangman • Images • Stats • Admin
        </p>
      </div>
    </div>
  );
}
