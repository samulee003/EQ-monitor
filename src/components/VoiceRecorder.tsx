import React, { useState, useEffect } from 'react';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);
    const [simulationState, setSimulationState] = useState<'idle' | 'recording' | 'processing'>('idle');

    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setTimer((t) => t + 1);
            }, 1000);
        } else {
            setTimer(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = () => {
        setIsRecording(true);
        setSimulationState('recording');
    };

    const stopRecording = () => {
        setIsRecording(false);
        setSimulationState('processing');

        // Simulate Transcription
        setTimeout(() => {
            onTranscription("這是一段模擬的語音輸入內容。我現在感覺身體有些緊繃，但呼吸還算平穩。");
            setSimulationState('idle');
        }, 2000);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="voice-recorder">
            <div className={`record-btn ${simulationState}`} onClick={toggleRecording}>
                {simulationState === 'idle' && <span className="icon">🎤</span>}
                {simulationState === 'recording' && <span className="icon">⏹️</span>}
                {simulationState === 'processing' && <div className="loader"></div>}
            </div>

            <div className="status-text">
                {simulationState === 'idle' && "點擊開始語音表達"}
                {simulationState === 'recording' && `正在聆聽... ${formatTime(timer)}`}
                {simulationState === 'processing' && "AI 正在轉譯您的聲音..."}
            </div>

            <style>{`
        .voice-recorder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
        }

        .record-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid var(--glass-border);
          position: relative;
        }

        .record-btn.idle:hover {
          transform: scale(1.1);
          background: var(--glass-bg);
          box-shadow: 0 0 20px rgba(255,255,255,0.05);
        }

        .record-btn.recording {
          background: rgba(180, 138, 137, 0.2);
          border-color: var(--color-red);
          animation: pulse 1.5s infinite;
        }

        .status-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .loader {
          width: 24px;
          height: 24px;
          border: 2px solid var(--text-secondary);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(180, 138, 137, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(180, 138, 137, 0); }
          100% { box-shadow: 0 0 0 0 rgba(180, 138, 137, 0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default VoiceRecorder;
