"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Silently capture — no console noise in prod
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="card-v2 max-w-md mx-auto mt-12 text-center">
          <AlertTriangle className="w-8 h-8 text-[var(--warning)] mx-auto mb-3" />
          <h2 className="text-[17px] font-semibold mb-1">Something went sideways</h2>
          <p className="text-[13px] text-text-secondary mb-4">
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <button onClick={this.reset} className="btn-primary text-[13px]">
            <RotateCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
