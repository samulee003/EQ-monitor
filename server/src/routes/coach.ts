import { Router } from 'express';
import { runCoach } from '../agents/runner.js';

const router = Router();

interface CoachRequestBody {
  message: string;
  userId: string;
  sessionId: string;
}

router.post('/', async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body as CoachRequestBody;

    if (!message || !userId || !sessionId) {
      res.status(400).json({
        data: null,
        error: 'Missing message, userId or sessionId',
      });
      return;
    }

    const result = await runCoach(message, userId, sessionId);

    res.json({
      data: result,
      error: null,
    });
  } catch (err) {
    console.error('Coach API error:', err);
    res.status(500).json({
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;
