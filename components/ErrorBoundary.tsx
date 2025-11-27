import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full border border-red-500/50">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
                        <pre className="bg-slate-950 p-4 rounded text-sm overflow-auto text-red-200 font-mono">
                            {this.state.error?.toString()}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
