import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = '載入中...' }) => {
    return (
        <div className="loading-spinner-container">
            <div className="spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            <p className="loading-message">{message}</p>
            <style>{`
                .loading-spinner-container {
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                    color: var(--text-secondary);
                }
                
                .spinner {
                    position: relative;
                    width: 60px;
                    height: 60px;
                }
                
                .spinner-ring {
                    position: absolute;
                    inset: 0;
                    border: 2px solid transparent;
                    border-top-color: var(--color-yellow);
                    border-radius: 50%;
                    animation: spin 1.2s linear infinite;
                }
                
                .spinner-ring:nth-child(1) {
                    animation-duration: 1.2s;
                }
                
                .spinner-ring:nth-child(2) {
                    animation-duration: 1.5s;
                    animation-direction: reverse;
                    border-top-color: var(--color-green);
                    transform: scale(0.8);
                }
                
                .spinner-ring:nth-child(3) {
                    animation-duration: 1.8s;
                    border-top-color: var(--color-blue);
                    transform: scale(0.6);
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .loading-message {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    margin: 0;
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
