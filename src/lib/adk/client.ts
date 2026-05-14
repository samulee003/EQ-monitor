import { insforge } from '@/lib/insforge/client';
import { type CoachRequest, type CoachResponse } from './types';

const COACH_API_URL =
  import.meta.env.VITE_COACH_API_URL ||
  'https://b88egxiz.functions.insforge.app/coach';
const TIMEOUT_MS = 15000;

export async function sendMessage(req: CoachRequest): Promise<CoachResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(COACH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...insforge.getHttpClient().getHeaders(),
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Coach API error: ${res.status}`);
    const body = await res.json();
    if (body?.error) throw new Error(typeof body.error === 'string' ? body.error : 'Coach API error');
    return body?.data ?? body;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw err;
  }
}
