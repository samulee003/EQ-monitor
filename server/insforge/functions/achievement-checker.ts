import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface AchievementRule {
  key: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  totalLogs: number;
  fullFlowCount: number;
  uniqueEmotions: number;
  currentStreak: number;
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || '';

    if (!userId) {
      return new Response(
        JSON.stringify({ data: null, error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || '';
    const anonKey = Deno.env.get('ANON_KEY') || '';
    const client = createClient({ baseUrl, anonKey });

    // Fetch all ruler logs for the user
    const { data: logs, error: logsError } = await client.database
      .from('ruler_logs')
      .select('emotions, is_full_flow')
      .eq('user_id', userId);

    if (logsError) {
      return new Response(
        JSON.stringify({ data: null, error: logsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch streak data
    const { data: streakData, error: streakError } = await client.database
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .maybeSingle();

    if (streakError) {
      return new Response(
        JSON.stringify({ data: null, error: streakError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate stats
    const totalLogs = logs?.length ?? 0;
    const fullFlowCount = (logs ?? []).filter((log) => log.is_full_flow === true).length;

    const uniqueEmotionSet = new Set<string>();
    for (const log of logs ?? []) {
      const emotions = (log.emotions ?? []) as Array<{ name?: string; id?: string }>;
      for (const emotion of emotions) {
        uniqueEmotionSet.add(emotion.name ?? emotion.id ?? 'unknown');
      }
    }
    const uniqueEmotions = uniqueEmotionSet.size;
    const currentStreak = streakData?.current_streak ?? 0;

    const stats: UserStats = {
      totalLogs,
      fullFlowCount,
      uniqueEmotions,
      currentStreak,
    };

    // Achievement rules
    const rules: AchievementRule[] = [
      { key: 'first_log', check: (s) => s.totalLogs >= 1 },
      { key: 'streak_3', check: (s) => s.currentStreak >= 3 },
      { key: 'streak_7', check: (s) => s.currentStreak >= 7 },
      { key: 'emotions_10', check: (s) => s.uniqueEmotions >= 10 },
      { key: 'full_ruler_5', check: (s) => s.fullFlowCount >= 5 },
    ];

    // Get already unlocked achievements
    const { data: existingAchievements, error: achievementsError } = await client.database
      .from('achievement_records')
      .select('achievement_key')
      .eq('user_id', userId);

    if (achievementsError) {
      return new Response(
        JSON.stringify({ data: null, error: achievementsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const unlockedSet = new Set((existingAchievements ?? []).map((a) => a.achievement_key));

    // Determine newly unlockable achievements
    const newlyUnlocked: string[] = [];
    for (const rule of rules) {
      if (!unlockedSet.has(rule.key) && rule.check(stats)) {
        newlyUnlocked.push(rule.key);
      }
    }

    // Insert missing achievements
    if (newlyUnlocked.length > 0) {
      const inserts = newlyUnlocked.map((key) => ({
        user_id: userId,
        achievement_key: key,
        unlocked_at: new Date().toISOString(),
      }));

      const { error: insertError } = await client.database
        .from('achievement_records')
        .insert(inserts);

      if (insertError) {
        return new Response(
          JSON.stringify({ data: null, error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        data: {
          newly_unlocked: newlyUnlocked,
          stats,
        },
        error: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ data: null, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
