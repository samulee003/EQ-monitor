/**
 * VoiceGuideService - 語音引導服務
 * 
 * 使用 Web Speech API 提供正念身體掃描語音引導
 * 支持播放、暫停、停止控制
 */

export interface VoiceGuideScript {
    id: string;
    title: string;
    duration: number; // 預估秒數
    sections: VoiceSection[];
}

export interface VoiceSection {
    text: string;
    pauseAfter: number; // 朗讀後暫停秒數
}

// 身體掃描語音腳本
export const bodyScanScript: VoiceGuideScript = {
    id: 'body-scan-basic',
    title: '正念身體掃描 (3分鐘)',
    duration: 180,
    sections: [
        {
            text: '歡迎來到身體掃描練習。請找一個舒適的姿勢，可以是坐著或躺著。',
            pauseAfter: 3
        },
        {
            text: '輕輕閉上雙眼，或者讓目光柔和地看向前方。',
            pauseAfter: 2
        },
        {
            text: '現在，將注意力帶到呼吸上。不需要改變呼吸的節奏，只是單純地覺察。',
            pauseAfter: 5
        },
        {
            text: '感受空氣進入鼻腔的溫度，還有離開時的感覺。',
            pauseAfter: 5
        },
        {
            text: '現在，將注意力帶到頭頂。想像一股溫暖的能量，從頭頂慢慢向下流動。',
            pauseAfter: 4
        },
        {
            text: '覺察額頭的感覺，眉毛，還有眼周圍的肌肉。',
            pauseAfter: 4
        },
        {
            text: '如果這裡有任何緊繃，允許它在呼氣時慢慢融化。',
            pauseAfter: 4
        },
        {
            text: '注意力來到臉頰，下巴，還有整個臉部。',
            pauseAfter: 4
        },
        {
            text: '現在向下移動到喉嚨，頸部。感受這裡的感覺。',
            pauseAfter: 4
        },
        {
            text: '來到肩膀。這裡常常承載著壓力。只是覺察，不需要改變什麼。',
            pauseAfter: 5
        },
        {
            text: '溫暖的能量繼續向下，流過手臂，手肘，來到手掌和手指。',
            pauseAfter: 5
        },
        {
            text: '現在來到胸口。感受心跳的節奏，還有呼吸時胸口的起伏。',
            pauseAfter: 5
        },
        {
            text: '注意力來到腹部。感受腹部的起伏，隨著每一次呼吸。',
            pauseAfter: 5
        },
        {
            text: '來到背部。從脊椎一直向下，到腰部。',
            pauseAfter: 4
        },
        {
            text: '繼續向下，來到臀部，大腿，膝蓋。',
            pauseAfter: 4
        },
        {
            text: '感受小腿，腳踝，還有整個腳掌。',
            pauseAfter: 4
        },
        {
            text: '現在，想像這股溫暖的能量充滿了整個身體，從頭頂到腳底。',
            pauseAfter: 5
        },
        {
            text: '在這個完整的覺察中停留片刻。',
            pauseAfter: 5
        },
        {
            text: '準備好時，輕輕動動手指和腳趾。',
            pauseAfter: 3
        },
        {
            text: '深深吸一口氣，然後緩緩吐氣。',
            pauseAfter: 3
        },
        {
            text: '當你準備好了，輕輕睜開眼睛。感謝你的練習。',
            pauseAfter: 2
        }
    ]
};

class VoiceGuideService {
    private synthesis: SpeechSynthesis | null = null;
    private utterance: SpeechSynthesisUtterance | null = null;
    private isPlaying = false;
    private currentSection = 0;
    private script: VoiceGuideScript | null = null;
    private onProgressCallback: ((section: number, total: number) => void) | null = null;
    private onCompleteCallback: (() => void) | null = null;

    constructor() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.synthesis = window.speechSynthesis;
        }
    }

    /**
     * 檢查是否支持語音
     */
    isSupported(): boolean {
        return this.synthesis !== null;
    }

    /**
     * 獲取可用的語音列表
     */
    getVoices(): SpeechSynthesisVoice[] {
        if (!this.synthesis) return [];
        return this.synthesis.getVoices().filter(v => v.lang.startsWith('zh'));
    }

    /**
     * 開始播放語音引導
     */
    async play(
        script: VoiceGuideScript = bodyScanScript,
        onProgress?: (section: number, total: number) => void,
        onComplete?: () => void
    ): Promise<void> {
        if (!this.synthesis) {
            console.warn('Web Speech API not supported');
            return;
        }

        this.script = script;
        this.currentSection = 0;
        this.onProgressCallback = onProgress || null;
        this.onCompleteCallback = onComplete || null;
        this.isPlaying = true;

        await this.playNextSection();
    }

    /**
     * 播放下一個段落
     */
    private async playNextSection(): Promise<void> {
        if (!this.script || !this.synthesis || !this.isPlaying) return;

        if (this.currentSection >= this.script.sections.length) {
            this.stop();
            this.onCompleteCallback?.();
            return;
        }

        const section = this.script.sections[this.currentSection];
        
        // 更新進度
        this.onProgressCallback?.(this.currentSection, this.script.sections.length);

        // 創建語音實例
        this.utterance = new SpeechSynthesisUtterance(section.text);
        
        // 設置中文語音
        const voices = this.getVoices();
        if (voices.length > 0) {
            // 優先選擇台灣或香港的中文語音
            const preferredVoice = voices.find(v => v.lang.includes('TW') || v.lang.includes('HK'))
                || voices[0];
            this.utterance.voice = preferredVoice;
        }

        // 設置語速和音調
        this.utterance.rate = 0.85; // 稍慢，適合正念練習
        this.utterance.pitch = 1;
        this.utterance.volume = 1;

        // 完成後的處理
        this.utterance.onend = () => {
            if (!this.isPlaying) return;
            
            // 暫停後播放下一段
            setTimeout(() => {
                this.currentSection++;
                this.playNextSection();
            }, section.pauseAfter * 1000);
        };

        this.utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isPlaying = false;
        };

        // 開始播放
        this.synthesis.speak(this.utterance);
    }

    /**
     * 暫停播放
     */
    pause(): void {
        if (this.synthesis) {
            this.synthesis.pause();
        }
    }

    /**
     * 繼續播放
     */
    resume(): void {
        if (this.synthesis) {
            this.synthesis.resume();
        }
    }

    /**
     * 停止播放
     */
    stop(): void {
        this.isPlaying = false;
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        this.currentSection = 0;
    }

    /**
     * 獲取當前播放狀態
     */
    getStatus(): { isPlaying: boolean; currentSection: number; totalSections: number } {
        return {
            isPlaying: this.isPlaying,
            currentSection: this.currentSection,
            totalSections: this.script?.sections.length || 0
        };
    }
}

export const voiceGuideService = new VoiceGuideService();
export default voiceGuideService;
