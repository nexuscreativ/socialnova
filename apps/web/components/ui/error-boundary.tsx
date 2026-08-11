"use client"
import * as React from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center max-w-md">
            <div
              className="h-12 w-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 15%, transparent)" }}
            >
              <span className="text-xl">!</span>
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
            >
              Something went wrong
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
