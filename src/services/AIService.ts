import { logger } from '../utils/logger';
import { RULER_COACH_SYSTEM_PROMPT, PARENTING_CONTEXT_ADDON } from './prompts';
import { type RulerLogEntry, type AIAnalysisData, type ChatHistoryEntry } from '../types/RulerTypes';

// PhysicalData 接口定義
export interface PhysicalData {
    sleepHours: number;
    activityLevel?: number;
    steps?: number;
    heartRate?: number;
    heartRateVariability?: number;
}

export interface AIInsight {
    summary: string;
    underlyingPatterns: string[];
    suggestedAction: string;
    empatheticQuote: string;
    memoryTrigger?: string;
    physicalContext?: string;
    colorTheory?: string; // New field from System Prompt
}

class AIService {
    // 環境變量來源說明：
    // - VITE_API_PROXY_URL: 使用的代理端點（Key 在服務端，更安全）
    private proxyUrl = import.meta.env.VITE_API_PROXY_URL;

    private static MOCK_INSIGHTS: Record<string, AIInsight> = {
        "default": {
            summary: "你正在進行一場重要的內在對話。不論此刻感受如何，覺察本身就是力量。",
            underlyingPatterns: ["情境過載", "尋求認同"],
            suggestedAction: "嘗試將當前的任務分解為細小的步驟，先完成最簡單的一項。",
            empatheticQuote: "「情緒不是障礙，而是內在智慧的信使。」"
        },
        "red": {
            summary: "你正經歷很滿、卡住的狀態。這種「戰或逃」反應是身體保護你的方式。",
            underlyingPatterns: ["壓力累積", "界限被侵犯", "未滿足的控制感需求"],
            suggestedAction: "進行 5-4-3-2-1 五感接地練習，或嘗試深呼吸，讓身體慢慢降速。",
            empatheticQuote: "「在刺激與反應之間，有一個空間；在那個空間裡，我們有選擇權。」— 維克多·弗蘭克",
            colorTheory: "紅色狀態代表高能量、不舒服的時刻，通常需要先暫停，讓身體有機會回到可承受範圍。"
        },
        "yellow": {
            summary: "你正處於充滿活力與正向的狀態！這種能量是創造與連結的絕佳時機。",
            underlyingPatterns: ["成就達成", "社交連結", "期待實現"],
            suggestedAction: "將這份能量傳遞給重要的人，或記錄下此刻的感受，作為未來低潮時的養分。",
            empatheticQuote: "「快樂不是終點，而是一種旅行的方式。」",
            colorTheory: "黃色狀態代表被點亮、較順心的時刻，適合創意工作與社交互動。"
        },
        "blue": {
            summary: "很慢、卡住的感受可能讓你覺得沉重。請記得，允許自己在此刻放慢腳步。",
            underlyingPatterns: ["疲憊累積", "失落感", "連結斷裂"],
            suggestedAction: "給自己一個柔軟的擁抱，或進行一件微小但滋養自己的事，如泡杯熱茶。",
            empatheticQuote: "「有些日子你會創造歷史，有些日子你只需要撐過去。」",
            colorTheory: "藍色狀態需要自我慈悲，這不是軟弱的表現，而是復原的起點。"
        },
        "green": {
            summary: "你正處於平靜而滿足的狀態。這份寧靜是內心充電的寶貴時刻。",
            underlyingPatterns: ["內在平衡", "感恩連結", "安全感滿足"],
            suggestedAction: "在這個狀態下進行反思或感恩練習，效果會特別好。",
            empatheticQuote: "「平靜不是沒有風暴，而是在風暴中心安然自處。」",
            colorTheory: "綠色狀態是恢復與整合的狀態，是建立新習慣和深度思考的最佳時機。"
        }
    };

