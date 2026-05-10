import { useState, useEffect } from 'react';

export function BreathingAnimation() {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(4);

  useEffect(() => {
    const cycle = [
      { phase: 'inhale' as const, duration: 4000, startCount: 4 },
      { phase: 'hold' as const, duration: 7000, startCount: 7 },
      { phase: 'exhale' as const, duration: 8000, startCount: 8 },
    ];
    let idx = 0;
    let timer: number;
    let countTimer: number;

    const run = () => {
      const step = cycle[idx];
      setPhase(step.phase);
      setCount(step.startCount);
      timer = window.setTimeout(() => {
        idx = (idx + 1) % cycle.length;
        run();
      }, step.duration);
    };
    run();

    countTimer = window.setInterval(() => {
      setCount((c) => (c > 1 ? c - 1 : c));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countTimer);
    };
  }, []);

  const durationClass =
    phase === 'inhale'
      ? 'duration-[4000ms]'
      : phase === 'exhale'
        ? 'duration-[8000ms]'
        : 'duration-0';
  const scaleClass = phase === 'exhale' ? 'scale-100' : 'scale-150';

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div
        className={`w-32 h-32 rounded-full bg-blue-400 opacity-60 transition-transform ease-in-out ${durationClass} ${scaleClass}`}
      />
      <p className="text-lg font-medium text-blue-700">
        {phase === 'inhale' ? '吸氣' : phase === 'hold' ? '屏息' : '吐氣'} ({count})
      </p>
    </div>
  );
}
