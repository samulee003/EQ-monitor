import { useEffect, useState } from 'react';

export type BreathPhase = 'inhale' | 'hold' | 'exhale';

export interface BreathingCadence {
  inhaleMs: number;
  holdMs: number;
  exhaleMs: number;
}

export function useBreathingPhase(cadence: BreathingCadence): BreathPhase {
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const { inhaleMs, holdMs, exhaleMs } = cadence;

  useEffect(() => {
    const cycle: { p: BreathPhase; ms: number }[] = [
      { p: 'inhale', ms: inhaleMs },
      { p: 'hold', ms: holdMs },
      { p: 'exhale', ms: exhaleMs },
    ];
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const cur = cycle[idx];
      setPhase(cur.p);
      timer = setTimeout(() => {
        idx = (idx + 1) % cycle.length;
        tick();
      }, cur.ms);
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inhaleMs, holdMs, exhaleMs]);

  return phase;
}
