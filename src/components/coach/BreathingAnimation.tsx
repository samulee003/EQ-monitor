import { useState, useEffect } from 'react';
import styles from './BreathingAnimation.module.css';

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

    const countTimer = window.setInterval(() => {
      setCount((c) => (c > 1 ? c - 1 : c));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countTimer);
    };
  }, []);

  const scale = phase === 'exhale' ? 1 : 1.5;
  const transitionDuration =
    phase === 'inhale' ? '4000ms' : phase === 'exhale' ? '8000ms' : '0ms';

  const phaseText =
    phase === 'inhale' ? '吸氣' : phase === 'hold' ? '屏息' : '吐氣';

  return (
    <div className={styles.container}>
      <div
        className={styles.circle}
        style={{
          transform: `scale(${scale})`,
          transitionDuration,
        }}
        aria-hidden="true"
      />
      <p
        className={styles.phaseText}
        aria-live="polite"
      >
        {phaseText} ({count})
      </p>
      <span className="sr-only" aria-live="polite">
        {phaseText}，倒數 {count} 秒
      </span>
    </div>
  );
}
