import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-grid" />

      <div className="loading-content">
        <div className="ai-orb">
          <div className="orb-core">✦</div>
          <span className="orb-ring ring-one" />
          <span className="orb-ring ring-two" />
        </div>

        <h1 className="loading-logo">
          AI<span>Forge</span>
        </h1>

        <p>Initializing your AI workspace...</p>

        <div className="loading-bar">
          <span />
        </div>

        <div className="loading-dots">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}