import { useState, useEffect } from 'react';
import { BreathingAnimation } from './BreathingAnimation';
import styles from './EmergencyStabilizationOverlay.module.css';

interface Props {
  onClose: () => void;
  onComplete: (result: { safeStep: string; strategy: string }) => void;
}

const STEPS = [
  {
    title: '第 1 步：感覺身體',
    content:
      '先暫停一下，感受一下你的身體。你的心跳如何？肩膀緊嗎？肚子有什麼感覺？',
  },
  {
    title: '第 2 步：呼吸暫停',
    content: '讓我們一起深呼吸，給情緒一些空間。',
  },
  {
    title: '第 3 步：看見安全的一步',
    content:
      '不用變成最好的人。只要想一想：接下來哪一個動作，最能保護你，也比較不會讓你後悔？',
  },
  {
    title: '第 4 步：選一個照顧動作',
    content: '選擇一個策略來幫助你回到平衡：',
  },
];

const STRATEGIES = [
  '繼續深呼吸 1 分鐘',
  '去外面散步 5 分鐘',
  '喝一杯水',
  '寫下現在的感受',
  '打給信任的人',
];

export function EmergencyStabilizationOverlay({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [safeStep, setSafeStep] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-stabilization-title"
      data-testid="emergency-stabilization-overlay"
      data-step={step}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🆘</div>
          <h2
            id="emergency-stabilization-title"
            className={styles.headerTitle}
          >
            緊急安定練習
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="關閉"
          className={styles.closeButton}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.stepLabel} data-testid="emergency-stabilization-step-title">
          {STEPS[step].title}
        </div>
        <p className={styles.stepContent}>
          {STEPS[step].content}
        </p>

        <div className={styles.crisisCard} aria-label="緊急求助資訊">
          <p>今心不是緊急救援服務。如果你或身邊的人有立即危險，請先離開危險環境並聯絡當地緊急服務，台灣可撥 119 或 110。</p>
          <div className={styles.hotlineRow}>
            <a href="tel:1925">安心專線 1925</a>
            <a href="tel:1909">生命線 1909</a>
          </div>
        </div>

        {step === 1 && <BreathingAnimation />}

        {step === 2 && (
          <input
            type="text"
            value={safeStep}
            onChange={(e) => setSafeStep(e.target.value)}
            placeholder="例如：先放下手機、離開現場一分鐘"
            className={styles.bestSelfInput}
            aria-label="寫下現在最安全的一步"
          />
        )}

        {step === 3 && (
          <div className={styles.strategyList}>
            {STRATEGIES.map((s) => (
              <button
                key={s}
                onClick={() => onComplete({ safeStep, strategy: s })}
                className={styles.strategyButton}
              >
                <span>✓</span>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      {step < 3 && (
        <div className={styles.footer}>
          <button
            onClick={handleNext}
            className={styles.nextButton}
            data-testid="emergency-stabilization-next"
          >
            {step === 0
              ? '我準備好了，開始呼吸'
              : step === 1
                ? '呼吸完成'
                : '下一步'}
          </button>
        </div>
      )}
    </div>
  );
}
