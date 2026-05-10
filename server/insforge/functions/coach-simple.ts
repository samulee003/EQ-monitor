import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

const SYSTEM_PROMPT = `你是「今心教練」，一位富有同理心的 AI 情緒陪伴者。你的核心理論基礎是 RULER 框架（Recognize 覺察、Understand 理解、Label 標記、Express 表達、Regulate 調節）以及 Marc Brackett 的情緒智力研究。

## 溝通風格
- 全程使用繁體中文（臺灣用語）
- 溫暖、不帶評判、充滿接納
- 多使用開放式提問，引導使用者自我探索
- 絕對不要否定或輕視任何情緒（例如不要說「想開一點」）
- 適時反映（reflect）使用者的感受，讓對方感覺被聽見

## 工作方式
1. **覺察情緒**：當使用者分享時，協助他們辨識當下的情緒是什麼。
2. **理解脈絡**：溫和地詢問情緒背後的情境或需求。
3. **標記強度**：如果使用者的日誌中有強度記錄，可以參考並詢問目前的強度變化。
4. **鼓勵表達**：肯定使用者願意說出來的勇氣。
5. **協助調節**：根據使用者的狀態，提供合適的調節建議。

## 危機轉介規則
當使用者出現以下情況時，你必須將對話轉交給 MetaMomentSkill：
- 明確表達「我撐不下去了」、「想結束一切」等自傷或自殺意念
- 情緒極度激動、無法冷靜溝通（例如大量使用驚嘆號、髒話、重複表達痛苦）
- 明確要求「幫我」、「我需要緊急協助」、「SOS」
- 身體出現強烈不適（胸悶、無法呼吸、手抖到無法控制）

轉介時請說：「我感受到你現在非常辛苦，讓我們一起啟動 Meta-Moment 緊急協助，一步一步來。」

## Meta-Moment 緊急協助（當 skillInvoked = MetaMomentSkill）
如果進入 Meta-Moment 模式，請嚴格按照以下四步驟執行：

### Step 1 — 感知（Sense）
邀請使用者暫停手邊動作，把注意帶回身體：
「請先暫停一下，讓我們一起感受身體現在的狀態。」
引導使用者覺察：
- 心跳速度如何？
- 肩膀、頸部、下巴是否緊繃？
- 呼吸是深還是淺？
- 腹部或胸口有什麼感覺？
等待使用者回應後，給予接納與肯定，再進入下一步。

### Step 2 — 暫停（Stop）
帶領使用者進行 4-7-8 深呼吸：
「我們一起做三次深呼吸。」
- 吸氣 4 秒
- 屏息 7 秒
- 吐氣 8 秒
每一輪都要陪同計數，讓使用者感覺有人陪著他。
確認使用者完成後，再進入下一步。

### Step 3 — 看見最好的自己（See Your Best Self）
引導使用者回想「當你處於最佳狀態時，你是什麼樣子？」
可以給予提示：
- 充滿耐心？
- 冷靜沉穩？
- 有同理心？
- 幽默風趣？
- 堅韌不拔？
請使用者用一句話描述自己的最佳版本，並給予正向回應。

### Step 4 — 策略與行動（Strategize）
提供具體、可執行的策略，讓使用者選擇一項：
1. 繼續深呼吸 1 分鐘
2. 起身到戶外散步 5 分鐘
3. 喝一杯溫開水
4. 用紙筆或手機寫下此刻的感受
5. 撥打給信任的「情緒急救聯絡人」
6. 聽一首能讓自己平靜的音樂

請使用者選擇一項，並給予鼓勵與祝福。

最後要讓使用者知道：「無論你選擇哪一條路，我都會在這裡陪你。你不需要獨自面對。」`;

const CRISIS_KEYWORDS = [
  '撐不下去',
  '想死',
  '想結束一切',
  '自殺',
  '自傷',
  '跳樓',
  '割腕',
  '沒有意義',
  '活不下去',
  'SOS',
  '緊急協助',
  '幫我',
  '救命',
  '無法呼吸',
  '胸悶',
  '手抖',
];

function isCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

interface EmotionLog {
  emotions: Array<{ name?: string; quadrant?: string; id?: string }>;
  intensity: number;
  created_at: string;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_logs: number;
  last_checkin_date: string | null;
}

async function getUserEmotionSummary(userId: string) {
  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || 'https://b88egxiz.ap-southeast.insforge.app';
    const anonKey = Deno.env.get('ANON_KEY') || '';

    const client = createClient({
      baseUrl,
      anonKey,
    });

    const { data: logs, error: logsError } = await client.database
      .from('ruler_logs')
      .select('emotions, intensity, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('ruler_logs query error:', logsError);
    }

    const { data: streak, error: streakError } = await client.database
      .from('streaks')
      .select('current_streak, longest_streak, total_logs, last_checkin_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (streakError) {
      console.error('streaks query error:', streakError);
    }

    return {
      recentLogs: (logs ?? []) as EmotionLog[],
      streak: (streak ?? {
        current_streak: 0,
        longest_streak: 0,
        total_logs: 0,
        last_checkin_date: null,
      }) as StreakData,
    };
  } catch (e) {
    console.error('DB query failed:', e);
    return {
      recentLogs: [] as EmotionLog[],
      streak: {
        current_streak: 0,
        longest_streak: 0,
        total_logs: 0,
        last_checkin_date: null,
      } as StreakData,
    };
  }
}

interface CoachRequestBody {
  message: string;
  userId: string;
  sessionId: string;
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await req.json()) as CoachRequestBody;
    const { message, userId, sessionId } = body;

    if (!message || !userId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing message, userId or sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const crisis = isCrisis(message);
    let skillInvoked: string | undefined;

    // Build context from DB (optional, graceful fallback)
    const summary = await getUserEmotionSummary(userId);
    const historyContext =
      summary.recentLogs.length > 0
        ? `使用者最近記錄了 ${summary.recentLogs.length} 筆情緒日誌，連續記錄天數為 ${summary.streak.current_streak} 天。`
        : '這是使用者第一次與你對話，或者尚無情緒日誌記錄。';

    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set');
    }

    const prompt = crisis
      ? `${SYSTEM_PROMPT}\n\n【緊急狀態】使用者可能處於危機中，請直接進入 Meta-Moment 四步驟協議。\n\n${historyContext}\n\n使用者說：「${message}」`
      : `${SYSTEM_PROMPT}\n\n${historyContext}\n\n使用者說：「${message}」`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      throw new Error(`Gemini API returned ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const responseText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      '抱歉，我無法回應。';

    if (crisis) {
      skillInvoked = 'MetaMomentSkill';
    }

    return new Response(
      JSON.stringify({
        data: {
          response: responseText,
          skillInvoked,
        },
        error: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Coach Edge Function error:', err);
    return new Response(
      JSON.stringify({
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
