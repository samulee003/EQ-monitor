import { useState, useEffect } from 'react';
import { BreathingAnimation } from './BreathingAnimation';

interface Props {
  onClose: () => void;
  onComplete: (result: { bestSelf: string; strategy: string }) => void;
}

const STEPS = [
  {
    title: 'Step 1: 感知 (Sense)',
    content:
      '先暫停一下，感受一下你的身體。你的心跳如何？肩膀緊嗎？肚子有什麼感覺？',
  },
  {
    title: 'Step 2: 暫停 (Stop)',
    content: '讓我們一起深呼吸，給情緒一些空間。',
  },
  {
    title: 'Step 3: 看見最好的自己',
    content:
      '想一想，當你處於最好的狀態時，你是什麼樣子？充滿耐心？冷靜？有同理心？',
  },
  {
    title: 'Step 4: 策略與行動',
    content: '選擇一個策略來幫助你回到平衡：',
  },
];

const STRATEGIES = [
  '繼續深呼吸 1 分鐘',
  '去外面散步 5 分鐘',
  '喝一杯水',
  '寫下現在的感受',
  '打給我的「馬文叔叔」',
];

export function MetaMomentOverlay({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [bestSelf, setBestSelf] = useState('');

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
      className="fixed inset-0 z-50 bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meta-moment-title"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 id="meta-moment-title" className="text-lg font-bold text-red-600">
          🆘 Meta-Moment 緊急協助
        </h2>
        <button
          onClick={onClose}
          aria-label="關閉"
          className="text-gray-500 text-2xl px-2"
        >
          ×
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-y-auto">
        <div className="mb-2 text-sm text-gray-400">{STEPS[step].title}</div>
        <p className="text-lg text-gray-800 mb-8 max-w-md">
          {STEPS[step].content}
        </p>

        {step === 1 && <BreathingAnimation />}

        {step === 2 && (
          <input
            type="text"
            value={bestSelf}
            onChange={(e) => setBestSelf(e.target.value)}
            placeholder="例如：冷靜、有耐心"
            className="w-full max-w-xs border rounded-lg px-4 py-2 text-center"
            aria-label="描述你最好的自己"
          />
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {STRATEGIES.map((s) => (
              <button
                key={s}
                onClick={() => onComplete({ bestSelf, strategy: s })}
                className="px-4 py-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {step < 3 && (
        <div className="p-4">
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
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
