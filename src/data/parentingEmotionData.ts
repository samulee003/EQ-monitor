// 父母專用情緒詞彙庫 - 從 100+ 精簡到 40 個高頻情緒
// 專為育兒場景設計，使用父母熟悉的語言

export type Quadrant = 'red' | 'yellow' | 'blue' | 'green';

export interface ParentingEmotion {
    id: string;
    name: string;
    quadrant: Quadrant;
    description: string;
    parentScenario: string; // 典型育兒觸發情境
}

// 紅色象限：高能量、不舒服
export const redEmotions: ParentingEmotion[] = [
    {
        id: 'red_angry',
        name: '憤怒',
        quadrant: 'red',
        description: '孩子不聽話時的怒火',
        parentScenario: '講了三遍還是不收拾玩具'
    },
    {
        id: 'red_frustrated',
        name: '挫敗',
        quadrant: 'red',
        description: '試了各種方法都沒用',
        parentScenario: '用了專家說的方法，孩子還是哭鬧'
    },
    {
        id: 'red_anxious',
        name: '焦慮',
        quadrant: 'red',
        description: '擔心孩子發展或安全',
        parentScenario: '孩子比其他同學矮/發展慢'
    },
    {
        id: 'red_impatient',
        name: '不耐',
        quadrant: 'red',
        description: '重複講一百遍還是沒聽',
        parentScenario: '快遲到了孩子還在拖'
    },
    {
        id: 'red_wronged',
        name: '委屈',
        quadrant: 'red',
        description: '付出這麼多還被討厭',
        parentScenario: '孩子說「我討厭媽媽」'
    },
    {
        id: 'red_provoked',
        name: '被激怒',
        quadrant: 'red',
        description: '孩子故意唱反調',
        parentScenario: '叫他不要碰，他偏偏要碰'
    }
];

// 黃色象限：高能量、開心
export const yellowEmotions: ParentingEmotion[] = [
    {
        id: 'yellow_gratified',
        name: '欣慰',
        quadrant: 'yellow',
        description: '孩子學會了新技能',
        parentScenario: '孩子第一次自己穿鞋'
    },
    {
        id: 'yellow_healed',
        name: '被療癒',
        quadrant: 'yellow',
        description: '孩子的擁抱或笑聲',
        parentScenario: '累了一天，孩子突然說「我愛你」'
    },
    {
        id: 'yellow_proud',
        name: '驕傲',
        quadrant: 'yellow',
        description: '孩子的成就',
        parentScenario: '孩子在學校表現好被稱讚'
    },
    {
        id: 'yellow_amused',
        name: '好笑',
        quadrant: 'yellow',
        description: '孩子的童言童語',
        parentScenario: '孩子說了超可愛的話'
    },
    {
        id: 'yellow_needed',
        name: '被需要',
        quadrant: 'yellow',
        description: '孩子只要你的時刻',
        parentScenario: '孩子受傷只要媽媽抱'
    }
];

// 藍色象限：低能量、不舒服
export const blueEmotions: ParentingEmotion[] = [
    {
        id: 'blue_guilty',
        name: '愧疚',
        quadrant: 'blue',
        description: '對孩子發脾氣後的自責',
        parentScenario: '吼完孩子後的後悔'
    },
    {
        id: 'blue_powerless',
        name: '無力',
        quadrant: 'blue',
        description: '不知道該怎麼辦',
        parentScenario: '所有方法都試過了還是沒用'
    },
    {
        id: 'blue_lost',
        name: '失去自我',
        quadrant: 'blue',
        description: '生活只剩育兒',
        parentScenario: '好久沒有自己的時間和興趣'
    },
    {
        id: 'blue_burnout',
        name: '育兒倦怠',
        quadrant: 'blue',
        description: '長期累積的疲憊',
        parentScenario: '每天都一樣，看不到盡頭'
    },
    {
        id: 'blue_heartache',
        name: '心疼',
        quadrant: 'blue',
        description: '看到孩子受苦',
        parentScenario: '孩子在學校被欺負/生病'
    },
    {
        id: 'blue_suffocated',
        name: '窒息感',
        quadrant: 'blue',
        description: '沒有自己的時間',
        parentScenario: '24小時都被孩子綁住'
    },
    {
        id: 'blue_inadequate',
        name: '不夠好',
        quadrant: 'blue',
        description: '覺得自己不是好父母',
        parentScenario: '看到其他媽媽都做得很好'
    }
];

