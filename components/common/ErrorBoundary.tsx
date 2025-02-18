// components/common/ErrorBoundary.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h3 className="text-lg font-medium text-red-900 dark:text-red-300">
                            Something went wrong
                        </h3>
                    </div>
                    <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="mt-4"
                        variant="destructive"
                    >
                        Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}