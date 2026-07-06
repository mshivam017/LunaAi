import React, { Component, ErrorInfo, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#030308] text-white p-6 font-sans">
          <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 max-w-md text-center space-y-4 shadow-2xl">
            <h2 className="text-sm font-bold text-red-400">Something went wrong</h2>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Luna encountered a temporary rendering issue. Please reload the interface or restart the application.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-purple-blue text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all"
            >
              Reload Interface
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
