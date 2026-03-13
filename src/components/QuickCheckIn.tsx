import React, { useState } from 'react';
import './QuickCheckIn.css';
import { ParentingEmotion, Quadrant, quickEmotions, parentScenarioTags } from '../data/parentingEmotionData';
// import { aiService } from '../services/AIService';

interface QuickCheckInProps {
    onComplete?: (data: QuickCheckInData) => void;
    onBack?: () => void;
    onCancel?: () => void;
}

export interface QuickCheckInData {
    emotion: ParentingEmotion;
    intensity: number;
    scenarioTag?: string;
    note?: string;
    timestamp: string;
}

type QuickStep = 'quadrant' | 'emotion' | 'intensity' | 'scenario' | 'feedback';

const quadrantConfig: Record<Quadrant, { emoji: string; label: string; color: string; desc: string }> = {
    red: { emoji: '😤', label: '高能量', color: '#C58B8A', desc: '不舒服' },
    yellow: { emoji: '😊', label: '高能量', color: '#D5C1A5', desc: '開心' },
    blue: { emoji: '😢', label: '低能量', color: '#97A6B4', desc: '不舒服' },
    green: { emoji: '😌', label: '低能量', color: '#AAB09B', desc: '平靜' }
};

const QuickCheckIn: React.FC<QuickCheckInProps> = ({ onComplete, onBack }) => {
    const [step, setStep] = useState<QuickStep>('quadrant');
    const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<ParentingEmotion | null>(null);
    const [intensity, setIntensity] = useState<number>(5);
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [aiFeedback, setAiFeedback] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleQuadrantSelect = (quadrant: Quadrant) => {
        setSelectedQuadrant(quadrant);
        setStep('emotion');
    };

    const handleEmotionSelect = (emotion: ParentingEmotion) => {
        setSelectedEmotion(emotion);
        setStep('intensity');
    };

    const handleIntensitySelect = (value: number) => {
        setIntensity(value);
        setStep('scenario');
    };

    const handleScenarioComplete = async () => {
        if (!selectedEmotion) return;

        setIsLoading(true);
        
        // 構建 AI 分析數據
        const checkInData: QuickCheckInData = {
            emotion: selectedEmotion,
            intensity,
            scenarioTag: selectedTag || undefined,
            note: note || undefined,
            timestamp: new Date().toISOString()
        };

        try {
            // 獲取 AI 回饋
            const feedback = await generateAIFeedback(checkInData);
            setAiFeedback(feedback);
            setStep('feedback');
        } catch (error) {
            console.error('AI feedback error:', error);
            setAiFeedback('謝謝你記錄了自己的感受。覺察是改變的第一步。');
            setStep('feedback');
        } finally {
            setIsLoading(false);
        }
    };

    const generateAIFeedback = async (data: QuickCheckInData): Promise<string> => {
        // 根據情緒和強度生成個性化回饋
        const { emotion, intensity, scenarioTag } = data;
        
        let feedback = '';
        
        // 根據象限給予不同類型的回饋
        switch (emotion.quadrant) {
            case 'red':
                feedback = `你記錄的是「${emotion.name}」（強度 ${intensity}/10）。`;
                feedback += `\\n\\n${emotion.description}。`;
                if (intensity >= 7) {
                    feedback += '\\n\\n這個強度很高，記得先照顧好自己的狀態。試試 SOS 緊急救援的呼吸練習？';
                } else {
                    feedback += '\\n\\n這種情緒很正常，代表你在乎。給自己一點空間，它會慢慢過去。';
                }
                break;
                
            case 'blue':
                feedback = `你記錄的是「${emotion.name}」（強度 ${intensity}/10）。`;
                feedback += `\\n\\n${emotion.description}。`;
                if (emotion.id === 'blue_guilty') {
                    feedback += '\\n\\n愧疚代表你在乎，但修復比完美更重要。你已經在學習和改變了。';
                } else if (emotion.id === 'blue_burnout') {
                    feedback += '\\n\\n倦怠是身體在求救。哪怕每天 5 分鐘給自己，都是重要的。';
                } else {
                    feedback += '\\n\\n這種低落的感受很真實，不需要急著「振作」。允許自己現在就是這樣。';
                }
                break;
                
            case 'yellow':
                feedback = `你記錄的是「${emotion.name}」（強度 ${intensity}/10）。`;
                feedback += `\\n\\n${emotion.description}。`;
                feedback += '\\n\\n記得這個美好的時刻，它是你育兒路上的養分。';
                break;
                
            case 'green':
                feedback = `你記錄的是「${emotion.name}」（強度 ${intensity}/10）。`;
                feedback += `\\n\\n${emotion.description}。`;
                feedback += '\\n\\n享受這份平靜，這是你應得的時刻。';
                break;
        }
        
        // 如果有情境標籤，加入具體建議
        if (scenarioTag) {
            const scenarioAdvice: Record<string, string> = {
                '睡覺': '睡眠問題是育兒最大的挑戰之一。記得：這個階段會過去的。',
                '吃飯': '吃飯的權力戰很消耗人。孩子不會餓壞自己，放鬆一點。',
                '哭鬧': '哭鬧是孩子表達需求的方式（雖然很吵）。深呼吸，這會過去的。',
                '不聽話': '不聽話代表孩子在發展自主意識，雖然很挑戰。',
                '功課': '功課壓力不只是孩子的，也是父母的。適可而止。',
                '手足衝突': '手足衝突是正常的，不需要當裁判，只需要當安全網。',
                '出門拖拉': '時間壓力下的拉扯最累。試著預留多一點時間？',
                '3C產品': '3C 大戰是現代父母的共同挑戰，你不是一個人。',
                '生病': '孩子生病時父母的身心俱疲。記得你也需要休息。',
                '學校狀況': '學校的事情會引發很多焦慮。必要時尋求老師的合作。'
            };
            
            if (scenarioAdvice[scenarioTag]) {
                feedback += `\\n\\n💡 ${scenarioAdvice[scenarioTag]}`;
            }
        }
        
        return feedback;
    };

    const handleComplete = () => {
        if (selectedEmotion) {
            onComplete?.({
                emotion: selectedEmotion,
                intensity,
                scenarioTag: selectedTag || undefined,
                note: note || undefined,
                timestamp: new Date().toISOString()
            });
        }
    };

    const renderQuadrantStep = () => (
        <div className="quick-step">
            <div className="quick-header">
                <h2>現在的感受是...</h2>
                <p className="quick-subtitle">選擇最接近的情緒象限</p>
            </div>

            <div className="quadrant-grid">
                {(Object.keys(quadrantConfig) as Quadrant[]).map(quadrant => (
                    <button
                        key={quadrant}
                        className="quadrant-card"
                        style={{ '--quadrant-color': quadrantConfig[quadrant].color } as React.CSSProperties}
                        onClick={() => handleQuadrantSelect(quadrant)}
                    >
                        <span className="quadrant-emoji">{quadrantConfig[quadrant].emoji}</span>
                        <span className="quadrant-label">{quadrantConfig[quadrant].label}</span>
                        <span className="quadrant-desc">{quadrantConfig[quadrant].desc}</span>
                    </button>
                ))}
            </div>

            {onBack && (
                <button className="quick-back-btn" onClick={onBack}>
                    ← 返回首頁
                </button>
            )}
        </div>
    );

    const renderEmotionStep = () => {
        if (!selectedQuadrant) return null;
        const emotions = quickEmotions[selectedQuadrant];

        return (
            <div className="quick-step">
                <div className="quick-header">
                    <h2>更具體一點...</h2>
                    <p className="quick-subtitle">選擇最準確的情緒</p>
                </div>

                <div className="emotion-grid-compact">
                    {emotions.map(emotion => (
                        <button
                            key={emotion.id}
                            className="emotion-card-compact"
                            onClick={() => handleEmotionSelect(emotion)}
                        >
                            <span className="emotion-name">{emotion.name}</span>
                            <span className="emotion-scenario">{emotion.parentScenario}</span>
                        </button>
                    ))}
                </div>

                <button className="quick-back-btn" onClick={() => setStep('quadrant')}>
                    ← 重新選擇象限
                </button>
            </div>
        );
    };

    const renderIntensityStep = () => (
        <div className="quick-step">
            <div className="quick-header">
                <h2>強度是...</h2>
                <p className="quick-subtitle">1-10，{selectedEmotion?.name}的程度</p>
            </div>

            <div className="intensity-slider-container">
                <div className="intensity-value">{intensity}</div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="intensity-slider"
                />
                <div className="intensity-labels">
                    <span>輕微</span>
                    <span>中等</span>
                    <span>強烈</span>
                </div>
            </div>

            <button className="quick-primary-btn" onClick={() => handleIntensitySelect(intensity)}>
                下一步 →
            </button>

            <button className="quick-back-btn" onClick={() => setStep('emotion')}>
                ← 重新選擇情緒
            </button>
        </div>
    );

    const renderScenarioStep = () => (
        <div className="quick-step">
            <div className="quick-header">
                <h2>發生在什麼情境？</h2>
                <p className="quick-subtitle">選擇觸發這個情緒的事件（可跳過）</p>
            </div>

            <div className="scenario-tags">
                {parentScenarioTags.map(tag => (
                    <button
                        key={tag}
                        className={`scenario-tag ${selectedTag === tag ? 'selected' : ''}`}
                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            <div className="note-input-container">
                <label>一句話描述（可選）</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="例如：孩子不肯睡覺，我已經很累了..."
                    rows={3}
                    className="note-input"
                />
            </div>

            <button 
                className="quick-primary-btn" 
                onClick={handleScenarioComplete}
                disabled={isLoading}
            >
                {isLoading ? '生成回饋中...' : '完成記錄 ✅'}
            </button>

            <button className="quick-back-btn" onClick={() => setStep('intensity')}>
                ← 返回
            </button>
        </div>
    );

    const renderFeedbackStep = () => (
        <div className="quick-step feedback-step">
            <div className="feedback-container">
                <div className="feedback-icon">💚</div>
                <h2>給你的回饋</h2>
                
                <div className="feedback-content">
                    {aiFeedback.split('\\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>

                <div className="feedback-summary">
                    <div className="summary-item">
                        <span className="summary-label">情緒</span>
                        <span className="summary-value">{selectedEmotion?.name}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">強度</span>
                        <span className="summary-value">{intensity}/10</span>
                    </div>
                    {selectedTag && (
                        <div className="summary-item">
                            <span className="summary-label">情境</span>
                            <span className="summary-value">{selectedTag}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="feedback-actions">
                <button className="quick-primary-btn" onClick={handleComplete}>
                    保存記錄
                </button>
                <button className="quick-secondary-btn" onClick={onBack}>
                    返回首頁
                </button>
            </div>
        </div>
    );

    return (
        <div className="quick-checkin">
            <div className="quick-container">
                {step === 'quadrant' && renderQuadrantStep()}
                {step === 'emotion' && renderEmotionStep()}
                {step === 'intensity' && renderIntensityStep()}
                {step === 'scenario' && renderScenarioStep()}
                {step === 'feedback' && renderFeedbackStep()}
            </div>
        </div>
    );
};

export default QuickCheckIn;
