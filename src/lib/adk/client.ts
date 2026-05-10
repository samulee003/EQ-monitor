import type { CoachRequest, CoachResponse } from './types';

const COACH_API_URL = import.meta.env.VITE_COACH_API_URL || '/api/coach';

export async function sendMessage(req: CoachRequest): Promise<CoachResponse> {
  const res = await fetch(COACH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Coach API error: ${res.status}`);
  return res.json();
}