    /**
     * analyzeFeeling
     * Analyzes the check-in data, history, and physical context using LLM.
     */
    async analyzeFeeling(data: AIAnalysisData, history: ChatHistoryEntry[] = [], physical?: PhysicalData): Promise<AIInsight> {
        logger.info('[AIService] Analyzing data with Zeabur AI Hub...');

        const userPrompt = this.constructUserPrompt(data, history, physical);
        const isParentingContext = this.detectParentingContext(data);
        const systemPrompt = isParentingContext
            ? RULER_COACH_SYSTEM_PROMPT + '\n' + PARENTING_CONTEXT_ADDON
            : RULER_COACH_SYSTEM_PROMPT;

        // 使用代理端點（Key 在服務端，更安全）
        if (this.proxyUrl) {
            try {
                const response = await this.fetchWithTimeout(this.proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        model: "gpt-4o",
                        temperature: 0.7
                    })
                });
                if (response.ok) {
                    const result = await response.json();
                    return this.parseAIResponse(result.choices?.[0]?.message?.content);
                }
                logger.warn('[AIService] Proxy failed, using mock fallback');
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    logger.warn('[AIService] Proxy request timed out, using mock fallback');
                } else {
                    logger.warn('[AIService] Proxy error, using mock fallback', { error: String(error) });
                }
            }
        } else {
            logger.warn('[AIService] No proxy URL configured, using mock data');
        }

        return this.getMockFallback(data.emotion?.quadrant);
    }

    private detectParentingContext(data: AIAnalysisData): boolean {
        const parentingKeywords = ['育兒', '管教', '孩子', '小孩', '寶寶', '兒子', '女兒', '吼', '哭鬧'];
        const trigger = data.understanding?.trigger || data.understanding?.what || '';
        const who = data.understanding?.who || '';
        const note = data.note || '';
        const combined = `${trigger} ${who} ${note}`;
        return parentingKeywords.some(kw => combined.includes(kw));
    }

    private constructUserPrompt(data: AIAnalysisData, history: ChatHistoryEntry[], physical?: PhysicalData): string {
        return JSON.stringify({
            currentMood: {
                quadrant: data.emotion?.quadrant,
                name: data.emotion?.name,
                intensity: data.intensity
            },
            userNote: data.note || "User did not provide a specific note.",
            physicalContext: physical || "No physical data available.",
            recentHistory: history.slice(0, 3) // Only send last 3 entries for context
        });
    }

    private parseAIResponse(content: string): AIInsight {
        try {
            // Remove markdown code blocks if present
            const cleanJson = content.replace(/```json\n?|\n?```/g, "").trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            logger.error('[AIService] Failed to parse AI JSON', { error: String(e) });
            return AIService.MOCK_INSIGHTS["default"];
        }
    }

    private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            return res;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private getMockFallback(quadrant?: string): AIInsight {
        return AIService.MOCK_INSIGHTS[quadrant || "default"] || AIService.MOCK_INSIGHTS["default"];
    }

    /**
     * generateWeeklyInsight
     * Calls the weekly-report Edge Function for cloud-connected users,
     * falls back to local calculation for offline users.
     */
    async generateWeeklyInsight(userId: string, logs: RulerLogEntry[]): Promise<AIInsight> {
        const WEEKLY_REPORT_URL = 'https://b88egxiz.functions.insforge.app/weekly-report';

        // Calculate dominant quadrant for mock fallback
        const quadrantCounts: Record<string, number> = { red: 0, yellow: 0, blue: 0, green: 0 };
        logs.forEach(log => {
            const q = log.emotions?.[0]?.quadrant;
            if (q && quadrantCounts[q] !== undefined) {
                quadrantCounts[q]++;
            }
        });
        const dominantQuadrant = Object.entries(quadrantCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'green';

        const localFallback = (): AIInsight => {
            const weekMockInsights: Record<string, AIInsight> = {
                red: {
                    summary: "本週你經歷了許多高能量的挑戰時刻。這些「紅色」時光顯示你對生活充滿投入，但也需要學會在刺激與反應之間找到緩衝空間。",
                    underlyingPatterns: ["壓力累積", "高標準自我要求"],
                    suggestedAction: "下週嘗試「3分鐘暫停」練習：每當感到情緒升溫時，先進行三次深呼吸再回應。",
                    empatheticQuote: "「真正的力量不是從不跌倒，而是每次跌倒後都能溫柔地扶起自己。」",
                    colorTheory: "紅色狀態佔比高時，身體多半處於較警覺的狀態。試著在一天結束時引入綠色活動（如靜坐）來平衡。"
                },
                yellow: {
                    summary: "這是一個充滿活力與創造的週次！你的「黃色」時光顯示正向能量充沛，這是建立新習慣和深化關係的絕佳時機。",
                    underlyingPatterns: ["成就動機", "社交連結需求"],
                    suggestedAction: "趁著這股能量，寫下三件本週你為自己感到驕傲的事，作為未來低潮時的儲備。",
                    empatheticQuote: "快樂不是終點，而是一種旅行的方式。你已經在路上了。",
                    colorTheory: "黃色狀態代表被點亮、較順心的時刻。善用這段時間處理重要決定，但也要注意別過度消耗。"
                },
                blue: {
                    summary: "本週的「藍色」時光較多，這不是軟弱，而是身體在誠實地告訴你：它需要休息與被傾聽。",
                    underlyingPatterns: ["能量偏低", "需要休息與陪伴"],
                    suggestedAction: "下週每天給自己15分鐘「無目的時間」——不做任何事，只是存在。",
                    empatheticQuote: "有些季節是為了開花，有些是為了扎根。此刻的你正在扎根。",
                    colorTheory: "藍色狀態提醒你可能需要休息與照顧。像對待重要的人一樣對待自己，給予溫柔與耐心。"
                },
                green: {
                    summary: "你的本週充滿平靜與整合的「綠色」時光。這種內在穩定是情緒韌性的基石，也是創意萌發的沃土。",
                    underlyingPatterns: ["內在平衡", "自我照顧實踐"],
                    suggestedAction: "在這個平穩狀態下，試著記錄一個小目標：下週你想培養的一個微小習慣。",
                    empatheticQuote: "平靜不是沒有風暴，而是在風暴中心依然能夠深呼吸。",
                    colorTheory: "綠色狀態代表較能恢復與整合的狀態。這是沉澱經驗、建立新習慣的好時機。"
                }
            };
            return weekMockInsights[dominantQuadrant] || weekMockInsights['green'];
        };

        // For local-only users (no real userId), use local fallback
        if (!userId || userId === 'test-user' || userId.startsWith('local-')) {
            return localFallback();
        }

        try {
            const response = await this.fetchWithTimeout(WEEKLY_REPORT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) throw new Error(`weekly-report API error: ${response.status}`);
            const result = await response.json();
            if (result.error) throw new Error(result.error);
            const data = result.data;
            if (!data || !data.summary) throw new Error('Invalid weekly report response');
            return {
                summary: data.summary,
                underlyingPatterns: data.underlyingPatterns || [],
                suggestedAction: data.suggestedAction || '',
                empatheticQuote: data.empatheticQuote || '',
                colorTheory: data.colorTheory || '',
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                logger.warn('[AIService] Weekly insight request timed out, using mock fallback');
            } else {
                logger.error('[AIService] Weekly Insight Failed', { error: String(error) });
            }
            return localFallback();
        }
    }

    /**
     * chatWithAssistant
     * Real-time chat with AI assistant for emotional support and guidance.
     */
    async chatWithAssistant(userMessage: string, history: ChatHistoryEntry[] = []): Promise<string> {
        if (!this.proxyUrl) {
            return this.getMockChatResponse(userMessage);
        }

        try {
            const context = history.map(log => ({
                date: new Date(log.timestamp).toLocaleDateString('zh-TW'),
                emotion: log.emotions?.[0]?.name,
                quadrant: log.emotions?.[0]?.quadrant,
                intensity: log.intensity
            }));

            const response = await this.fetchWithTimeout(this.proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { 
                            role: "system", 
                            content: `你是一位專業的情緒智能教練，專注於幫助用戶理解和調節情緒。

指導原則：
1. 以溫暖、同理心的方式回應
2. 使用繁體中文（台灣用語）
3. 回答簡潔但深入（100-200字）
4. 適時引用心理學概念，但優先使用今心自己的四步語言
5. 提供具體可行的建議
6. 避免過度醫療化或診斷
7. 方法來源要誠實：今心是 RULER 啟發、ACT-informed、IFS-informed、Dan Siegel-informed 的自有整合練習
8. 不宣稱與 Yale、RULER Approach、ACT、IFS 或 Dan Siegel / Mindsight Institute 有官方關係

用戶歷史情緒記錄：${JSON.stringify(context)}` 
                        },
                        { role: "user", content: userMessage }
                    ],
                    model: "gpt-4o",
                    temperature: 0.8,
                    max_tokens: 500
                })
            });

            if (!response.ok) throw new Error("API failed");
            
            const result = await response.json();
            return result.choices?.[0]?.message?.content || this.getMockChatResponse(userMessage);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                logger.warn('[AIService] Chat request timed out, using mock fallback');
            } else {
                logger.error('[AIService] Chat failed', { error: String(error) });
            }
            return this.getMockChatResponse(userMessage);
        }
    }

    private getMockChatResponse(message: string): string {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('ruler') || lowerMessage.includes('框架') || lowerMessage.includes('五步') || lowerMessage.includes('四步')) {
            return `今心四步是我們自己的前台整理語言，幫你把混亂感受拆成可以開始的小步：

1. **看見**：先注意身體與此刻狀態
2. **命名**：用更準確的詞靠近感覺
3. **安放**：理解它和哪個情境、需要或內在部分有關，並把想說的話安全放下來
4. **回應**：選一個不傷害自己或他人的小行動

這套練習靈感來自 RULER 的情緒覺察技能，也參考 ACT 的接納與價值行動、IFS-informed 的內在部分覺察，以及 Dan Siegel-informed 的 mindsight 與身心腦整合觀點；今心不是 Yale、RULER Approach、ACT、IFS 或 Dan Siegel / Mindsight Institute 官方產品，也不是心理治療。

重點不是把情緒變好，而是讓你從「被情緒推著走」回到「我可以選下一步」。`;
        }
        
        if (lowerMessage.includes('建議') || lowerMessage.includes('怎麼辦')) {
            return `可以先用今心四步做一個很小的版本：

1. **看見**：先停 10 秒，注意身體最明顯的一個感覺。
2. **命名**：用一句話說「我現在比較像是……」。
3. **安放**：問自己，這份感覺可能在提醒我哪個需要或界線？
4. **回應**：選一個不傷害自己或他人的小動作，例如喝水、離開現場 2 分鐘、傳訊息給可信任的人。

先不用把事情想清楚，能多一點停頓，就已經是在把主導權拿回來。`;
        }
        
        if (lowerMessage.includes('記錄') || lowerMessage.includes('為什麼')) {
            return `記錄情緒就像給心靈寫日記，有三個強大好處：

1. **提升情緒粒度**：研究顯示，能精確命名情緒的人，調節能力更強
2. **發現模式**：你可能會發現「週一早上總是焦慮」或「運動後心情變好」
3. **創造距離**：把情緒寫下來，能幫你從「我是憤怒」轉為「我注意到憤怒的存在」

這不是為了「修正」自己，而是為了更溫柔地理解自己。🌱`;
        }

        return `謝謝你分享這些。作為你的情緒智能助手，我想讓你知道：

無論你此刻感受到什麼，那都是真實且重要的。情緒不是敵人，而是內在智慧傳遞訊息的方式。

如果你想深入探索，可以：
• 問我關於今心四步的問題
• 請我分析你最近的情緒模式
• 聊聊具體的調節策略

我在這裡陪伴你。💚`;
    }
}

export const aiService = new AIService();
