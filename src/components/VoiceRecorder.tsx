import React, { useState, useEffect } from 'react';
import { uiIcons } from './icons/SvgIcons';
import { useLanguage } from '../services/LanguageContext';
import './VoiceRecorder.css';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription }) => {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [simulationState, setSimulationState] = useState<'idle' | 'recording' | 'processing'>('idle');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
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
      onTranscription(t("這是一段模擬的語音輸入內容。我現在感覺身體有些緊繃，但呼吸還算平穩。"));
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
      <button type="button" className={`record-btn ${simulationState}`} onClick={toggleRecording} aria-label={isRecording ? '停止錄音' : '開始錄音'}>
        {simulationState === 'idle' && <span className="icon">{uiIcons.microphone}</span>}
        {simulationState === 'recording' && <span className="icon stop-icon"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg></span>}
        {simulationState === 'processing' && <div className="loader"></div>}
      </button>

      <div className="status-text">
        {simulationState === 'idle' && t("點擊開始語音表達")}
        {simulationState === 'recording' && t(`正在聆聽... ${formatTime(timer)}`)}
        {simulationState === 'processing' && t("AI 正在轉譯您的聲音...")}
      </div>

    </div>
  );
};

export default VoiceRecorder;
