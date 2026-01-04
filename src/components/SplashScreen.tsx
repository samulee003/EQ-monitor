import React, { useRef, useEffect } from 'react';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Ensure video starts playing
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Autoplay was prevented:", error);
            });
        }
    }, []);

    return (
        <div className="splash-screen">
            <video
                ref={videoRef}
                className="splash-video"
                onEnded={onComplete}
                muted
                playsInline
                autoPlay
            >
                <source src="/intro.mp4" type="video/mp4" />
                您的瀏覽器不支援影片標籤。
            </video>

            <button className="skip-splash-btn" onClick={onComplete}>
                跳過動畫
            </button>

            <style>{`
                .splash-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #1a1a1a;
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                }

                .splash-video {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .skip-splash-btn {
                    position: absolute;
                    bottom: 2rem;
                    right: 2rem;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.6);
                    padding: 0.6rem 1.2rem;
                    border-radius: 2rem;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 1001;
                }

                .skip-splash-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
