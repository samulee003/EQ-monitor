import { PhysicalData } from './PhysicalService';
import { RULER_COACH_SYSTEM_PROMPT } from './prompts';

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
            summary: "（AI 連線未設定）你似乎正在經歷一段情緒波折。這是一個自然的過程，給自己一點空間去感受。",
            underlyingPatterns: ["情境過載", "尋求認同"],
            suggestedAction: "嘗試將當前的任務分解為細小的步驟，先完成最簡單的一項。",
            empatheticQuote: "「情緒不是障礙，而是內在智慧的信使。」"
        },
        "red": {
            summary: "（AI 連線未設定）你的能量水平較高且伴隨不適。這通常是『戰或逃』反應的體現。",
            underlyingPatterns: ["急性壓力", "界限侵犯"],
            suggestedAction: "進行 5-4-3-2-1 五感接地的練習，將注意力拉回當下。",
            empatheticQuote: "「在刺激與反應之間，有一個空間；在那個空間裡，我們有選擇權。」"
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
     * summarizeHistory
     * Generates a weekly/monthly emotional summary.
     */
    async summarizeHistory(logs: any[]): Promise<string> {
        if (logs.length === 0) return "尚無數據可總結。";
        // Future: Implement AI summary
        return `在過去的記錄中，你展現了持續的自我覺察力。你似乎在環境變動時更能連結到內在感受。`;
    }
}

export const aiService = new AIService();
