import { logger } from '../utils/logger';
import React, { Component, type ReactNode } from 'react';
import { uiIcons } from './icons/SvgIcons';
import styles from './ErrorBoundary.module.css';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
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
        logger.error('ErrorBoundary caught an error', { error: String(error), componentStack: errorInfo.componentStack });
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
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
                <div className={styles.errorBoundary}>
                    <div className={styles.errorContainer}>
                        <div className={styles.errorIcon}>{uiIcons.shield}</div>
                        <h2>發生了一些問題</h2>
                        <p className={styles.errorMessage}>
                            {this.state.error?.message || '未知錯誤'}
                        </p>
                        <p className={styles.errorHint}>
                            別擔心，你的數據是安全的。請嘗試重新載入頁面。
                        </p>
                        <div className={styles.errorActions}>
                            <button className={`${styles.errorBtn} ${styles.primary}`} onClick={this.handleReload}>
                                重新載入
                            </button>
                            <button className={`${styles.errorBtn} ${styles.secondary}`} onClick={this.handleReset}>
                                返回主頁
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