// 綠色象限：低能量、平靜
export const greenEmotions: ParentingEmotion[] = [
    {
        id: 'green_calm',
        name: '平靜',
        quadrant: 'green',
        description: '孩子睡了/安靜時刻',
        parentScenario: '孩子終於睡了，世界安靜了'
    },
    {
        id: 'green_content',
        name: '滿足',
        quadrant: 'green',
        description: '簡單的親子時光',
        parentScenario: '一起看書、散步的平凡時刻'
    },
    {
        id: 'green_grateful',
        name: '感恩',
        quadrant: 'green',
        description: '感謝孩子的到來',
        parentScenario: '看著孩子睡臉，覺得幸運'
    },
    {
        id: 'green_relaxed',
        name: '放鬆',
        quadrant: 'green',
        description: '終於可以休息',
        parentScenario: '孩子去保母家/學校了'
    },
    {
        id: 'green_connected',
        name: '連結',
        quadrant: 'green',
        description: '與孩子深度連結',
        parentScenario: '孩子分享秘密/心事'
    }
];

// 所有父母情緒
export const parentingEmotions: ParentingEmotion[] = [
    ...redEmotions,
    ...yellowEmotions,
    ...blueEmotions,
    ...greenEmotions
];

// 快速選擇：每個象限最常用的 3 個
export const quickEmotions: Record<Quadrant, ParentingEmotion[]> = {
    red: redEmotions.slice(0, 3),
    yellow: yellowEmotions.slice(0, 3),
    blue: blueEmotions.slice(0, 3),
    green: greenEmotions.slice(0, 3)
};

// 情緒標籤（快速記錄用）
export const parentScenarioTags = [
    '睡覺',
    '吃飯',
    '哭鬧',
    '不聽話',
    '功課',
    '手足衝突',
    '出門拖拉',
    '3C產品',
    '生病',
    '學校狀況'
];

// 根據 ID 獲取情緒
export function getEmotionById(id: string): ParentingEmotion | undefined {
    return parentingEmotions.find(e => e.id === id);
}

// 根據象限獲取情緒
export function getEmotionsByQuadrant(quadrant: Quadrant): ParentingEmotion[] {
    return parentingEmotions.filter(e => e.quadrant === quadrant);
}

// 獲取情緒的安慰語
export function getEmotionComfort(emotionId: string): string {
    const comforts: Record<string, string> = {
        // 紅色
        'red_angry': '憤怒是信號，告訴你界限被侵犯了。',
        'red_frustrated': '試了沒用不是失敗，是孩子在用自己的方式成長。',
        'red_anxious': '擔心是因為愛，但記得孩子也會找到自己的步調。',
        'red_impatient': '時間壓力下的不耐是正常的，這不代表你是壞父母。',
        'red_wronged': '被討厭的話很痛，但孩子只是還不懂怎麼表達情緒。',
        'red_provoked': '被故意挑釁真的很火大，這需要暫停策略。',
        // 藍色
        'blue_guilty': '愧疚代表你在乎，但修復比完美更重要。',
        'blue_powerless': '不知道怎麼辦的時候，求助也是一種力量。',
        'blue_lost': '失去自我的感受很真實，哪怕每天 5 分鐘給自己都很重要。',
        'blue_burnout': '倦怠是身體在求救，你需要休息，這不是軟弱。',
        'blue_heartache': '看到孩子受苦是最痛的，你的心疼是愛的證明。',
        'blue_suffocated': '24小時被綁住的窒息感是真實的，需要創造喘息空間。',
        'blue_inadequate': '覺得不夠好是每個父母都有的聲音，但對孩子來說，你就是夠好的。',
    };
    return comforts[emotionId] || '這種感受很難，但它會過去。';
}
