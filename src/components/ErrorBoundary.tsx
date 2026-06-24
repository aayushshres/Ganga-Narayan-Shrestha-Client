import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

// Catches render-time errors anywhere below it so an unexpected component crash
// shows a recoverable message instead of a blank white screen.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface in the console; swap for a hosted reporter (e.g. Sentry) later.
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.4rem" }}>केही गडबड भयो / Something went wrong</h1>
          <p style={{ color: "var(--text-muted)" }}>
            कृपया पृष्ठ पुनः लोड गर्नुहोस् / Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "var(--crimson, #8b1a1a)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "0.6rem 1.4rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
