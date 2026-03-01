import React, { Component, ReactNode } from 'react';
import { uiIcons } from './icons/SvgIcons';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary - 錯誤邊界組件
 * 
 * 捕捉 React 組件樹中的 JavaScript 錯誤，防止整個應用崩潰
 * 並顯示優雅的錯誤提示界面
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // 這裡可以發送到錯誤追蹤服務（如 Sentry）
        // if (process.env.NODE_ENV === 'production') {
        //     logErrorToService(error, errorInfo);
        // }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        // 清除可能導致錯誤的本地存儲
        // localStorage.removeItem('ruler_draft');
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary">
                    <div className="error-container">
                        <div className="error-icon">{uiIcons.shield}</div>
                        <h2>發生了一些問題</h2>
                        <p className="error-message">
                            {this.state.error?.message || '未知錯誤'}
                        </p>
                        <p className="error-hint">
                            別擔心，你的數據是安全的。請嘗試重新載入頁面。
                        </p>
                        <div className="error-actions">
                            <button className="error-btn primary" onClick={this.handleReload}>
                                重新載入
                            </button>
                            <button className="error-btn secondary" onClick={this.handleReset}>
                                返回主頁
                            </button>
                        </div>
                    </div>
                    <style>{`
                        .error-boundary {
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 2rem;
                            background: var(--bg-color);
                        }
                        .error-container {
                            text-align: center;
                            max-width: 400px;
                            padding: 3rem 2rem;
                            background: var(--bg-secondary);
                            border-radius: var(--radius-luxe);
                            border: 1px solid var(--glass-border);
                            box-shadow: var(--shadow-luxe);
                        }
                        .error-icon {
                            width: 64px;
                            height: 64px;
                            margin: 0 auto 1.5rem;
                            color: var(--color-yellow);
                            opacity: 0.8;
                        }
                        .error-icon svg {
                            width: 100%;
                            height: 100%;
                        }
                        .error-container h2 {
                            font-size: 1.5rem;
                            font-weight: 800;
                            margin-bottom: 1rem;
                            color: var(--text-primary);
                        }
                        .error-message {
                            font-family: monospace;
                            font-size: 0.85rem;
                            color: var(--color-red);
                            background: rgba(197, 139, 138, 0.1);
                            padding: 0.75rem;
                            border-radius: var(--radius-sm);
                            margin-bottom: 1rem;
                            word-break: break-all;
                        }
                        .error-hint {
                            color: var(--text-secondary);
                            font-size: 0.9rem;
                            line-height: 1.6;
                            margin-bottom: 2rem;
                        }
                        .error-actions {
                            display: flex;
                            gap: 1rem;
                            justify-content: center;
                        }
                        .error-btn {
                            padding: 0.75rem 1.5rem;
                            border-radius: var(--radius-md);
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            border: none;
                        }
                        .error-btn.primary {
                            background: var(--text-primary);
                            color: var(--bg-color);
                        }
                        .error-btn.primary:hover {
                            transform: translateY(-2px);
                            box-shadow: var(--shadow-luxe);
                        }
                        .error-btn.secondary {
                            background: transparent;
                            color: var(--text-secondary);
                            border: 1px solid var(--glass-border);
                        }
                        .error-btn.secondary:hover {
                            border-color: var(--text-secondary);
                            color: var(--text-primary);
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
