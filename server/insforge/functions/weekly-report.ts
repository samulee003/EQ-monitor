import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const userToken = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!userToken) {
      return new Response(
        JSON.stringify({ data: null, error: 'Unauthorized: missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_URL'),
      edgeFunctionToken: userToken,
    });

    const { data: userData } = await client.auth.getCurrentUser();
    const userId = userData?.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ data: null, error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const since = sevenDaysAgo.toISOString();

    const { data: logs, error: logsError } = await client.database
      .from('ruler_logs')
      .select('emotions, intensity, created_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (logsError) {
      return new Response(
        JSON.stringify({ data: null, error: logsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalSessions = logs?.length ?? 0;

    if (totalSessions === 0) {
      return new Response(
        JSON.stringify({
          data: {
            user_id: userId,
            period_days: 7,
            total_sessions: 0,
            quadrant_distribution: {},
            average_intensity: 0,
            most_frequent_emotion: null,
          },
          error: null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quadrantDistribution: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    let totalIntensity = 0;

    for (const log of logs ?? []) {
      totalIntensity += log.intensity ?? 0;

      const emotions = (log.emotions ?? []) as Array<{ name?: string; quadrant?: string }>;
      for (const emotion of emotions) {
        const quadrant = emotion.quadrant ?? 'unknown';
        quadrantDistribution[quadrant] = (quadrantDistribution[quadrant] ?? 0) + 1;

        const emotionName = emotion.name ?? 'unknown';
        emotionCounts[emotionName] = (emotionCounts[emotionName] ?? 0) + 1;
      }
    }

    const averageIntensity = totalSessions > 0 ? totalIntensity / totalSessions : 0;

    let mostFrequentEmotion: string | null = null;
    let maxCount = 0;
    for (const [name, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentEmotion = name;
      }
    }

    const report = {
      user_id: userId,
      period_days: 7,
      total_sessions: totalSessions,
      quadrant_distribution: quadrantDistribution,
      average_intensity: Math.round(averageIntensity * 10) / 10,
      most_frequent_emotion: mostFrequentEmotion,
    };

    return new Response(
      JSON.stringify({ data: report, error: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ data: null, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
