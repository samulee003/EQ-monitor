import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../services/LanguageContext';
import './SplashScreen.css';

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

        // Skip splash if already played this session
        if (sessionStorage.getItem('splashPlayed') === '1') {
            onComplete();
            return;
        }
        sessionStorage.setItem('splashPlayed', '1');

        // Ensure video starts playing
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                onComplete();
            });
        }

        // Hard timeout fallback: dismiss after 5s even if onEnded never fires
        const timeoutId = setTimeout(() => onComplete(), 5000);
        return () => clearTimeout(timeoutId);
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

            <button
                className="skip-splash-btn"
                onClick={onComplete}
                aria-label={t('跳過動畫')}
                data-testid="splash-skip"
            >
                {t('跳過動畫')}
            </button>

        </div>
    );
};

export default SplashScreen;
