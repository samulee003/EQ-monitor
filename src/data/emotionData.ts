export type Quadrant = 'red' | 'yellow' | 'blue' | 'green';

export interface Emotion {
    id: string;
    name: string;
    quadrant: Quadrant;
    energy: number; // 1-5 (Grid position vertically)
    pleasantness: number; // 1-5 (Grid position horizontally)
}

export interface PsychologicalNeed {
    id: string;
    label: string;
    icon: string;
    desc: string;
}

export const emotions: Emotion[] = [
    // --- RED: High Energy, Low Pleasantness (Top Left 5x5) ---
    { id: 'enraged', name: '憤怒的', quadrant: 'red', energy: 5, pleasantness: 1 },
    { id: 'panicked', name: '驚惶失措的', quadrant: 'red', energy: 5, pleasantness: 2 },
    { id: 'stressed', name: '壓力很大的', quadrant: 'red', energy: 5, pleasantness: 3 },
    { id: 'anxious_unrest', name: '緊張不安的', quadrant: 'red', energy: 5, pleasantness: 4 },
    { id: 'shocked', name: '震驚的', quadrant: 'red', energy: 5, pleasantness: 5 },
    { id: 'furious', name: '暴怒的', quadrant: 'red', energy: 4, pleasantness: 1 },
    { id: 'angry_steaming', name: '氣沖沖的', quadrant: 'red', energy: 4, pleasantness: 2 },
    { id: 'frustrated', name: '沮喪的', quadrant: 'red', energy: 4, pleasantness: 3 },
    { id: 'tense_nervous', name: '神經緊繃的', quadrant: 'red', energy: 4, pleasantness: 4 },
    { id: 'stunned', name: '錯愕的', quadrant: 'red', energy: 4, pleasantness: 5 },
    { id: 'livid', name: '火冒三丈的', quadrant: 'red', energy: 3, pleasantness: 1 },
    { id: 'startled', name: '受到驚嚇的', quadrant: 'red', energy: 3, pleasantness: 2 },
    { id: 'angry', name: '生氣的', quadrant: 'red', energy: 3, pleasantness: 3 },
    { id: 'nervous', name: '緊張的', quadrant: 'red', energy: 3, pleasantness: 4 },
    { id: 'restless', name: '坐立難安的', quadrant: 'red', energy: 3, pleasantness: 5 },
    { id: 'anxious', name: '焦慮的', quadrant: 'red', energy: 2, pleasantness: 1 },
    { id: 'apprehensive', name: '憂慮不安的', quadrant: 'red', energy: 2, pleasantness: 2 },
    { id: 'worried', name: '擔心的', quadrant: 'red', energy: 2, pleasantness: 3 },
    { id: 'irritated', name: '被激怒的', quadrant: 'red', energy: 2, pleasantness: 4 },
    { id: 'annoyed', name: '被惹惱的', quadrant: 'red', energy: 2, pleasantness: 5 },
    { id: 'repulsed', name: '反感的', quadrant: 'red', energy: 1, pleasantness: 1 },
    { id: 'troubled', name: '困擾的', quadrant: 'red', energy: 1, pleasantness: 2 },
    { id: 'concerned', name: '在意的', quadrant: 'red', energy: 1, pleasantness: 3 },
    { id: 'uneasy', name: '忐忑不安的', quadrant: 'red', energy: 1, pleasantness: 4 },
    { id: 'displeased', name: '不太高興的', quadrant: 'red', energy: 1, pleasantness: 5 },

    // --- YELLOW: High Energy, High Pleasantness (Top Right 5x5) ---
    { id: 'surprised_joy', name: '驚喜的', quadrant: 'yellow', energy: 5, pleasantness: 1 },
    { id: 'uplifted', name: '振奮的', quadrant: 'yellow', energy: 5, pleasantness: 2 },
    { id: 'celebratory', name: '歡慶的', quadrant: 'yellow', energy: 5, pleasantness: 3 },
    { id: 'elated', name: '心花怒放的', quadrant: 'yellow', energy: 5, pleasantness: 4 },
    { id: 'ecstatic', name: '欣喜若狂的', quadrant: 'yellow', energy: 5, pleasantness: 5 },
    { id: 'hyper', name: '亢奮的', quadrant: 'yellow', energy: 4, pleasantness: 1 },
    { id: 'pleasant_joy', name: '愉悅的', quadrant: 'yellow', energy: 4, pleasantness: 2 },
    { id: 'motivated', name: '有動力的', quadrant: 'yellow', energy: 4, pleasantness: 3 },
    { id: 'inspired', name: '受到啟發的', quadrant: 'yellow', energy: 4, pleasantness: 4 },
    { id: 'joyful_excited', name: '興高采烈的', quadrant: 'yellow', energy: 4, pleasantness: 5 },
    { id: 'energetic', name: '精力充沛的', quadrant: 'yellow', energy: 3, pleasantness: 1 },
    { id: 'lively', name: '生氣勃勃的', quadrant: 'yellow', energy: 3, pleasantness: 2 },
    { id: 'excited', name: '興奮的', quadrant: 'yellow', energy: 3, pleasantness: 3 },
    { id: 'optimistic', name: '樂觀的', quadrant: 'yellow', energy: 3, pleasantness: 4 },
    { id: 'passionate', name: '熱情洋溢的', quadrant: 'yellow', energy: 3, pleasantness: 5 },
    { id: 'happy', name: '開心的', quadrant: 'yellow', energy: 2, pleasantness: 1 },
    { id: 'focused', name: '集中的', quadrant: 'yellow', energy: 2, pleasantness: 2 },
    { id: 'joyful', name: '快樂的', quadrant: 'yellow', energy: 2, pleasantness: 3 },
    { id: 'proud', name: '驕傲的', quadrant: 'yellow', energy: 2, pleasantness: 4 },
    { id: 'thrilled', name: '興奮激動的', quadrant: 'yellow', energy: 2, pleasantness: 5 },
    { id: 'delighted', name: '令人愉快的', quadrant: 'yellow', energy: 1, pleasantness: 1 },
    { id: 'glad', name: '欣喜的', quadrant: 'yellow', energy: 1, pleasantness: 2 },
    { id: 'hopeful', name: '有希望的', quadrant: 'yellow', energy: 1, pleasantness: 3 },
    { id: 'playful', name: '好玩的', quadrant: 'yellow', energy: 1, pleasantness: 4 },
    { id: 'blissful', name: '幸福的', quadrant: 'yellow', energy: 1, pleasantness: 5 },

    // --- BLUE: Low Energy, Low Pleasantness (Bottom Left 5x5) ---
    { id: 'disgusted', name: '厭惡的', quadrant: 'blue', energy: 5, pleasantness: 1 },
    { id: 'lifeless', name: '死氣沈沈的', quadrant: 'blue', energy: 5, pleasantness: 2 },
    { id: 'disappointed', name: '失望的', quadrant: 'blue', energy: 5, pleasantness: 3 },
    { id: 'low', name: '低落的', quadrant: 'blue', energy: 5, pleasantness: 4 },
    { id: 'unmotivated', name: '提不起勁的', quadrant: 'blue', energy: 5, pleasantness: 5 },
    { id: 'pessimistic', name: '悲觀的', quadrant: 'blue', energy: 4, pleasantness: 1 },
    { id: 'heavy_hearted', name: '鬱鬱寡歡的', quadrant: 'blue', energy: 4, pleasantness: 2 },
    { id: 'discouraged', name: '洩氣的', quadrant: 'blue', energy: 4, pleasantness: 3 },
    { id: 'sad', name: '難過的', quadrant: 'blue', energy: 4, pleasantness: 4 },
    { id: 'bored', name: '無聊的', quadrant: 'blue', energy: 4, pleasantness: 5 },
    { id: 'alienated', name: '疏離的', quadrant: 'blue', energy: 3, pleasantness: 1 },
    { id: 'miserable', name: '悲慘的', quadrant: 'blue', energy: 3, pleasantness: 2 },
    { id: 'lonely', name: '孤單的', quadrant: 'blue', energy: 3, pleasantness: 3 },
    { id: 'disheartened', name: '心灰意冷的', quadrant: 'blue', energy: 3, pleasantness: 4 },
    { id: 'tired_low', name: '疲累的', quadrant: 'blue', energy: 3, pleasantness: 5 },
    { id: 'despondent', name: '消沈的', quadrant: 'blue', energy: 2, pleasantness: 1 },
    { id: 'depressed', name: '抑鬱的', quadrant: 'blue', energy: 2, pleasantness: 2 },
    { id: 'gloomy', name: '悶悶不樂的', quadrant: 'blue', energy: 2, pleasantness: 3 },
    { id: 'exhausted', name: '精疲力竭的', quadrant: 'blue', energy: 2, pleasantness: 4 },
    { id: 'fatigued', name: '疲勞的', quadrant: 'blue', energy: 2, pleasantness: 5 },
    { id: 'hopeless', name: '絕望的', quadrant: 'blue', energy: 1, pleasantness: 1 },
    { id: 'helpless', name: '無望的', quadrant: 'blue', energy: 1, pleasantness: 2 },
    { id: 'desolate', name: '孤寂的', quadrant: 'blue', energy: 1, pleasantness: 3 },
    { id: 'spent', name: '疲憊不堪的', quadrant: 'blue', energy: 1, pleasantness: 4 },
    { id: 'drained', name: '被榨乾的', quadrant: 'blue', energy: 1, pleasantness: 5 },

    // --- GREEN: Low Energy, High Pleasantness (Bottom Right 5x5) ---
    { id: 'at_ease', name: '自在的', quadrant: 'green', energy: 5, pleasantness: 1 },
    { id: 'easygoing', name: '隨和的', quadrant: 'green', energy: 5, pleasantness: 2 },
    { id: 'content', name: '知足的', quadrant: 'green', energy: 5, pleasantness: 3 },
    { id: 'loving', name: '充滿愛的', quadrant: 'green', energy: 5, pleasantness: 4 },
    { id: 'satisfied_full', name: '心滿意足的', quadrant: 'green', energy: 5, pleasantness: 5 },
    { id: 'calm', name: '平靜的', quadrant: 'green', energy: 4, pleasantness: 1 },
    { id: 'secure', name: '安全的', quadrant: 'green', energy: 4, pleasantness: 2 },
    { id: 'satisfied', name: '滿意的', quadrant: 'green', energy: 4, pleasantness: 3 },
    { id: 'grateful', name: '滿懷感謝的', quadrant: 'green', energy: 4, pleasantness: 4 },
    { id: 'touched', name: '感動的', quadrant: 'green', energy: 4, pleasantness: 5 },
    { id: 'relaxed', name: '放鬆的', quadrant: 'green', energy: 3, pleasantness: 1 },
    { id: 'cool_headed', name: '冷靜的', quadrant: 'green', energy: 3, pleasantness: 2 },
    { id: 'tranquil', name: '寧靜的', quadrant: 'green', energy: 3, pleasantness: 3 },
    { id: 'blessed', name: '有福氣的', quadrant: 'green', energy: 3, pleasantness: 4 },
    { id: 'balanced', name: '平衡的', quadrant: 'green', energy: 3, pleasantness: 5 },
    { id: 'mellow', name: '柔和的', quadrant: 'green', energy: 2, pleasantness: 1 },
    { id: 'thoughtful', name: '周到的', quadrant: 'green', energy: 2, pleasantness: 2 },
    { id: 'peaceful', name: '平和的', quadrant: 'green', energy: 2, pleasantness: 3 },
    { id: 'comfortable', name: '舒服的', quadrant: 'green', energy: 2, pleasantness: 4 },
    { id: 'carefree', name: '無憂無慮的', quadrant: 'green', energy: 2, pleasantness: 5 },
    { id: 'sleepy', name: '昏昏欲睡的', quadrant: 'green', energy: 1, pleasantness: 1 },
    { id: 'complacent', name: '自鳴得意的', quadrant: 'green', energy: 1, pleasantness: 2 },
    { id: 'serene', name: '平靜的', quadrant: 'green', energy: 1, pleasantness: 3 },
    { id: 'cozy', name: '舒適的', quadrant: 'green', energy: 1, pleasantness: 4 },
    { id: 'placid', name: '安詳的', quadrant: 'green', energy: 1, pleasantness: 5 },
];

export const psychologicalNeeds: PsychologicalNeed[] = [
    { id: 'respect', label: '尊重與認可', icon: '🤝', desc: '渴望被看見、被聽見或被重視' },
    { id: 'safety', label: '安全與穩定', icon: '🛡️', desc: '追求生理或心理上的安全感與預測性' },
    { id: 'connection', label: '連結與歸屬', icon: '❤️', desc: '需要友誼、愛或群體的歸屬感' },
    { id: 'autonomy', label: '自主與自由', icon: '🕊️', desc: '渴望自己做決定、掌控生活節奏' },
    { id: 'meaning', label: '意義與價值', icon: '✨', desc: '希望感到自己有貢獻或生命有意義' },
    { id: 'rest', label: '休息與放鬆', icon: '🛌', desc: '需要空間來恢復體力或精神能量' },
    { id: 'growth', label: '挑戰與成長', icon: '🌱', desc: '渴望學習新事物或突破自我' },
];
