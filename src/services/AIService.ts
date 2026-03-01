// PhysicalData 接口定義
export interface PhysicalData {
    sleepHours: number;
    activityLevel?: number;
    steps?: number;
    heartRate?: number;
    heartRateVariability?: number;
}
import { RULER_COACH_SYSTEM_PROMPT, WEEKLY_INSIGHT_SYSTEM_PROMPT } from './prompts';

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
    private apiUrl = import.meta.env.VITE_ZEABUR_AI_API_URL;
    private apiKey = import.meta.env.VITE_ZEABUR_AI_API_KEY;

    private static MOCK_INSIGHTS: Record<string, AIInsight> = {
        "default": {
            summary: "你正在進行一場重要的內在對話。不論此刻感受如何，覺察本身就是力量。",
            underlyingPatterns: ["情境過載", "尋求認同"],
            suggestedAction: "嘗試將當前的任務分解為細小的步驟，先完成最簡單的一項。",
            empatheticQuote: "「情緒不是障礙，而是內在智慧的信使。」"
        },
        "red": {
            summary: "你正經歷高能量但不舒適的狀態。這種「戰或逃」反應是身體保護你的方式。",
            underlyingPatterns: ["急性壓力", "界限被侵犯", "未滿足的控制感需求"],
            suggestedAction: "進行 5-4-3-2-1 五感接地練習，或嘗試深呼吸，讓神經系統逐漸平復。",
            empatheticQuote: "「在刺激與反應之間，有一個空間；在那個空間裡，我們有選擇權。」— 維克多·弗蘭克",
            colorTheory: "紅色象限的高喚醒感來自交感神經的活化，這是身體的自然保護機制。"
        },
        "yellow": {
            summary: "你正處於充滿活力與正向的狀態！這種能量是創造與連結的絕佳時機。",
            underlyingPatterns: ["成就達成", "社交連結", "期待實現"],
            suggestedAction: "將這份能量傳遞給重要的人，或記錄下此刻的感受，作為未來低潮時的養分。",
            empatheticQuote: "「快樂不是終點，而是一種旅行的方式。」",
            colorTheory: "黃色象限代表最佳表現區域，適合創意工作與社交互動。"
        },
        "blue": {
            summary: "低能量與不適感可能讓你覺得沉重。請記得，允許自己在此刻放慢腳步。",
            underlyingPatterns: ["疲憊累積", "失落感", "連結斷裂"],
            suggestedAction: "給自己一個柔軟的擁抱，或進行一件微小但滋養自己的事，如泡杯熱茶。",
            empatheticQuote: "「有些日子你會創造歷史，有些日子你只需要撐過去。」",
            colorTheory: "藍色象限需要自我慈悲，這不是軟弱的表現，而是復原的起點。"
        },
        "green": {
            summary: "你正處於平靜而滿足的狀態。這份寧靜是內心充電的寶貴時刻。",
            underlyingPatterns: ["內在平衡", "感恩連結", "安全感滿足"],
            suggestedAction: "在這個狀態下進行反思或感恩練習，效果會特別好。",
            empatheticQuote: "「平靜不是沒有風暴，而是在風暴中心安然自處。」",
            colorTheory: "綠色象限是恢復與整合的狀態，是建立新習慣和深度思考的最佳時機。"
        }
    };

    /**
     * analyzeFeeling
     * Analyzes the RULER data, history, and physical context using LLM.
     */
    async analyzeFeeling(data: any, history: any[] = [], physical?: PhysicalData): Promise<AIInsight> {
        console.log("[AIService] Analyzing data with Zeabur AI Hub...");

        if (!this.apiKey || !this.apiUrl) {
            console.warn("Missing Zeabur AI API Key or URL. Using mock data.");
            return this.getMockFallback(data.emotion?.quadrant);
        }

        try {
            const userPrompt = this.constructUserPrompt(data, history, physical);
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: RULER_COACH_SYSTEM_PROMPT },
                        { role: "user", content: userPrompt }
                    ],
                    model: "gpt-4o", // Or the specific model alias provided by Zeabur
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const result = await response.json();
            const content = result.choices?.[0]?.message?.content;

            return this.parseAIResponse(content);

        } catch (error) {
            console.error("AI Service Failed:", error);
            return this.getMockFallback(data.emotion?.quadrant);
        }
    }

    private constructUserPrompt(data: any, history: any[], physical?: PhysicalData): string {
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
            console.error("Failed to parse AI JSON:", e);
            return AIService.MOCK_INSIGHTS["default"];
        }
    }

    private getMockFallback(quadrant?: string): AIInsight {
        return AIService.MOCK_INSIGHTS[quadrant || "default"] || AIService.MOCK_INSIGHTS["default"];
    }

    /**
     * generateWeeklyInsight
     * Analyzes a week of logs to find patterns and provide strategic advice.
     */
    async generateWeeklyInsight(logs: any[]): Promise<AIInsight> {
        // Calculate dominant quadrant for mock fallback
        const quadrantCounts: Record<string, number> = { red: 0, yellow: 0, blue: 0, green: 0 };
        logs.forEach(log => {
            const q = log.emotions?.[0]?.quadrant || log.emotion?.quadrant;
            if (q && quadrantCounts[q] !== undefined) {
                quadrantCounts[q]++;
            }
        });
        const dominantQuadrant = Object.entries(quadrantCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'green';

        if (!this.apiKey || !this.apiUrl) {
            const weekMockInsights: Record<string, AIInsight> = {
                red: {
                    summary: "本週你經歷了許多高能量的挑戰時刻。這些「紅色」時光顯示你對生活充滿投入，但也需要學會在刺激與反應之間找到緩衝空間。",
                    underlyingPatterns: ["急性壓力反應", "高標準自我要求"],
                    suggestedAction: "下週嘗試「3分鐘暫停」練習：每當感到情緒升溫時，先進行三次深呼吸再回應。",
                    empatheticQuote: "「真正的力量不是從不跌倒，而是每次跌倒後都能溫柔地扶起自己。」",
                    colorTheory: "紅色象限佔比高時，身體處於交感神經主導狀態。試著在一天結束時引入綠色活動（如靜坐）來平衡。"
                },
                yellow: {
                    summary: "這是一個充滿活力與創造的週次！你的「黃色」時光顯示正向能量充沛，這是建立新習慣和深化關係的絕佳時機。",
                    underlyingPatterns: ["成就動機", "社交連結需求"],
                    suggestedAction: "趁著這股能量，寫下三件本週你為自己感到驕傲的事，作為未來低潮時的儲備。",
                    empatheticQuote: "快樂不是終點，而是一種旅行的方式。你已經在路上了。",
                    colorTheory: "黃色象限代表最佳表現區。善用這段時間處理重要決定，但也要注意別過度消耗。"
                },
                blue: {
                    summary: "本週的「藍色」時光較多，這不是軟弱，而是身體在誠實地告訴你：它需要休息與被傾聽。",
                    underlyingPatterns: ["能量耗竭", "深層情緒處理"],
                    suggestedAction: "下週每天給自己15分鐘「無目的時間」——不做任何事，只是存在。",
                    empatheticQuote: "有些季節是為了開花，有些是為了扎根。此刻的你正在扎根。",
                    colorTheory: "藍色象限是身體的修復信號。像對待摯友一樣對待自己，給予溫柔與耐心。"
                },
                green: {
                    summary: "你的本週充滿平靜與整合的「綠色」時光。這種內在穩定是情緒韌性的基石，也是創意萌發的沃土。",
                    underlyingPatterns: ["內在平衡", "自我照顧實踐"],
                    suggestedAction: "在這個平穩狀態下，試著記錄一個小目標：下週你想培養的一個微小習慣。",
                    empatheticQuote: "平靜不是沒有風暴，而是在風暴中心依然能夠深呼吸。",
                    colorTheory: "綠色象限代表副交感神經主導的恢復狀態。這是整合經驗、建立新神經迴路的最佳時機。"
                }
            };
            return weekMockInsights[dominantQuadrant] || weekMockInsights['green'];
        }

        try {
            const historyContext = logs.map(log => ({
                date: new Date(log.timestamp).toLocaleDateString('zh-TW'),
                emotion: log.emotions?.[0]?.name || log.emotion?.name,
                quadrant: log.emotions?.[0]?.quadrant || log.emotion?.quadrant,
                intensity: log.intensity,
                trigger: log.understanding?.trigger,
                regulation: log.regulating?.selectedStrategies
            }));

            // Calculate stats for context
            const stats = {
                totalLogs: logs.length,
                averageIntensity: logs.reduce((sum, l) => sum + (l.intensity || 5), 0) / logs.length,
                dominantQuadrant,
                fullFlowCount: logs.filter(l => l.isFullFlow).length
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: WEEKLY_INSIGHT_SYSTEM_PROMPT },
                        { role: "user", content: `本週統計：${JSON.stringify(stats)}\n\n日誌詳情：${JSON.stringify(historyContext)}` }
                    ],
                    model: "gpt-4o",
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error("API failed");
            const result = await response.json();
            return this.parseAIResponse(result.choices?.[0]?.message?.content);
        } catch (error) {
            console.error("Weekly Insight Failed:", error);
            return this.getMockFallback(dominantQuadrant);
        }
    }
}


export const aiService = new AIService();
