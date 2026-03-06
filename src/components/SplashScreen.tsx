import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../services/LanguageContext';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasPlayedRef = useRef(false);
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        // Prevent double execution in StrictMode
        if (hasPlayedRef.current) return;
        hasPlayedRef.current = true;

        // Ensure video starts playing
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay blocked - skip splash immediately
                onComplete();
            });
        }
    }, [onComplete]);

    // If video fails to load, skip splash
    const handleVideoError = () => {
        setVideoError(true);
        onComplete();
    };

    if (videoError) return null;

    return (
        <div className="splash-screen">
            <video
                ref={videoRef}
                className="splash-video"
                onEnded={onComplete}
                onError={handleVideoError}
                muted
                playsInline
                autoPlay
            >
                <source src="/intro.mp4" type="video/mp4" />
            </video>

            <button className="skip-splash-btn" onClick={onComplete} aria-label={t('跳過動畫')}>
                {t('跳過動畫')}
            </button>

            <style>{`
                .splash-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: var(--bg-color, #1a1a1a);
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                }

                .splash-video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .skip-splash-btn {
                    position: absolute;
                    bottom: 2.5rem;
                    right: 1.5rem;
                    background: var(--glass-bg, rgba(255, 255, 255, 0.1));
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
                    color: var(--text-secondary, rgba(255, 255, 255, 0.7));
                    padding: 0.75rem 1.4rem;
                    border-radius: 2rem;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 1001;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                }

                .skip-splash-btn:hover {
                    background: var(--glass-border, rgba(255, 255, 255, 0.2));
                    color: var(--text-primary, #fff);
                    transform: translateY(-2px);
                }

                .skip-splash-btn:focus-visible {
                    outline: 2px solid rgba(255, 255, 255, 0.6);
                    outline-offset: 2px;
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
